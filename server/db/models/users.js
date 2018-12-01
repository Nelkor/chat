const { DataTypes } = require('sequelize');
const connection = require('../connection');

const users = connection.define('users',
  {
    name: DataTypes.STRING,
    hash: DataTypes.STRING
  },
  {
    paranoid: true
  }
);

module.exports = users;
