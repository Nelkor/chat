const Sequelize = require('sequelize');

const config = {
  dialect: 'sqlite',
  storage: 'db/database.sqlite',
  logging: false
};

const connection = new Sequelize(config);

module.exports = connection;
