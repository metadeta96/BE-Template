const Sequelize = require('sequelize');
const { JobPaymentNotPossibleError, NotEnoughFundsError, DepositNotPossibleError } = require('./error');

function buildSequelize() {
  if (process.env.NODE_ENV === 'test') {
    return new Sequelize('sqlite::memory:', {
      dialect: 'sqlite',
      logging: false,
    });
  }
  return new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite3',
  });
}

const sequelize = buildSequelize();

class Profile extends Sequelize.Model {

  static Type = Object.freeze({
    Client: 'client',
    Contractor: 'contractor',
  });

  /**
   * Validates that the amount is a number and bigger than zero
   * Transactions do not accept negative or non number amounts.
   * 
   * @private
   * @static
   * @param {number} amount the amount to be validated
   * @returns {boolean} true if the amount is valid
   */
  static #validateAmount(amount) {
    return typeof amount === 'number' && amount > 0;
  }

  /**
   * Validates that the profile is an instace of Profile and has the expected type
   * Some transactions can only happen for the appropriate profile
   * 
   * @private
   * @static
   * @param {Profile} profile 
   * @param {string} expectedType 
   * @returns {boolean} true if the profile is valid
   */
  static #validateProfile(profile, expectedType) {
    return profile && profile instanceof Profile && profile.type === expectedType;
  }

  /**
   * Transfer money from one client to a contractor
   * The transfer only occurs if the client balance is enough for the amount (balance >= amount)
   * It is also not possible to send money when both profiles are the same or it is not form a client to a contractor
   * Do not provide zero or negative amounts.
   * Both clientProfile and contractorProfile should be an instance of Profile
   * If there is an error during the update the promise will be rejected
   * 
   * @static
   * @async
   * @param {Profile} clientProfile the client profile which is going to send the money
   * @param {Profile} contractorProfile the contractor profile which will receive the money
   * @param {number} amount the amount to be transfered
   * @returns {Promise<{}>} an empty promise if there is no error
   */
  static async payContractor(clientProfile, contractorProfile, amount) {
    if (!this.#validateProfile(clientProfile, Profile.Type.Client)) {
      throw new JobPaymentNotPossibleError('The client profile is not valid for this operation');
    } else if (!this.#validateProfile(contractorProfile, Profile.Type.Contractor)) {
      throw new JobPaymentNotPossibleError('The contractor profile is not valid for this operation');
    } else if (!this.#validateAmount(amount)) {
      throw new JobPaymentNotPossibleError('The amount is not valid for this operation');
    } else if (clientProfile.balance < amount) {
      throw new NotEnoughFundsError('The balance of the client is less than the amount to be transfered');
    } else if (clientProfile.id === contractorProfile.id) {
      throw new JobPaymentNotPossibleError('Transfering to the same account is not allowed');
    }

    clientProfile.balance -= amount;
    contractorProfile.balance += amount;

    await clientProfile.save();
    await contractorProfile.save();
  }

  /**
   * Deposit money into the client balance.
   * It is only possible to deposit on profiles of type client and if the amount is a positive non zero number.
   * It is not allowed to deposit more than 25% of the sum of the unpaid jobs price.
   * 
   * @static
   * @async
   * @param {Profile} clientProfile the client profile which is going to deposit money
   * @param {number} amount the amount to be deposited into the client balance
   * @returns {Promise<{}>} an empty promise if there is no error
   */
  static async depositOnClientBalance(clientProfile, amount) {
    if (!this.#validateProfile(clientProfile, Profile.Type.Client)) {
      throw new DepositNotPossibleError('The client profile is not valid for this operation');
    } else if (!this.#validateAmount(amount)) {
      throw new DepositNotPossibleError('The amount is not valid for this operation');
    }

    const totalToBePaid = await Job.getTotalToBePaid(clientProfile);
    if (totalToBePaid * 0.25 < amount) {
      throw new DepositNotPossibleError('A client cna not deposit more than 25% of the sum of the unpaid jobs price');
    }

    clientProfile.balance += amount;

    await clientProfile.save();
  }

}
Profile.init(
  {
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    profession: {
      type: Sequelize.STRING,
      allowNull: false
    },
    balance: {
      type: Sequelize.DECIMAL(12, 2)
    },
    type: {
      type: Sequelize.ENUM('client', 'contractor')
    }
  },
  {
    sequelize,
    modelName: 'Profile'
  }
);

class Contract extends Sequelize.Model {

  /**
   * The possible Status values for the property status
   */
  static Status = Object.freeze({
    New: 'new',
    InProgress: 'in_progress',
    Terminated: 'terminated',
  });

  /**
   * Build the where query for find methods using the profile
   * If the type of the profile is neither Client nor Contractor it will return undefined
   * 
   * @static
   * @async
   * @param {Profile} profile the profile which owns the contract
   * @param {Object} query optional filters to the final query
   * @returns {Object} the built query or undefined in case of error
   */
  static buildQueryForProfile(profile, query) {
    let key;
    if (profile?.type === Profile.Type.Client) {
      // Filter by ClientId
      key = 'ClientId';
    } else if (profile?.type === Profile.Type.Contractor) {
      // Filter by ContractorId
      key = 'ContractorId';
    } else {
      // It should not happen unless there is an error in the code
      return undefined;
    }

    query = query || {};
    return Object.assign({}, query, {
      [key]: profile.id
    });
  }

  /**
   * Find a contract by id for the given profile
   * Even if the id exists in the database, if the profile does not owns it it will not return the contract.
   * 
   * @static
   * @async
   * @param {*} profile the profile which owns the contract. Either Client or Contractor
   * @param {number} id the id of the contract
   * @returns {Promise<Contract>} the contract or undefined
   */
  static async findByIdForProfile(profile, id) {
    const query = Contract.buildQueryForProfile(profile, { id });
    if (!query) {
      return undefined;
    }

    return await Contract.findOne({ where: query });
  }

  /**
   * Find all contracts for the given profile and query
   * Only return contracts owned by the profile.
   * 
   * @static
   * @async
   * @param {*} profile the profile which owns the contract. Either Client or Contractor
   * @param {*} query an optional query to filter the contracts
   * @returns {Promise<Array<Contract>>} the queried contracts
   */
  static async findAllForProfile(profile, query) {
    query = Contract.buildQueryForProfile(profile, query);
    if (!query) {
      return [];
    }

    return await Contract.findAll({ where: query });
  }

  /**
   * Find all non terminated contracts for the given profile
   * Only return contracts owned by the profile.
   * 
   * @static
   * @async
   * @param {Profile} profile the profile which owns the contract. Either Client or Contractor
   * @returns {Promise<Array<Contract>>} the queried contracts
   */
  static async findAllNonTerminatedForProfile(profile) {
    return Contract.findAllForProfile(profile, {
      status: { [Sequelize.Op.ne]: Contract.Status.Terminated }
    });
  }

}
Contract.init(
  {
    terms: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('new', 'in_progress', 'terminated')
    }
  },
  {
    sequelize,
    modelName: 'Contract'
  }
);

class Job extends Sequelize.Model {

  /**
   * Find all unpaid jobs for the given profile
   * Only return jobs belonging to active contracts owned by the profile.
   * 
   * @static
   * @async
   * @param {Profile} profile the profile which owns the contract. Either Client or Contractor
   * @returns {Promise<Array<Job>>} the unpaid jobs
   */
  static async findAllUnpaidJobsForProfile(profile) {
    const contractQuery = Contract.buildQueryForProfile(profile, { status: Contract.Status.InProgress });
    if (!contractQuery) {
      return [];
    }
    return Job.findAll({
      include: [{
        model: Contract,
        where: contractQuery,
        required: true,
      }],
      where: { paid: { [Sequelize.Op.not]: true } },
    });
  }

  /**
   * Get the total to be paid in jobs given the profile
   * If no job is found or the profile is invalid it will return 0 instead.
   * 
   * @static
   * @async
   * @param {Profile} profile the profile which owns the jobs
   * @returns {Promise<number>} the total to be paid
   */
  static async getTotalToBePaid(profile) {
    const contractQuery = Contract.buildQueryForProfile(profile, { status: Contract.Status.InProgress });
    if (!contractQuery) {
      return 0;
    }

    return Job.sum('price', {
      include: [{
        model: Contract,
        where: contractQuery,
        required: true,
      }],
      where: { paid: { [Sequelize.Op.not]: true } },
    });
  }

  /**
   * Pay a job from the given client profile
   * Only pay if the job has not been paid yet and the profile belongs to a client.
   * 
   * @static
   * @async
   * @param {Profile} profile the client profile which owns the job
   * @returns {Promise<{}>} an empty promise if there is no error
   */
  static async payForJob(profile, id) {
    if (!profile) {
      throw new JobPaymentNotPossibleError('There is no job to be paid', 404);
    }

    const job = await Job.findOne({
      include: [{
        model: Contract,
        required: true,
        include: [
          {
            model: Profile,
            where: { id: profile.id },
            required: true,
            as: 'Client',
          },
          {
            model: Profile,
            required: true,
            as: 'Contractor'
          }
        ],
      }],
      where: { id, paid: { [Sequelize.Op.not]: true } },
    });

    if (!job) {
      throw new JobPaymentNotPossibleError('There is no job to be paid', 404);
    }
    const { Client, Contractor } = job.Contract;

    await Profile.payContractor(Client, Contractor, job.price);

    job.paid = true;
    job.paymentDate = new Date();
    await job.save();
  }

}
Job.init(
  {
    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    price: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    paid: {
      type: Sequelize.BOOLEAN,
      default: false
    },
    paymentDate: {
      type: Sequelize.DATE
    }
  },
  {
    sequelize,
    modelName: 'Job'
  }
);

Profile.hasMany(Contract, { as: 'Contractor', foreignKey: 'ContractorId' });
Contract.belongsTo(Profile, { as: 'Contractor' });
Profile.hasMany(Contract, { as: 'Client', foreignKey: 'ClientId' });
Contract.belongsTo(Profile, { as: 'Client' });
Contract.hasMany(Job);
Job.belongsTo(Contract);

module.exports = {
  sequelize,
  Profile,
  Contract,
  Job
};
