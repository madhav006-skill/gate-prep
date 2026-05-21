const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://amankumar552023_db_user:1eL5p5LjkbsVW0Oj@cluster69.e6ghl6v.mongodb.net/gateprep?retryWrites=true&w=majority&appName=Cluster69').then(async () => {
  const MockTest = mongoose.model('MockTest', new mongoose.Schema({ title: String, duration: Number }, { strict: false }));
  const result = await MockTest.updateMany({ title: /GATE CS 2026/ }, { $set: { duration: 180 } });
  console.log('Updated tests:', result.modifiedCount);
  process.exit(0);
});
