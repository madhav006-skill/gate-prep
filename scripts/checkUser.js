require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const User = require('./backend/src/models/User');

async function checkUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'amankumar552023@gmail.com' }).select('+password');
  console.log('User found:', user ? 'Yes' : 'No');
  if (user) {
    console.log('Password hash:', user.password);
    const bcrypt = require('bcryptjs');
    // We don't know the exact password, let's just test common ones or just report existence
  }
  mongoose.disconnect();
}
checkUser();
