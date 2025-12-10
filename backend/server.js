const express = require("express");
const cors = require("cors");
const app = express();
const port = 6000;

app.use(express.json());
app.use(cors());

// Routes
app.use("/users", require("./controllers/userController"));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
