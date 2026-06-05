require('dotenv').config({path:'.env'});
const mongoose = require('mongoose');
const MockTest = require('./src/models/MockTest');
const Question = require('./src/models/Question');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const tests = await MockTest.find({}).select('title createdAt questions subject type').sort('createdAt');
  console.log('Total Tests:', tests.length);
  tests.forEach((t, i) => {
    console.log(`\n[${i+1}] ID: ${t._id}`);
    console.log(`    Title: ${t.title}`);
    console.log(`    Type: ${t.type}`);
    console.log(`    Questions: ${t.questions.length}`);
    console.log(`    Created: ${t.createdAt}`);
  });

  const qTotal = await Question.countDocuments();
  console.log(`\nTotal Questions: ${qTotal}`);

  // Check question duplicates by questionHtml
  const dups = await Question.aggregate([
    { $group: { _id: '$questionHtml', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  console.log(`\nDuplicate question groups: ${dups.length}`);
  
  process.exit(0);
});
