require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'amankumar552023@gmail.com' }).select('+password');
  console.log('User found:', user ? 'Yes' : 'No');
  if (user) {
    console.log('Password hash:', user.password);
  }
  mongoose.disconnect();
}
checkUser();
