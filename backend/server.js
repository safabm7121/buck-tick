const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const usersRouter = require("./controllers/userController");
app.use("/users", usersRouter);

const port = process.env.PORT || 6000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
