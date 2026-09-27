const express = require("express");
const bcrypt = require("bcrypt");
const { UserModel, createToken, validateUser, validateLogin } = require("../models/userModel");
const { auth, authAdmin } = require("../middlewares/auth");

const router = express.Router();

// Sign up
router.post("/", async (req, res) => {
  const { error, value } = validateUser(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const exists = await UserModel.findOne({ email: value.email });
    if (exists) return res.status(409).json({ error: "This email is already registered" });

    const user = new UserModel(value);
    user.password = await bcrypt.hash(value.password, 10);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    // Two requests with the same email at the same time
    if (err.code === 11000) return res.status(409).json({ error: "This email is already registered" });
    console.error(err);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

// Log in: returns a token
router.post("/login", async (req, res) => {
  const { error, value } = validateLogin(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const user = await UserModel.findOne({ email: value.email.toLowerCase() });
    const passwordOk = user && (await bcrypt.compare(value.password, user.password));
    if (!passwordOk) return res.status(401).json({ error: "Email or password is wrong" });

    res.json({ token: createToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

// Info about the logged-in user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.tokenData._id, { password: 0 });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

// List of all users - admin only
router.get("/", authAdmin, async (req, res) => {
  try {
    const users = await UserModel.find({}, { password: 0 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

module.exports = router;
