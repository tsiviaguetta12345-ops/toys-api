const indexR = require("express").Router();
const usersR = require("./users");
const toysR = require("./toys");

indexR.get("/", (req, res) => {
  res.json({ msg: "Toys API is working", docs: "See README.md" });
});

function routesInit(app) {
  app.use("/", indexR);
  app.use("/users", usersR);
  app.use("/toys", toysR);
}

module.exports = routesInit;
