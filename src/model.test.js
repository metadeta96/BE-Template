const { Profile, Contract } = require('./model');

async function reSeedDatabase() {
    return require('../scripts/seedDb');
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
        expect(contract.createdAt instanceof Date).toBe(true);
        expect(contract.updatedAt instanceof Date).toBe(true);
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
        expect(typeof contract.createdAt instanceof Date).toBe(true);
        expect(typeof contract.updatedAt instanceof Date).toBe(true);
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
