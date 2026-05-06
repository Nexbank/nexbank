const dns = require("dns");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profile");
const bankingRoutes = require("./routes/bankingRoutes");
const paybillRoutes = require("./routes/paybill");
const notificationRoutes = require("./routes/notificationRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const PORT = Number(process.env.PORT || 5000);

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get(["/healthz", "/api/healthz"], (req, res) => {
    res.status(200).json({
      status: "ok",
      service: "nexbank-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/profile", profileRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/banking", bankingRoutes);
  app.use("/api/banking", paybillRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/notifications", notificationRoutes);

  app.get("/", (req, res) => {
    res.send("NexBank API running...");
  });

  return app;
};

const connectToDatabase = async () => {
  if (process.env.SKIP_DB === "true") {
    console.log("Skipping MongoDB connection");
    return null;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Connected");
  return mongoose.connection;
};

const startServer = async ({ port = PORT } = {}) => {
  await connectToDatabase();

  const app = createApp();

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${server.address().port}`);
      resolve(server);
    });
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  createApp,
  connectToDatabase,
  startServer,
};
