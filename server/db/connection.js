const Sequelize = require('sequelize');

const config = {
  dialect: 'sqlite',
  storage: 'db/database.sqlite',
};

const connection = new Sequelize(config);

module.exports = connection;

// TODO убрать нотисы от Sequelize
