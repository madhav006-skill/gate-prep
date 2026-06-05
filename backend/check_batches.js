require('dotenv').config({path:'.env'});
const mongoose = require('mongoose');
const Question = require('./src/models/Question');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const groups = await Question.aggregate([{ 
    $group: { 
      _id: { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$createdAt' } }, 
      count: { $sum: 1 } 
    } 
  }]);
  console.log(groups);
  process.exit(0);
});
