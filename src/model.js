const Sequelize = require('sequelize');

function buildSequelize() {
  if (process.env.NODE_ENV === 'test') {
    return new Sequelize('sqlite::memory:', {
  dialect: 'sqlite',
      logging: false,
    });
  }
  return new Sequelize('sqlite', {
    dialect: 'sqlite',
    storage: process.env.Database || './database.sqlite3',
  });
}

const sequelize = buildSequelize();

class Profile extends Sequelize.Model {

  static Type = Object.freeze({
    Client: 'client',
    Contractor: 'contractor',
  });

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
      attributes: { exclude: ['Contract'] },
      where: { paid: { [Sequelize.Op.not]: true } },
    });
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
