const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");

router.post("/register", async (req, res) => {
  try {
    const { firstname, surname, email, password, phone, saIdNumber, address } = req.body;

    if (!firstname || !surname || !email || !password || !phone || !saIdNumber || !address) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    console.log(`Register attempt: ${email}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      surname,
      email,
      password: hashedPassword,
      displayName: `${firstname} ${surname}`.trim(),
      phone,
      saIdNumber,
      address,
      location: address,
    });

    await newUser.save();
    console.log(`User registered: ${email}`);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }

    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "nexbank-dev-secret",
      { expiresIn: "1d" }
    );

    const safeUser = user.toObject();
    delete safeUser.password;

    console.log(`Successfully logged in: ${email}`);

    res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
