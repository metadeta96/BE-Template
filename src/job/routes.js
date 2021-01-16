const { Router } = require('express');
const { getProfile, handleError } = require('../middleware');

const router = new Router();

/**
 * Get all unpaid jobs for the calling profile
 * Only active contracts are considerated.
 * 
 * @name get/jobs/unpaid
 * @param {number} profile_id - header - id of the calling profile. Validated on the middleware getProfile
 * @returns {Array<Contract>} list of non terminated contracts for the calling profile
 */
router.get('/jobs/unpaid', getProfile, async (req, res) => {
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
router.post('/jobs/:job_id/pay', getProfile, async (req, res, next) => {
    const { Job } = req.app.get('models');
    const jobId = req.params.job_id;
    const profile = req.profile;

    try {
        await Job.payForJob(profile, jobId);
    } catch (err) {
        return next(err);
    }

    res.sendStatus(200);
});

router.use(handleError);

module.exports = router;
