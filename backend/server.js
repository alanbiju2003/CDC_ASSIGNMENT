import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './database.js';
import { seedDatabase } from './seed.js';
import authRoutes from './routes/authRoutes.js';
import shoeRoutes from './routes/shoeRoutes.js';
import mrnRoutes from './routes/mrnRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import cronRoutes from './routes/cronRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import emailRoutes from './routes/emailRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Database schema and seed initial data if missing
initDb();
try {
  seedDatabase();
} catch (err) {
  console.log('Seed check skipped or already seeded.');
}


// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for clean debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', authRoutes);
app.use('/api', shoeRoutes);
app.use('/api', mrnRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', requestRoutes);
app.use('/api', chatRoutes);
app.use('/api', notificationRoutes);
app.use('/api', cronRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', emailRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'KickVault Consignment Portal API',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if present in production
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`🚀 KickVault Consignment Backend running on http://localhost:${PORT}`);
});
