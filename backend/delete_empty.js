require('dotenv').config({path:'.env'}); 
const mongoose = require('mongoose'); 
const Question = require('./src/models/Question'); 

mongoose.connect(process.env.MONGODB_URI).then(async () => { 
  const res = await Question.deleteMany({ questionHtml: '<p></p>' });
  console.log(`Deleted ${res.deletedCount} empty questions.`);
  
  const total = await Question.countDocuments();
  console.log('Total questions remaining:', total);
  mongoose.disconnect(); 
});
