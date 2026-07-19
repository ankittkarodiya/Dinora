const dotenv = require("dotenv");
dotenv.config(); // must be first line
// require("./config/passport");

const app = require("./app");
const connectDB = require("./config/db");
// const passport = require("passport");

// app.use(passport.initialize());

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});