module.exports = function(sequelize, DataTypes) {
  var Token = sequelize.define('Token', {
      userid: {
        type: DataTypes.INTEGER,
        references: "User",
        referenceKey: "id"
      },
      service: {
        type: DataTypes.ENUM,
        values: ['nike', 'fitbit'],
        allowNull: false
      },
      token: DataTypes.STRING,
      secret: DataTypes.STRING
    });

  return Token;
};