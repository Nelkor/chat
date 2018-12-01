const { DataTypes } = require('sequelize');
const connection = require('../connection');

const users = connection.define('users',
  {
    name: DataTypes.STRING, // TODO хранить полное имя и отдельно имя в нижнем регистре
    hash: DataTypes.STRING
  },
  {
    paranoid: true
  }
);

module.exports = users;
