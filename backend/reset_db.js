require('dotenv').config({path:'.env'}); 
const mongoose = require('mongoose'); 
const Question = require('./src/models/Question'); 
const MockTest = require('./src/models/MockTest'); 

mongoose.connect(process.env.MONGODB_URI).then(async () => { 
  const res1 = await Question.deleteMany({});
  console.log(`Deleted ${res1.deletedCount} questions.`);
  
  const res2 = await MockTest.deleteMany({});
  console.log(`Deleted ${res2.deletedCount} mock tests.`);
  
  mongoose.disconnect(); 
});
