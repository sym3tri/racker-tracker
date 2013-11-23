'use strict';

module.exports = function(sequelize, DataTypes) {
  var Office = sequelize.define('Office', {
    name: DataTypes.STRING,
    code: DataTypes.STRING
  });

  return Office;
};
