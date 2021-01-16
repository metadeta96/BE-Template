const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { sequelize } = require('./model');
const contract = require('./contract/routes');
const job = require('./job/routes');
const profile = require('./profile/routes');
const admin = require('./admin/routes');

const app = express();

app.use(helmet());
app.disable('x-powered-by');

app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

app.use(contract);
app.use(job);
app.use(profile);
app.use(admin);

app.use((req, res) => {
    return res.sendStatus(404);
})

module.exports = app;
