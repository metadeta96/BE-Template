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
 * Profile can be either a client or a contractor otherwise it will return 404 automatically
 * 
 * @name get/contracts/:id
 * @returns contract by id for the calling profile
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models');
    const { id } = req.params;
    const profile = req.profile;

    const query = { id };
    if (profile?.type === 'client') {
        // Filter by ClientId
        query.ClientId = profile.id;
    } else if (profile?.type === 'contractor') {
        // Filter by ContractorId
        query.ContractorId = profile.id;
    } else {
        // It should not happen unless there is an error in the code
        return res.status(404).end();
    }

    const contract = await Contract.findOne({ where: query });
    if (!contract) {
        return res.status(404).end();
    }

    res.json(contract);
})
module.exports = app;
