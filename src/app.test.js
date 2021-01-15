const request = require('supertest');
const app = require('./app');

describe('Contract endpoints', () => {
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
        expect(typeof res.body.createdAt === 'string').toBeTruthy();
        expect(typeof res.body.updatedAt === 'string').toBeTruthy();
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
        expect(typeof res.body.createdAt === 'string').toBeTruthy();
        expect(typeof res.body.updatedAt === 'string').toBeTruthy();
    });
});