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
 * @param id {number} integer id of the contract
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

module.exports = app;
