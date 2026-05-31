const mongoose = require("mongoose");

const DEFAULT_IMAGE = "https://unsplash.com/photos/a-cozy-hotel-room-with-a-large-bed-and-window-n2vj0puCWTo";

const listingSchema = new mongoose.Schema({
  
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
    minLength: [20, "Description must be at least 20 characters long"]
  },

  image: {
    type: String,
    default: DEFAULT_IMAGE,
    set: (v) => {
      if (v && typeof v === "object") return v.url || DEFAULT_IMAGE;
      if (v === "") return DEFAULT_IMAGE;
      return v;
    },
  },

  price: Number,
  location: String,
  country: String,

  // ⭐ NEW ADDED FIELDS ⭐
  medical: {
    type: Boolean,
    default: false
  },

  vehicles: {
    type: [String],
    default: []
  }

});

const Listing = mongoose.model("listing", listingSchema);
module.exports = Listing;
