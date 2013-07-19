module.exports = function(sequelize, DataTypes) {
  var Stats = sequelize.define('Stats', {
    userid: DataTypes.INTEGER,
    date: DataTypes.DATE,
    calories: DataTypes.INTEGER,
    steps: DataTypes.INTEGER
  });

  return Stats;
}
