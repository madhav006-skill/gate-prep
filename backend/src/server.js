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
const allowedOrigins = [
  'http://localhost:5173', 
  'https://frontend-murex-two-47.vercel.app', 
  'https://frontend-91f72lha9-aman-kumars-projects-b903351b.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
const analytics = require('./routes/analytics');
const revision = require('./routes/revision');
const rankEstimator = require('./routes/rankEstimator');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/questions', questions);
app.use('/api/tests', tests);
app.use('/api/import', importRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/analytics', analytics);
app.use('/api/revision', revision);
app.use('/api/rank-estimator', rankEstimator);

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
