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

describe('Admin /admin/best-profession', () => {
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


describe('Admin /admin/best-clients', () => {
    beforeEach(async () => {
        await reSeedDatabase();
    });

    it('should return the clients which paid best for jobs', async () => {
        const res = await request(app)
            .get(`/admin/best-clients`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject([
            { firstName: 'Ash', id: 4, paid: 2020 },
            { firstName: 'John', id: 3, paid: 200 },
        ]);
    });

    it('should return the clients which paid best with a start param', async () => {
        const res = await request(app)
            .get(`/admin/best-clients?start=2020-08-16`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject([
            { firstName: 'John', id: 3, paid: 200 },
            { firstName: 'Mr', id: 2, paid: 200 },
        ]);
    });

    it('should return the clients which paid best with an end param', async () => {
        const res = await request(app)
            .get(`/admin/best-clients?end=2020-08-16`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject([
            { firstName: 'Ash', id: 4, paid: 2020 },
            { firstName: 'Harry', id: 1, paid: 200 },
        ]);
    });

    it('should return the "top 10" clients which paid best for jobs', async () => {
        const res = await request(app)
            .get(`/admin/best-clients?limit=10`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject([
            { firstName: 'Ash', id: 4, paid: 2020 },
            { firstName: 'John', id: 3, paid: 200 },
            { firstName: 'Mr', id: 2, paid: 200 },
            { firstName: 'Harry', id: 1, paid: 200 },
        ]);
    });

    it('should return the "top 10" clients which paid best for jobs in the given datetime range', async () => {
        const res = await request(app)
            .get(`/admin/best-clients?limit=10&end=2020-08-16&start=2020-08-15`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject([
            { firstName: 'Ash', id: 4, paid: 2020 },
            { firstName: 'Harry', id: 1, paid: 200 },
            { firstName: 'Mr', id: 2, paid: 121 },
        ]);
    });

    it('should return an empty set if there is no data', async () => {
        const res = await request(app)
            .get(`/admin/best-clients?end=1999-08-01`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject([]);
    });

    it('should return the two clients which paid best for jobs when limit is zero or negative', async () => {
        let res = await request(app)
            .get(`/admin/best-clients?limit=0`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject([
            { firstName: 'Ash', id: 4, paid: 2020 },
            { firstName: 'John', id: 3, paid: 200 },
        ]);

        res = await request(app)
            .get(`/admin/best-clients?limit=-10`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject([
            { firstName: 'Ash', id: 4, paid: 2020 },
            { firstName: 'John', id: 3, paid: 200 },
        ]);
    });
});
