const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
     allowNull: true,
     validate: {
      min: 1,
      max: 100
    }
  },
  gender: {
    type: DataTypes.STRING,
     allowNull: true,
     validate: {
      isIn: [['Male', 'Female', 'Other']]
    }
  },

  
});

module.exports = User;