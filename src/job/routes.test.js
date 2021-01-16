const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('../model');
const router = require('./routes');

const app = express();

app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);
app.use(router);

async function reSeedDatabase() {
    return require('../../scripts/seedDb')();
}

describe('Job /jobs/unpaid', () => {
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
});

describe('Job /jobs/:job_id/pay', () => {
    beforeEach(async () => {
        await reSeedDatabase();
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
        expect(res.statusCode).toEqual(404);
        expect(res.body).toMatchObject({
            error: 'It is not possible to pay for this job',
            message: 'There is no job to be paid',
        });
    });

    it('should not pay for a job if it is not found given the profile', async () => {
        const profileId = 1;
        const jobId = 3;
        const res = await request(app)
            .post(`/jobs/${jobId}/pay`)
            .set('profile_id', profileId);
        expect(res.statusCode).toEqual(404);
        expect(res.body).toMatchObject({
            error: 'It is not possible to pay for this job',
            message: 'There is no job to be paid',
        });
    });
});
