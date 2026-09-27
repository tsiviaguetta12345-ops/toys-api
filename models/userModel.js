const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: true }
);

const UserModel = mongoose.model("users", userSchema);

function createToken(user) {
  return jwt.sign({ _id: user._id, role: user.role }, process.env.TOKEN_SECRET, {
    expiresIn: "10h"
  });
}

// Role is not accepted from the client: every new user is a "user"
function validateUser(body) {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().email().max(100).required(),
    password: Joi.string().min(6).max(50).required()
  });
  return schema.validate(body);
}

function validateLogin(body) {
  const schema = Joi.object({
    email: Joi.string().trim().email().max(100).required(),
    password: Joi.string().min(6).max(50).required()
  });
  return schema.validate(body);
}

module.exports = { UserModel, createToken, validateUser, validateLogin };
