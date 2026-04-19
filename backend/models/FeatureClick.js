const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const FeatureClick = sequelize.define("FeatureClick", {
  featureName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  
});

module.exports = FeatureClick;