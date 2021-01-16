const request = require('supertest');
const app = require('./app');

async function reSeedDatabase() {
    return require('../scripts/seedDb')();
}

describe('Contract endpoints', () => {
    beforeEach(async () => {
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
    beforeEach(async () => {
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
            expect(job.Contract).toBeTruthy();
            expect(job.paid).toBeFalsy();
        }
    });

    it('should pay for an unpaid job given the profile', async () => {
        const profileId = 1;
        const jobId = 1;
        const res = await request(app)
            .post(`/jobs/${jobId}/pay`)
            .set('profile_id', profileId);
        expect(res.statusCode).toEqual(200);
    });

    it('should not pay for a job if it is not found given the profile', async () => {
        const profileId = 1;
        const jobId = 3;
        const res = await request(app)
            .post(`/jobs/${jobId}/pay`)
            .set('profile_id', profileId);
        expect(res.statusCode).toEqual(400);
        expect(res.body).toMatchObject({
            error: 'It is not possible to pay for this job'
        });
    });

    it('should not pay for a job if it is not found given the profile', async () => {
        const profileId = 1;
        const jobId = 3;
        const res = await request(app)
            .post(`/jobs/${jobId}/pay`)
            .set('profile_id', profileId);
        expect(res.statusCode).toEqual(400);
        expect(res.body).toMatchObject({
            error: 'It is not possible to pay for this job'
        });
    });
});

describe('Profile endpoints', () => {
    beforeEach(async () => {
        await reSeedDatabase();
    });

    it('should deposit money into a client balance', async () => {
        const profileId = 1;
        const amount = 20;
        const res = await request(app)
            .post(`/balances/deposit/${profileId}`)
            .send({ amount });
        expect(res.statusCode).toEqual(200);
    });

    it('should not deposit money into a non client balance', async () => {
        const profileId = 5;
        const amount = 20;
        const res = await request(app)
            .post(`/balances/deposit/${profileId}`)
            .send({ amount });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toMatchObject({
            error: 'It is not possible to make this deposit'
        });
    });

    it('should not deposit money more than 25% of the sum of the unpaid jobs price', async () => {
        const profileId = 1;
        const amount = 99999999999;
        const res = await request(app)
            .post(`/balances/deposit/${profileId}`)
            .send({ amount });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toMatchObject({
            error: 'It is not possible to make this deposit'
        });
    });
});

describe('Admin endpoints', () => {
    beforeEach(async () => {
        await reSeedDatabase();
    });

    it('should return the most well paid profession', async () => {
        const res = await request(app)
            .get(`/admin/best-profession`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            profession: 'Programmer',
        });
    });

    it('should return the most well paid profession starting at a datetime', async () => {
        const res = await request(app)
            .get(`/admin/best-profession?start=2020-08-17`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            profession: 'Musician',
        });
    });

    it('should return the most well paid profession ending at a datetime', async () => {
        const res = await request(app)
            .get(`/admin/best-profession?end=2020-08-16`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            profession: 'Programmer',
        });
    });

    it('should return the most well paid profession on a given datetime range', async () => {
        const res = await request(app)
            .get(`/admin/best-profession?start=2020-08-14&end=2020-08-17`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            profession: 'Programmer',
        });
    });

    it('should return 404 if there is no data for the given datetime range', async () => {
        const res = await request(app)
            .get(`/admin/best-profession?start=2022-08-14&end=2022-08-17`);

        expect(res.statusCode).toEqual(404);
    });
});
