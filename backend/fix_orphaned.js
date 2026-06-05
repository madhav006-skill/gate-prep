require('dotenv').config({path:'.env'});
const mongoose = require('mongoose');
const MockTest = require('./src/models/MockTest');
const Question = require('./src/models/Question');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Get questions in Test 2 (remaining Shift 1) 
  const test1 = await MockTest.findById('6a19ad3863e7d870e7ae10c4').populate('questions.question');
  const test2 = await MockTest.findById('6a19afe57ece1114bd7f2292').populate('questions.question');

  const test1QIds = new Set(test1.questions.map(q => q.question._id.toString()));
  const test2QIds = new Set(test2.questions.map(q => q.question._id.toString()));

  // Find questions NOT in any test
  const allQIds = await Question.find({}).distinct('_id');
  const orphaned = allQIds.filter(id => !test1QIds.has(id.toString()) && !test2QIds.has(id.toString()));
  
  console.log('Test 1 (Shift 1) questions:', test1QIds.size);
  console.log('Test 2 (Shift 2) questions:', test2QIds.size);
  console.log('Total questions in DB:', allQIds.length);
  console.log('Orphaned questions (not in any test):', orphaned.length);

  if (orphaned.length > 0) {
    console.log('\nDeleting orphaned questions...');
    const del = await Question.deleteMany({ _id: { $in: orphaned } });
    console.log(`Deleted ${del.deletedCount} orphaned questions`);
  }

  const finalQ = await Question.countDocuments();
  console.log(`\nFinal: ${await MockTest.countDocuments()} tests, ${finalQ} questions`);

  process.exit(0);
});
