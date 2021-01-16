const { Router } = require('express');
const { handleError } = require('../middleware');

const router = new Router();

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
router.post('/balances/deposit/:userId', async (req, res, next) => {
    const { Profile } = req.app.get('models');
    const profileId = req.params.userId;
    const { amount } = req.body;
    const profile = await Profile.findOne({ where: { id: profileId } });

    try {
        await Profile.depositOnClientBalance(profile, amount);
    } catch (err) {
        return next(err);
    }

    res.sendStatus(200);
});

router.use(handleError);

module.exports = router;
