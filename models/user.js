module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      isEmail: true
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true
    },
    lastname: {
      type: DataTypes.STRING, allowNull: false,
      notEmpty: true
    },
    service: DataTypes.ENUM('nike', 'fitbit'),
    token: DataTypes.STRING
  });

  return User;
}
