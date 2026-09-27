// Fills the database with an admin user and 12 toys in 3 categories.
// Run with: npm run seed  (it deletes the toys that are already in the collection)

require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { UserModel } = require("./models/userModel");
const { ToyModel } = require("./models/toyModel");

const img = (name) => `https://picsum.photos/seed/${name}/400/300`;

const toys = [
  { name: "Lego City Fire Station", info: "Fire station with a truck, a helicopter and 6 minifigures", category: "building", price: 89.9, img_url: img("firestation") },
  { name: "Lego Classic Creative Box", info: "900 colorful bricks to build anything you imagine", category: "building", price: 49.9, img_url: img("legobox") },
  { name: "Magnetic Tiles 60 pieces", info: "Magnetic building tiles to create 3D shapes and towers", category: "building", price: 59.9, img_url: img("magnetic") },
  { name: "Wooden Blocks Castle", info: "Natural wooden blocks to build a medieval castle", category: "building", price: 34.9, img_url: img("woodcastle") },
  { name: "Remote Control Race Car", info: "Fast RC car with rechargeable battery and 2.4GHz remote", category: "vehicles", price: 79.9, img_url: img("rccar") },
  { name: "Wooden Train Set", info: "Train with 3 wagons, rails and a small wooden station", category: "vehicles", price: 64.9, img_url: img("train") },
  { name: "Monster Truck", info: "Big wheels monster truck that climbs over any obstacle", category: "vehicles", price: 29.9, img_url: img("monstertruck") },
  { name: "Toy Airplane", info: "Plastic airplane with lights and real engine sounds", category: "vehicles", price: 24.9, img_url: img("airplane") },
  { name: "Monopoly Classic", info: "The famous board game of buying and trading properties", category: "games", price: 39.9, img_url: img("monopoly") },
  { name: "Jenga", info: "Stack the wooden blocks and try not to make the tower fall", category: "games", price: 19.9, img_url: img("jenga") },
  { name: "Rubik's Cube", info: "The classic 3x3 puzzle cube, a challenge for all ages", category: "games", price: 14.9, img_url: img("rubik") },
  { name: "Puzzle 1000 pieces", info: "World map puzzle for the whole family", category: "games", price: 22.9, img_url: img("puzzle") }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URL);

  let admin = await UserModel.findOne({ email: process.env.ADMIN_EMAIL });
  if (!admin) {
    admin = await UserModel.create({
      name: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      role: "admin"
    });
    console.log("Admin user created:", admin.email);
  }

  await ToyModel.deleteMany({});
  await ToyModel.insertMany(toys.map((toy) => ({ ...toy, user_id: admin._id.toString() })));
  console.log(`${toys.length} toys added`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
