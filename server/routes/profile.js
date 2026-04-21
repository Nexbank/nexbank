// get logged in user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// update the logged in user profile
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { phone, address, location } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        phone,
        address,
        location,
      },
      { new: true }
    );

    const safeUser = updatedUser.toObject();
    delete safeUser.password;

    res.json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
});

