require('dotenv').config({path:'.env'});
const mongoose = require('mongoose');
const Question = require('./src/models/Question');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Find questions before 15:14 UTC
  const cutoff = new Date('2026-05-29T15:14:00Z');
  
  const result = await Question.deleteMany({ createdAt: { $lt: cutoff } });
  
  console.log(`Deleted ${result.deletedCount} old questions.`);
  
  const total = await Question.countDocuments();
  console.log(`Remaining questions: ${total}`);
  
  process.exit(0);
});
