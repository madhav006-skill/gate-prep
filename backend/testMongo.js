const mongoose = require('mongoose');

async function test() {
  const uri = "mongodb+srv://amankumar552023_db_user:1eL5p5LjkbsVW0Oj@cluster69.e6ghl6v.mongodb.net/gateprep?retryWrites=true&w=majority&appName=Cluster69";
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to connect:", err.message);
    process.exit(1);
  }
}
test();
