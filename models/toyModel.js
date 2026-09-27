const mongoose = require("mongoose");
const Joi = require("joi");

const toySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    info: { type: String, required: true },
    category: { type: String, required: true },
    img_url: { type: String, default: "" },
    price: { type: Number, required: true },
    user_id: { type: String, required: true }
  },
  { timestamps: true }
);

const ToyModel = mongoose.model("toys", toySchema);

// user_id is not in the schema: it always comes from the token
function validateToy(body) {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    info: Joi.string().trim().min(2).max(500).required(),
    category: Joi.string().trim().lowercase().min(2).max(50).required(),
    img_url: Joi.string().trim().uri().max(500).allow(""),
    price: Joi.number().min(0).max(100000).required()
  });
  return schema.validate(body);
}

module.exports = { ToyModel, validateToy };
