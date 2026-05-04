const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateTemporaryPin = () => String(Math.floor(1000 + Math.random() * 9000));

const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  safeUser.hasPin = Boolean(safeUser.pinHash);
  delete safeUser.password;
  delete safeUser.pinHash;
  return safeUser;
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const temporaryPin = generateTemporaryPin();
    const pinHash = await bcrypt.hash(temporaryPin, 10);

    const user = new User({
      email,
      password: hashedPassword,
      pinHash,
      mustChangePin: true,
      pinUpdatedAt: null,
      displayName,
      location: req.body.location || "Not specified"
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      temporaryPin,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+pinHash");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: sanitizeUser(user) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
