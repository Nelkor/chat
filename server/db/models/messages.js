const { DataTypes } = require('sequelize');
const connection = require('../connection');

const users = require('./users');

const messages = connection.define('messages',
  {
    content: DataTypes.TEXT
  },
  {
    paranoid: true
  }
);

messages.belongsTo(users);

module.exports = messages;
