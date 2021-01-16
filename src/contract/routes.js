const { Router } = require('express');
const { getProfile } = require('../middleware/getProfile');

const router = new Router();

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
router.get('/contracts/:id', getProfile, async (req, res) => {
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
router.get('/contracts', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models');
    const profile = req.profile;

    const contracts = await Contract.findAllNonTerminatedForProfile(profile);

    res.json(contracts);
});

module.exports = router;
