require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Connect to database
connectDB(); 

const app = express();

// Body parser (increased limit for base64 diagram uploads)
app.use(express.json({ limit: '50mb' }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('GATE Prep Platform API is running');
});

// Route files (to be added)
const auth = require('./routes/auth');
const questions = require('./routes/questions');
const tests = require('./routes/tests');
const importRoute = require('./routes/import');
const uploadRoute = require('./routes/upload');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/questions', questions);
app.use('/api/tests', tests);
app.use('/api/import', importRoute);
app.use('/api/upload', uploadRoute);

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
