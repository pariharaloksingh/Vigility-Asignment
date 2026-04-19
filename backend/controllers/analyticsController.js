const { FeatureClick, User } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

exports.getAnalytics = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      age_min,
      age_max,
      gender,
      featureName
    } = req.query;

    const where = {};
    const userWhere = {};

    // 📅 Date filter
    if (start_date && end_date) {
      where.createdAt = {
        [Op.between]: [
          new Date(start_date),
          new Date(end_date + "T23:59:59") // include full day
        ],
      };
    }

    // 👤 Age filter
    if (age_min && age_max) {
      userWhere.age = {
        [Op.between]: [parseInt(age_min), parseInt(age_max)],
      };
    }

    // 🚻 Gender filter
    if (gender) {
      userWhere.gender = gender;
    }

    // 🎯 Feature filter
    if (featureName) {
      where.featureName = featureName;
    }

    // 📊 BAR CHART (feature count)
    const barData = await FeatureClick.findAll({
      attributes: [
        "featureName",
        [fn("COUNT", col("FeatureClick.id")), "count"],
      ],
      where,
      include: [{
        model: User,
        attributes: [],
        where: userWhere,
        required: Object.keys(userWhere).length > 0, // 🔥 important fix
      }],
      group: ["FeatureClick.featureName"], // 🔥 fix
      raw: true
    });

    // 📈 LINE CHART (date-wise)
    const lineData = await FeatureClick.findAll({
      attributes: [
        [fn("DATE", col("FeatureClick.createdAt")), "date"],
        [fn("COUNT", col("FeatureClick.id")), "count"],
      ],
      where,
      include: [{
        model: User,
        attributes: [],
        where: userWhere,
        required: Object.keys(userWhere).length > 0, // 🔥 important fix
      }],
      group: [literal("date")],
      order: [[literal("date"), "ASC"]],
      raw: true
    });

    res.json({
      barChart: barData,
      lineChart: lineData,
    });

  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ msg: "Error", error: err.message });
  }
};