const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");

require("dotenv").config();

const app = express();

// Middleware

app.use(cors());

app.use(express.json());

// Routes

const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

// MongoDB Connection

mongoose

  .connect(process.env.MONGO_URI)
  

  .then(() => console.log("✅ MongoDB Connected"))

  .catch((err) => console.log(err));

// Test Route

app.get("/", (req, res) => {
  res.send("NexBank API running...");
});

// Start Server

const PORT = 5000;


app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
