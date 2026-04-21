const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");

// OTP helper
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

// transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Step 1: Verify ID exists
router.post("/verify-identity", async (req, res) => {
  try {
    const { saIdNumber } = req.body;

    const user = await User.findOne({ saIdNumber });

    if (!user) {
      return res.status(400).json({ error: "ID number not found in our records" });
    }

    res.json({ 
      message: "Identity verified successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Identity verification failed" });
  }
});

// Step 2: Send OTP to email
router.post("/send-email-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Email not found" });
    }

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email, type: "email" });

    const emailOtp = generateOtp();

    // Store OTP in database
    await Otp.create({
      userId: user._id,
      email,
      type: "email",
      otp: emailOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    });

    // Send email OTP
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "NexBank Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #0047ab;">NexBank Password Reset</h2>
          <p>You requested to reset your password. Use the following OTP to verify your email:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; letter-spacing: 5px; font-weight: bold; border-radius: 5px;">
            ${emailOtp}
          </div>
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr />
          <small style="color: #666;">NexBank - Your money simplified</small>
        </div>
      `,
    });

    console.log(`OTP sent to ${email}: ${emailOtp}`); // For debugging

    res.json({ message: "OTP sent to your email address" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Step 3: Verify OTP
router.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({
      email,
      type: "email",
      otp: otp,
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    // Delete the used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ message: "OTP verified successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// Step 4: Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ error: "User not found" });
    }

    // Clean up any remaining OTPs for this email
    await Otp.deleteMany({ email });

    res.json({ message: "Password reset successful. Please login with your new password." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// registering user 
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
