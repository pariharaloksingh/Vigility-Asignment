const express = require("express");
const app = express();
const sequelize = require("./config/db");
const cors = require("cors");

// import models
require("./models");

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/track", require("./routes/track"));
app.use("/analytics", require("./routes/analytics"));

app.get("/", (req, res) => {
  res.send(`Server running 🚀 (PID: ${process.pid})`);
});

// DB connection
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log(`DB Connected ✅ (PID: ${process.pid})`);

    await sequelize.sync();
    console.log(`Tables ready ✅ (PID: ${process.pid})`);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀 (PID: ${process.pid})`);
    });
  } catch (err) {
    console.log("DB Error ❌", err);
  }
};

module.exports = startServer;