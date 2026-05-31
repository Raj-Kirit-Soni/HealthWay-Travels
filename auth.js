const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const router = express.Router();

// Show signup form
router.get("/signup", (req, res) => {
  res.render("auth/signup.ejs", { error: null, name: "", email: "" });
});

// Handle signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.render("auth/signup.ejs", {
        error: "Email and password are required",
        name,
        email,
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.render("auth/signup.ejs", {
        error: "Email already in use",
        name,
        email,
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash });
    await user.save();

    console.log("✅ New user registered:", email);
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("auth/signup.ejs", {
      error: "Server error: " + err.message,
      name: "",
      email: "",
    });
  }
});

// Show login form
router.get("/login", (req, res) => {
  res.render("auth/login.ejs", { error: null, success: null, email: "" });
});

// Handle login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render("auth/login.ejs", {
        error: "Email and password are required",
        success: null,
        email,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("auth/login.ejs", {
        error: "Invalid credentials",
        success: null,
        email,
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.render("auth/login.ejs", {
        error: "Invalid credentials",
        success: null,
        email,
      });
    }

    // Store user in session (persists in MongoDB)
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;

    console.log("✅ User logged in:", email);
    // Save session to DB before redirect
    req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      return res.redirect("/listings");
    });
  } catch (err) {
    console.error(err);
    res.render("auth/login.ejs", {
      error: "Server error: " + err.message,
      success: null,
      email: "",
    });
  }
});

// Logout route
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});

module.exports = router;
