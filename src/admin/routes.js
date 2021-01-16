const { Router } = require('express');

const router = new Router();

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
router.get('/admin/best-profession', async (req, res) => {
    const sequelize = req.app.get('sequelize');
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
router.get('/admin/best-clients', async (req, res) => {
    const sequelize = req.app.get('sequelize');
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

module.exports = router;
