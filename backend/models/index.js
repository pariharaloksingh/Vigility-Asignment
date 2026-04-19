const User = require("./User");
const FeatureClick = require("./FeatureClick");

// 🔗 Relationships
User.hasMany(FeatureClick, { foreignKey: "userId" });
FeatureClick.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  User,
  FeatureClick,
};