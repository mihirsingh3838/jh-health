const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware - allow frontend origin(s); comma-separated for multiple (e.g. preview + prod)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:3000'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Complaint Portal API running' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
