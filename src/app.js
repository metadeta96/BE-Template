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
 * @param {number} id integer id of the contract
 * @name get/contracts/:id
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
 * @param {number} job_id integer id of the job to be paid
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

module.exports = app;
