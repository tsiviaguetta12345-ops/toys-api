const express = require("express");
const mongoose = require("mongoose");
const { ToyModel, validateToy } = require("../models/toyModel");
const { auth } = require("../middlewares/auth");

const router = express.Router();
const PER_PAGE = 10;

// ?skip is the page number: skip=0 -> toys 1-10, skip=1 -> toys 11-20...
function getPage(req) {
  const page = parseInt(req.query.skip, 10);
  return Number.isInteger(page) && page > 0 ? page : 0;
}

// Escape special characters so a search like "(" can't break the RegExp
function searchRegExp(text) {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function findToys(filter, req, res, sort = { createdAt: -1 }) {
  return ToyModel.find(filter)
    .sort(sort)
    .skip(getPage(req) * PER_PAGE)
    .limit(PER_PAGE)
    .then((toys) => res.json(toys))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Server error, try again later" });
    });
}

function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid toy id" });
  }
  next();
}

// Route A: all toys, 10 per page
// Bonus: ?s= and ?cat= can be combined here, e.g. /toys?s=car&cat=vehicles&skip=1
router.get("/", (req, res) => {
  const filter = {};
  if (req.query.s) {
    const reg = searchRegExp(req.query.s);
    filter.$or = [{ name: reg }, { info: reg }];
  }
  if (req.query.cat) {
    filter.category = req.query.cat.toLowerCase();
  }
  findToys(filter, req, res);
});

// Route B: search in name or info
router.get("/search", (req, res) => {
  if (!req.query.s) {
    return res.status(400).json({ error: "Send a search word with ?s=" });
  }
  const reg = searchRegExp(req.query.s);
  findToys({ $or: [{ name: reg }, { info: reg }] }, req, res);
});

// Route C: toys of one category
router.get("/category/:catname", (req, res) => {
  findToys({ category: req.params.catname.toLowerCase() }, req, res);
});

// Route G: toys between a min and a max price
router.get("/prices", (req, res) => {
  const min = Number(req.query.min) || 0;
  const max = Number(req.query.max) || Infinity;
  findToys({ price: { $gte: min, $lte: max } }, req, res, { price: 1 });
});

// Route I: number of toys in the collection
router.get("/count", async (req, res) => {
  try {
    const count = await ToyModel.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

// Route H: one toy, returned as an object
router.get("/single/:id", checkId, async (req, res) => {
  try {
    const toy = await ToyModel.findById(req.params.id);
    if (!toy) return res.status(404).json({ error: "Toy not found" });
    res.json(toy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

// Only the owner of a toy can edit/delete it (an admin can edit/delete any toy)
function ownerFilter(req) {
  const filter = { _id: req.params.id };
  if (req.tokenData.role !== "admin") filter.user_id = req.tokenData._id;
  return filter;
}

// Route D: add a toy (token required, user_id taken from the token)
router.post("/", auth, async (req, res) => {
  const { error, value } = validateToy(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const toy = await ToyModel.create({ ...value, user_id: req.tokenData._id });
    res.status(201).json(toy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

// Route E: edit a toy (token required, must be the owner)
router.put("/:id", auth, checkId, async (req, res) => {
  const { error, value } = validateToy(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const toy = await ToyModel.findOneAndUpdate(ownerFilter(req), value, {
      returnDocument: "after",
      runValidators: true
    });
    if (!toy) {
      return res.status(404).json({ error: "Toy not found or it does not belong to you" });
    }
    res.json(toy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

// Route F: delete a toy (token required, must be the owner)
router.delete("/:id", auth, checkId, async (req, res) => {
  try {
    const toy = await ToyModel.findOneAndDelete(ownerFilter(req));
    if (!toy) {
      return res.status(404).json({ error: "Toy not found or it does not belong to you" });
    }
    res.json({ msg: "Toy deleted", deletedToy: toy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

module.exports = router;
