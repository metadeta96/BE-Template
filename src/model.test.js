const { Profile, Contract, Job } = require('./model');

async function reSeedDatabase() {
    return require('../scripts/seedDb')();
}

describe('Contract model', () => {
    let profile;
    beforeEach(async () => {
        await reSeedDatabase();
        profile = await Profile.findOne({ where: { id: 1 } });
    });

    it('should get contract for the client profile which owns it', async () => {
        const contract = await Contract.findByIdForProfile(profile, 1);

        expect(contract).toMatchObject({
            ClientId: profile.id,
            ContractorId: 5,
            id: 1,
            status: 'terminated',
            terms: 'bla bla bla',
        });
        expect(contract).toHaveProperty('createdAt');
        expect(contract).toHaveProperty('updatedAt');
    });

    it('should get contract for the contractor profile which owns it', async () => {
        const contract = await Contract.findByIdForProfile(profile, 1);

        expect(contract).toMatchObject({
            ClientId: profile.id,
            ContractorId: 5,
            id: 1,
            status: 'terminated',
            terms: 'bla bla bla',
        });
        expect(contract).toHaveProperty('createdAt');
        expect(contract).toHaveProperty('updatedAt');
    });

    it('should not get contract for a profile which does not own it', async () => {
        const contract = await Contract.findByIdForProfile({ id: -1, type: Profile.Type.Client }, 1);

        expect(contract).toBeFalsy();
    });

    it('should get all contracts for the calling profile', async () => {
        const contracts = await Contract.findAllForProfile(profile, { terms: 'bla bla bla' });

        expect(contracts.length).toEqual(2);
        for (const contract of contracts) {
            expect(contract).toBeTruthy();
        }
    });

    it('should get all non terminated contracts for the calling profile', async () => {
        const contracts = await Contract.findAllNonTerminatedForProfile(profile);

        expect(contracts.length).toEqual(1);
        for (const contract of contracts) {
            expect(contract).toBeTruthy();
            expect(contract.status).not.toEqual('terminated');
        }
    });
});


describe('Job model', () => {
    let profile;
    beforeEach(async () => {
        await reSeedDatabase();
        profile = await Profile.findOne({ where: { id: 1 } });
    });

    it('should get all unpaid jobs for active contracts given the profile', async () => {
        const jobs = await Job.findAllUnpaidJobsForProfile(profile);

        expect(jobs.length).toEqual(1);
        for (const job of jobs) {
            expect(job).toBeTruthy();
            expect(job.paid).not.toEqual(true);
        }
    });

    it('should pay for an unpaid job', async () => {
        const result = await Job.payForJob(profile, 1);

        expect(result).toBe(true);
    });

    it('should not pay if the job is already paid', async () => {
        const paidJob = await Job.findOne({ where: { paid: true } });
        const result = await Job.payForJob(profile, paidJob.id);

        expect(result).toBe(false);
    });

    it('should not pay if the profile is falsy', async () => {
        const result = await Job.payForJob(undefined, 1);

        expect(result).toBe(false);
    });
});


describe('Profile model - contractor payment', () => {
    beforeEach(async () => {
        await reSeedDatabase();
    });

    it('should transfer money from one client to a contractor', async () => {
        const price = 200;
        const clientProfile = await Profile.findOne({ where: { id: 1 } });
        const contractorProfile = await Profile.findOne({ where: { id: 5 } });
        const clientBalance = clientProfile.balance;
        const contractorBalance = contractorProfile.balance;

        const result = await Profile.payContractor(clientProfile, contractorProfile, price);

        expect(result).toBe(true);

        expect(clientProfile.balance).toEqual(clientBalance - price);
        expect(contractorProfile.balance).toEqual(contractorBalance + price);
    });

    it('should not transfer money if client is not an instance of Profile', async () => {
        const price = 200;
        const clientProfile = await Profile.findOne({ where: { id: 1 } });
        const contractorProfile = await Profile.findOne({ where: { id: 5 } });
        const clientBalance = clientProfile.balance;
        const contractorBalance = contractorProfile.balance;

        const result = await Profile.payContractor(undefined, contractorProfile, price);

        expect(result).toBe(false);

        expect(clientProfile.balance).toEqual(clientBalance);
        expect(contractorProfile.balance).toEqual(contractorBalance);
    });

    it('should not transfer money if contractor is not an instance of Profile', async () => {
        const price = 200;
        const clientProfile = await Profile.findOne({ where: { id: 1 } });
        const contractorProfile = await Profile.findOne({ where: { id: 5 } });
        const clientBalance = clientProfile.balance;
        const contractorBalance = contractorProfile.balance;

        const result = await Profile.payContractor(clientProfile, undefined, price);

        expect(result).toBe(false);

        expect(clientProfile.balance).toEqual(clientBalance);
        expect(contractorProfile.balance).toEqual(contractorBalance);
    });

    it('should not transfer money if amount equals zero', async () => {
        const price = 0;
        const clientProfile = await Profile.findOne({ where: { id: 1 } });
        const contractorProfile = await Profile.findOne({ where: { id: 5 } });
        const clientBalance = clientProfile.balance;
        const contractorBalance = contractorProfile.balance;

        const result = await Profile.payContractor(clientProfile, contractorProfile, price);

        expect(result).toBe(false);

        expect(clientProfile.balance).toEqual(clientBalance);
        expect(contractorProfile.balance).toEqual(contractorBalance);
    });

    it('should not transfer money if amount is less than zero', async () => {
        const price = -200;
        const clientProfile = await Profile.findOne({ where: { id: 1 } });
        const contractorProfile = await Profile.findOne({ where: { id: 5 } });
        const clientBalance = clientProfile.balance;
        const contractorBalance = contractorProfile.balance;

        const result = await Profile.payContractor(clientProfile, contractorProfile, price);

        expect(result).toBe(false);

        expect(clientProfile.balance).toEqual(clientBalance);
        expect(contractorProfile.balance).toEqual(contractorBalance);
    });

    it('should not transfer money if balance is less than the amount', async () => {
        const clientProfile = await Profile.findOne({ where: { id: 1 } });
        const contractorProfile = await Profile.findOne({ where: { id: 5 } });
        const clientBalance = clientProfile.balance;
        const contractorBalance = contractorProfile.balance;

        const result = await Profile.payContractor(clientProfile, contractorProfile, clientBalance + 20);

        expect(result).toBe(false);

        expect(clientProfile.balance).toEqual(clientBalance);
        expect(contractorProfile.balance).toEqual(contractorBalance);
    });

    it('should not transfer money if both profiles are the same', async () => {
        const price = 200;
        const clientProfile = await Profile.findOne({ where: { id: 1 } });
        const contractorProfile = await Profile.findOne({ where: { id: 5 } });
        const clientBalance = clientProfile.balance;
        const contractorBalance = contractorProfile.balance;

        const result = await Profile.payContractor(clientProfile, clientProfile, price);

        expect(result).toBe(false);

        expect(clientProfile.balance).toEqual(clientBalance);
        expect(contractorProfile.balance).toEqual(contractorBalance);
    });

    it('should not transfer money if client profile is not of type client', async () => {
        const price = 2;
        const clientProfile = await Profile.findOne({ where: { id: 1 } });
        const contractorProfile = await Profile.findOne({ where: { id: 5 } });
        const clientBalance = clientProfile.balance;
        const contractorBalance = contractorProfile.balance;

        clientProfile.id = contractorProfile.id;
        const result = await Profile.payContractor(contractorProfile, contractorProfile, price);

        expect(result).toBe(false);

        expect(clientProfile.balance).toEqual(clientBalance);
        expect(contractorProfile.balance).toEqual(contractorBalance);
    });

    it('should not transfer money if contractor profile is not of type contractor', async () => {
        const price = 2;
        const clientProfile = await Profile.findOne({ where: { id: 1 } });
        const contractorProfile = await Profile.findOne({ where: { id: 5 } });
        const clientBalance = clientProfile.balance;
        const contractorBalance = contractorProfile.balance;

        clientProfile.id = contractorProfile.id;
        const result = await Profile.payContractor(clientProfile, clientProfile, price);

        expect(result).toBe(false);

        expect(clientProfile.balance).toEqual(clientBalance);
        expect(contractorProfile.balance).toEqual(contractorBalance);
    });
});
