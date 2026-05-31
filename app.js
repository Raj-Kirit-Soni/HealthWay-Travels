const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Listing = require("./models/listing.js");
const authRouter = require("./auth");

const app = express();

// MongoDB connection
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to MongoDB");
}
main().catch((err) => console.log("❌ DB Connection Error:", err));

// Session middleware with MongoDB store - MUST be BEFORE routes
app.use(
  session({
    secret: "your_secret_key_here",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      touchAfter: 24 * 3600, // lazy session update interval in seconds
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: false,
    },
  })
);

// Middleware
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Routes - AFTER middleware
app.use("/", authRouter);

// Root route
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Index route – Show all listings
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings, session: req.session });
});

// New listing form
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Create route
app.post("/listings", async (req, res) => {
  try {
    const listingData = req.body.listing;

    // Simple validation
    if (!listingData.description || listingData.description.trim().length < 20) {
      throw new Error("Description must be at least 20 characters long");
    }

    const newListing = new Listing(listingData);
    await newListing.save();
    res.redirect("/listings");
  } catch (err) {
    console.error(err);
    res.send("Error: " + err.message);
  }
});

// Show route
app.get("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) return res.send("Listing not found");

  // Pass session to the view
  res.render("listings/show.ejs", {
    listing,
    session: req.session,
    locals: { session: req.session },
  });
});

// Edit form
app.get("/listings/:id/edit", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

// Update route
app.put("/listings/:id", async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
});

// Delete route
app.delete("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  console.log("Deleted:", deletedListing);
  res.redirect("/listings");
});

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
};

// Show booking form
app.get("/listings/:id/book", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) return res.send("Listing not found");
  res.render("bookings/new.ejs", { listing, session: req.session });
});

// Create booking
app.post("/bookings", isLoggedIn, async (req, res) => {
  try {
    const Booking = require("./models/Booking");
    const { listingId, checkInDate, checkOutDate, guests } = req.body;

    const booking = new Booking({
      listingId,
      userId: req.session.userId,
      checkInDate,
      checkOutDate,
      guests,
    });

    await booking.save();
    console.log("✅ Booking created");
    res.redirect("/listings");
  } catch (err) {
    console.error(err);
    res.send("Error creating booking: " + err.message);
  }
});

// Start server
app.listen(8080, () => {
  console.log("🚀 Server running on port 8080");
});
