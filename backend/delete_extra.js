require('dotenv').config({path:'.env'}); 
const mongoose = require('mongoose'); 
const Question = require('./src/models/Question'); 

mongoose.connect(process.env.MONGODB_URI).then(async () => { 
  const targetDate = new Date('2026-05-21T06:50:00.000Z');
  const res = await Question.deleteMany({ createdAt: { $gte: targetDate } });
  console.log(`Deleted ${res.deletedCount} extra testing questions.`);
  
  const total = await Question.countDocuments();
  console.log('Total questions remaining:', total);
  mongoose.disconnect(); 
});
