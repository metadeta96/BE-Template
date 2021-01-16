const request = require('supertest');
const app = require('./app');

async function reSeedDatabase() {
    return require('../scripts/seedDb')();
}

describe('Contract endpoints', () => {
    beforeAll(async () => {
        await reSeedDatabase();
    });

    it('should get contract for the client profile which owns it', async () => {
        const contractId = 1;
        const profileId = 1;
        const res = await request(app)
            .get(`/contracts/${contractId}`)
            .set('profile_id', profileId);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            ClientId: profileId,
            ContractorId: 5,
            // createdAt: '2021-01-15T12:51:41.931Z',
            id: 1,
            status: 'terminated',
            terms: 'bla bla bla',
            // updatedAt: '2021-01-15T12:51:41.931Z'
        });
        expect(res.body).toHaveProperty('createdAt');
        expect(res.body).toHaveProperty('updatedAt');
        expect(typeof res.body.createdAt === 'string').toBe(true);
        expect(typeof res.body.updatedAt === 'string').toBe(true);
    });

    it('should get contract for the contractor profile which owns it', async () => {
        const contractId = 1;
        const profileId = 5;
        const res = await request(app)
            .get(`/contracts/${contractId}`)
            .set('profile_id', profileId);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            ClientId: 1,
            ContractorId: profileId,
            // createdAt: '2021-01-15T12:51:41.931Z',
            id: 1,
            status: 'terminated',
            terms: 'bla bla bla',
            // updatedAt: '2021-01-15T12:51:41.931Z'
        });
        expect(res.body).toHaveProperty('createdAt');
        expect(res.body).toHaveProperty('updatedAt');
        expect(typeof res.body.createdAt === 'string').toBe(true);
        expect(typeof res.body.updatedAt === 'string').toBe(true);
    });

    it('should not get contract for a profile which does not own it', async () => {
        const contractId = 1;
        const profileId = 2;
        const res = await request(app)
            .get(`/contracts/${contractId}`)
            .set('profile_id', profileId);
        expect(res.statusCode).toEqual(404);
    });

    it('should get all non terminated contracts for the calling profile', async () => {
        const profileId = 4;
        const res = await request(app)
            .get('/contracts')
            .set('profile_id', profileId);
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(3);
        for (const contract of res.body) {
            expect(contract).toBeTruthy();
            expect(contract.status).not.toEqual('terminated');
        }
    });
});

describe('Job endpoints', () => {
    beforeAll(async () => {
        await reSeedDatabase();
    });

    it('should get all unpaid jobs for active contracts given the profile', async () => {
        const profileId = 1;
        const res = await request(app)
            .get('/jobs/unpaid')
            .set('profile_id', profileId);
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(1);
        for (const job of res.body) {
            expect(job).toBeTruthy();
            expect(job).not.toHaveProperty('Contract');
            expect(job.paid).not.toEqual(true);
        }
    });
});
