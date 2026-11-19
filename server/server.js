const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db.config');
const errorHandler = require('./src/middleware/error.middleware');

// Load env
dotenv.config();

const app = express();

const mongoose = require('mongoose');

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Ensure database connection for API routes
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({
        success: false,
        message: 'Database connection in progress or unavailable. If running on Vercel, please ensure MONGODB_URI is set in Project Settings.',
        error: err.message,
      });
    }
  }
  next();
});

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/projects', require('./src/routes/project.routes'));
app.use('/api/tasks', require('./src/routes/task.routes'));
app.use('/api/ai', require('./src/routes/ai.routes'));
app.use('/api/analytics', require('./src/routes/analytics.routes'));
app.use('/api/activities', require('./src/routes/activity.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

// Start server if run directly (local development)
if (!process.env.VERCEL && require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 AI Provider: ${process.env.AI_PROVIDER || 'local'}`);
      console.log(`🗄️  Database: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/project_management_ai'}\n`);
    });
  }).catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.error('\n💡 Make sure MongoDB is running. See README.md for setup instructions.\n');
    process.exit(1);
  });
}

module.exports = app;
