'use strict';

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        isEmail: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        notEmpty: true
      },
      service: DataTypes.ENUM('nike', 'fitbit', 'bodymedia'),
      token: DataTypes.STRING,
      secret: DataTypes.STRING,
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }

    });

  return User;
};