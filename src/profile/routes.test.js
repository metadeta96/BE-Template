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

describe('Profile /balances/deposit/:userId', () => {
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
            error: 'It is not possible to deposit this amount on this profile balance',
            message: 'The client profile is not valid for this operation',
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
            error: 'It is not possible to deposit this amount on this profile balance',
            message: 'A client cna not deposit more than 25% of the sum of the unpaid jobs price',
        });
    });
});
