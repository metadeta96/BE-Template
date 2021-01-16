const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model');
const { getProfile } = require('./middleware/getProfile');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);


/**
 * Get the contract by id for the calling profile
 * 
 * In case no contract is found it will return 404
 * 
 * @name get/contracts/:id
 * @param {number} profile_id - header - id of the calling profile. Validated on the middleware getProfile
 * @param {number} id - path parameter -  integer id of the contract
 * @returns {Contract} contract by id for the calling profile
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models');
    const { id } = req.params;
    const profile = req.profile;

    const contract = await Contract.findByIdForProfile(profile, id);
    if (!contract) {
        return res.status(404).end();
    }

    res.json(contract);
});

/**
 * Get all non terminated contract for the calling profile
 * 
 * @name get/contracts
 * @param {number} profile_id - header - id of the calling profile. Validated on the middleware getProfile
 * @returns {Array<Contract>} list of non terminated contracts for the calling profile
 */
app.get('/contracts', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models');
    const profile = req.profile;

    const contracts = await Contract.findAllNonTerminatedForProfile(profile);

    res.json(contracts);
});

/**
 * Get all unpaid jobs for the calling profile
 * Only active contracts are considerated.
 * 
 * @name get/jobs/unpaid
 * @param {number} profile_id - header - id of the calling profile. Validated on the middleware getProfile
 * @returns {Array<Contract>} list of non terminated contracts for the calling profile
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const { Job } = req.app.get('models');
    const profile = req.profile;

    const contracts = await Job.findAllUnpaidJobsForProfile(profile);

    res.json(contracts);
});

/**
 * Pay for a unpaid job given the calling profile
 * If the job can not be paid or found status 400 is returned.
 * 
 * @name post/jobs/:job_id/pay
 * @param {number} profile_id - header - id of the calling profile. Validated on the middleware getProfile
 * @param {number} job_id - path parameter - integer id of the job to be paid
 * @returns {void} status 200 on success
 */
app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    const { Job } = req.app.get('models');
    const jobId = req.params.job_id;
    const profile = req.profile;

    const result = await Job.payForJob(profile, jobId);
    if (!result) {
        return res.status(400).json({ error: 'It is not possible to pay for this job' }).end();
    }

    res.sendStatus(200);
});

/**
 * Deposit money into a client balance
 * If the profile is not a client it will return 400.
 * If the amount is invalid or more than 25% of the sum of the unpaid jobs price it will also return 400.
 * 
 * @name post/balances/deposit/:userId
 * @param {number} userId - path parameter - integer id of the profile to receive the deposit
 * @param {number} amount - body parameter - amount to be deposited
 * @returns {void} status 200 on success
 */
app.post('/balances/deposit/:userId', async (req, res) => {
    const { Profile } = req.app.get('models');
    const profileId = req.params.userId;
    const { amount } = req.body;
    const profile = await Profile.findOne({ where: { id: profileId } });

    const result = await Profile.depositOnClientBalance(profile, amount);
    if (!result) {
        return res.status(400).json({ error: 'It is not possible to make this deposit' }).end();
    }

    res.sendStatus(200);
});

/**
 * Get the best paid profession for the given datetime range.
 * The column paymentDate is used to filter the datetime range.
 * If the select returns an empty set then 404 is returned instead.
 * 
 * @name get/admin/best-profession
 * @param {string} start - querystring parameter - an optional datetime string for the start of the datetime range of the query
 * @param {string} end - querystring parameter - an optional datetime string for the end of the datetime range of the query
 * @returns {{"profession": string}} the best paid profession for the given datetime range. 404 if there is no data for the range.
 */
app.get('/admin/best-profession', async (req, res) => {
    const { Profile, Contract, Job } = req.app.get('models');
    let { start, end } = req.query;

    start = new Date(start);
    end = new Date(end);
    let filterByDates = '';
    if (!isNaN(start)) {
        filterByDates += ` AND DATETIME(j.paymentDate) >= DATETIME('${start.toISOString()}')`
    }
    if (!isNaN(end)) {
        filterByDates += ` AND DATETIME(j.paymentDate) < DATETIME('${end.toISOString()}')`
    }

    const result = await sequelize.query(`
        SELECT p.profession 'profession' FROM ${Profile.tableName} p, ${Contract.tableName} c
        LEFT JOIN ${Job.tableName} j ON c.id = j.ContractId
        WHERE p.id = c.ContractorId AND j.paid = 1 ${filterByDates}
        GROUP BY p.profession
        ORDER BY sum(j.price) DESC
    `, { plain: true });
    if (!result) {
        return res.sendStatus(404);
    }

    res.json({
        profession: result.profession,
    });
});

/**
 * Get clients which paid best for jobs for the given datetime range.
 * The column paymentDate is used to filter the datetime range.
 * 
 * @name get/admin/best-clients
 * @param {string} start - querystring parameter - an optional datetime string for the start of the datetime range of the query
 * @param {string} end - querystring parameter - an optional datetime string for the end of the datetime range of the query
 * @param {number} limit - querystring parameter - an optional limiter for the amount of size of the result set. Defaults to 2.
 * @returns {Array<{"id": number, "fullName": string, "paid": number}>} the client profiles ordered by best payments in the given datetime range.
 */
app.get('/admin/best-clients', async (req, res) => {
    const { Profile, Contract, Job } = req.app.get('models');
    let { start, end, limit } = req.query;

    start = new Date(start);
    end = new Date(end);
    let filterByDates = '';
    if (!isNaN(start)) {
        filterByDates += ` AND DATETIME(j.paymentDate) >= DATETIME('${start.toISOString()}')`
    }
    if (!isNaN(end)) {
        filterByDates += ` AND DATETIME(j.paymentDate) < DATETIME('${end.toISOString()}')`
    }
    limit = limit ? parseInt(limit, 10) : 2;
    if (isNaN(limit) || limit <= 0) {
        limit = 2;
    }

    const [result] = await sequelize.query(`
        SELECT p.id 'id', p.firstName 'firstName', max(j.price) 'paid' FROM ${Profile.tableName} p, ${Contract.tableName} c
        LEFT JOIN ${Job.tableName} j ON c.id = j.ContractId
        WHERE p.id = c.ClientId AND j.paid = 1 ${filterByDates}
        GROUP BY p.id
        ORDER BY max(j.price) DESC
        LIMIT ${limit}
    `, { plain: false });

    res.json(result);
});

module.exports = app;
