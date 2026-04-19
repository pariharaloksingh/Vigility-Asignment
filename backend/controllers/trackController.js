const { FeatureClick } = require("../models");

const allowedFeatures = [
  "date_filter",
  "age_filter",
  "gender_filter",
  "bar_chart_click",
  "line_chart_view",
  "apply_filters",
  "refresh_button",
  "page_view"
];

exports.trackFeature = async (req, res) => {
  try {
    const { featureName } = req.body;

    // ✅ single validation (required + allowed)
    if (!featureName || !allowedFeatures.includes(featureName)) {
      return res.status(400).json({
        msg: "Invalid featureName"
      });
    }

    const click = await FeatureClick.create({
      featureName,
      userId: req.user.id,
    });

    res.status(201).json({
      msg: "Tracked successfully",
      data: click,
    });

  } catch (err) {
    res.status(500).json({ msg: "Error", error: err.message });
  }
};