require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const goatRoutes = require('./src/routes/goats');
const transactionRoutes = require('./src/routes/transactions');
const healthRoutes = require('./src/routes/health');
const feedRoutes = require('./src/routes/feed');
const aiRoutes = require('./src/routes/ai');
const dashboardRoutes = require('./src/routes/dashboard');
const { initDb } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Security & performance middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/goats', goatRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(buildPath, { index: false }));
  // Serve index.html for all non-API routes (client-side routing)
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

app.get('/api/health-check', (req, res) => res.json({ status: 'ok', app: 'Lionpride' }));

// Start server after DB init
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🦁 Lionpride server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
