const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {  // this is only for connected with mogoose ccode start to upto this
  await mongoose.connect(MONGO_URL);
}
  // delete the previous data we try set 


const initDB = async () => {
  await Listing.deleteMany({});


  await Listing.insertMany(initData.data);
  console.log("data was initialized");


 

   };


initDB();