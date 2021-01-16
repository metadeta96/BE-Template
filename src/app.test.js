const request = require('supertest');
const app = require('./app');

describe('App', () => {
    it('should return 404 for an unkown route', async () => {
        const res = await request(app)
            .get(`/not-registered-route974352632`);

        expect(res.status).toEqual(404);
    });
});
