import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;

// Get the frontend URL from environment variables
const frontendUrl = process.env.FRONTEND_URL || 'https://captttttttttttttttttttttttttttttttt.onrender.com';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging utility
const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta);
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error);
  },
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta);
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [DEBUG] ${message}`, meta);
    }
  }
};

// Log environment information
logger.info('Server initialization started');
logger.info(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Frontend URL configured as: ${frontendUrl}`);

// Middleware
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(express.json());

// Log middleware setup
logger.info('Middleware configured', { 
  cors: true, 
  jsonParser: true
});

// Initialize PostgreSQL connection pool
logger.info('Initializing database connection pool');
logger.info('Database configuration:', { 
  ssl: process.env.DATABASE_SSL === 'true' ? 'enabled' : 'disabled',
  url: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.split('@')[0].split(':')[0]}:****@${process.env.DATABASE_URL.split('@')[1]}` : 'not provided'
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection failed', err.stack);
  } else {
    logger.info(`Database connected successfully at ${res.rows[0].now}`);
    
    // Test database tables existence
    pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      ORDER BY table_name;
    `)
    .then(result => {
      logger.info(`Database tables found: ${result.rows.length}`, {
        tables: result.rows.map(row => row.table_name)
      });
    })
    .catch(error => {
      logger.error('Error checking database tables', error);
    });
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// API Key authentication middleware
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) return res.status(401).json({ error: 'API key required' });
  
  try {
    const result = await pool.query(
      'SELECT * FROM clients WHERE api_key = $1',
      [apiKey]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    const client = result.rows[0];
    
    // Check usage limits
    if (client.current_usage >= client.usage_limit) {
      return res.status(429).json({ error: 'Usage limit exceeded' });
    }
    
    req.client = client;
    next();
  } catch (err) {
    logger.error('API key authentication error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Log middleware setup
logger.info('Authentication middleware configured');

// Auth routes for custom authentication
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    // Check if email is already registered
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    
    // Create user
    const userId = uuidv4();
    const result = await pool.query(
      'INSERT INTO users (id, email, password_hash, password_salt) VALUES ($1, $2, $3, $4) RETURNING id, email, created_at',
      [userId, email, hash, salt]
    );
    
    // Create default client for the user
    const apiKey = `captcha_${uuidv4().replace(/-/g, '')}`;
    await pool.query(
      'INSERT INTO clients (user_id, company_name, api_key, subscription_tier, usage_limit) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'My Company', apiKey, 'free', 10000]
    );
    
    // Generate token
    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    logger.info('New user registered', { userId, email });
    
    res.status(201).json({
      user: result.rows[0],
      token
    });
  } catch (err) {
    logger.error('Registration error', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const hash = crypto.pbkdf2Sync(password, user.password_salt, 1000, 64, 'sha512').toString('hex');
    if (hash !== user.password_hash) {
      logger.warn('Failed login attempt', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    logger.info('User logged in', { userId: user.id, email });
    
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      token
    });
  } catch (err) {
    logger.error('Login error', err);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

app.get('/api/user', authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

// Log available routes
logger.info('API auth routes configured', { 
  routes: [
    { path: '/api/auth/register', method: 'POST' },
    { path: '/api/auth/login', method: 'POST' },
    { path: '/api/user', method: 'GET' }
  ]
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get all CAPTCHA categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM captcha_categories ORDER BY name'
    );
    
    res.status(200).json(result.rows);
  } catch (err) {
    logger.error('Error fetching categories', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all CAPTCHAs
app.get('/api/captchas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cat.name as category_name
      FROM captchas c
      JOIN captcha_categories cat ON c.category_id = cat.id
      ORDER BY c.name
    `);
    
    const data = result.rows.map(row => ({
      ...row,
      captcha_categories: {
        name: row.category_name
      }
    }));
    
    res.status(200).json(data);
  } catch (err) {
    logger.error('Error fetching captchas', err);
    res.status(500).json({ error: 'Failed to fetch captchas' });
  }
});

// Create a new CAPTCHA category
app.post('/api/categories', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO captcha_categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    
    logger.info('New category created', { name, categoryId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Error creating category', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Create a new CAPTCHA
app.post('/api/captchas', authenticateToken, async (req, res) => {
  const { name, category_id, description, difficulty = 'medium' } = req.body;
  
  if (!name || !category_id || !description) {
    return res.status(400).json({ error: 'Name, category_id, and description are required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO captchas (name, category_id, description, difficulty) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, category_id, description, difficulty]
    );
    
    logger.info('New CAPTCHA created', { name, captchaId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Error creating captcha', err);
    res.status(500).json({ error: 'Failed to create captcha' });
  }
});

// Verify a CAPTCHA (client API)
app.post('/api/verify', authenticateApiKey, async (req, res) => {
  const { captcha_id, token, risk_score = 0.5 } = req.body;
  const client = req.client;
  
  try {
    // Increment usage counter
    await pool.query(
      'UPDATE clients SET current_usage = current_usage + 1 WHERE id = $1',
      [client.id]
    );
    
    // Log the verification
    await pool.query(
      'INSERT INTO verification_logs (client_id, captcha_id, ip_address, user_agent, risk_score, verification_result, verification_time) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        client.id,
        captcha_id || null,
        req.ip,
        req.headers['user-agent'] || 'unknown',
        risk_score,
        true, // For demo purposes
        Math.floor(Math.random() * 2000) + 500 // Random time between 500-2500ms
      ]
    );
    
    logger.info('CAPTCHA verification processed', { 
      clientId: client.id, 
      captchaId: captcha_id, 
      riskScore: risk_score 
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Verification successful',
      client_id: client.id
    });
  } catch (err) {
    logger.error('Error processing verification', err);
    res.status(500).json({ error: 'Failed to process verification' });
  }
});

// Get client settings
app.get('/api/client/settings', authenticateToken, async (req, res) => {
  try {
    const clientResult = await pool.query(
      'SELECT id FROM clients WHERE user_id = $1',
      [req.user.id]
    );
    
    if (clientResult.rows.length === 0) {
      throw new Error('Client not found');
    }
    
    const client = clientResult.rows[0];
    
    const settingsResult = await pool.query(
      'SELECT * FROM client_settings WHERE client_id = $1',
      [client.id]
    );
    
    if (settingsResult.rows.length === 0) {
      res.status(200).json({ client_id: client.id });
    } else {
      res.status(200).json(settingsResult.rows[0]);
    }
  } catch (err) {
    logger.error('Error fetching client settings', err);
    res.status(500).json({ error: 'Failed to fetch client settings' });
  }
});

// Update client settings
app.put('/api/client/settings', authenticateToken, async (req, res) => {
  const { risk_threshold, challenge_difficulty, preferred_captcha_types, behavioral_analysis_enabled } = req.body;
  
  try {
    const clientResult = await pool.query(
      'SELECT id FROM clients WHERE user_id = $1',
      [req.user.id]
    );
    
    if (clientResult.rows.length === 0) {
      throw new Error('Client not found');
    }
    
    const client = clientResult.rows[0];
    
    // Check if settings exist
    const settingsResult = await pool.query(
      'SELECT id FROM client_settings WHERE client_id = $1',
      [client.id]
    );
    
    let result;
    
    if (settingsResult.rows.length > 0) {
      // Update existing settings
      const updateResult = await pool.query(
        `UPDATE client_settings 
         SET risk_threshold = $1, 
             challenge_difficulty = $2, 
             preferred_captcha_types = $3, 
             behavioral_analysis_enabled = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [
          risk_threshold,
          challenge_difficulty,
          preferred_captcha_types,
          behavioral_analysis_enabled,
          settingsResult.rows[0].id
        ]
      );
      
      result = updateResult.rows[0];
      logger.info('Client settings updated', { clientId: client.id });
    } else {
      // Create new settings
      const insertResult = await pool.query(
        `INSERT INTO client_settings
         (client_id, risk_threshold, challenge_difficulty, preferred_captcha_types, behavioral_analysis_enabled)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          client.id,
          risk_threshold,
          challenge_difficulty,
          preferred_captcha_types,
          behavioral_analysis_enabled
        ]
      );
      
      result = insertResult.rows[0];
      logger.info('Initial client settings created', { clientId: client.id });
    }
    
    res.status(200).json(result);
  } catch (err) {
    logger.error('Error updating client settings', err);
    res.status(500).json({ error: 'Failed to update client settings' });
  }
});

// Get analytics data
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const clientResult = await pool.query(
      'SELECT id FROM clients WHERE user_id = $1',
      [req.user.id]
    );
    
    if (clientResult.rows.length === 0) {
      throw new Error('Client not found');
    }
    
    const client = clientResult.rows[0];
    
    // Get verification logs for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const logsResult = await pool.query(
      `SELECT * FROM verification_logs
       WHERE client_id = $1 AND created_at >= $2`,
      [client.id, sevenDaysAgo.toISOString()]
    );
    
    const logs = logsResult.rows;
    
    // Calculate analytics
    const totalVerifications = logs.length;
    const successfulVerifications = logs.filter(log => log.verification_result).length;
    const averageRiskScore = logs.reduce((sum, log) => sum + log.risk_score, 0) / (totalVerifications || 1);
    const averageVerificationTime = logs.reduce((sum, log) => sum + log.verification_time, 0) / (totalVerifications || 1);
    
    // Group by day for chart data
    const dailyData = {};
    logs.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, successful: 0 };
      }
      dailyData[date].total++;
      if (log.verification_result) {
        dailyData[date].successful++;
      }
    });
    
    const chartData = Object.keys(dailyData).sort().map(date => ({
      date,
      total: dailyData[date].total,
      successful: dailyData[date].successful,
      successRate: (dailyData[date].successful / dailyData[date].total) * 100
    }));
    
    res.status(200).json({
      totalVerifications,
      successRate: totalVerifications ? (successfulVerifications / totalVerifications) * 100 : 0,
      averageRiskScore,
      averageVerificationTime,
      chartData
    });
  } catch (err) {
    logger.error('Error fetching analytics', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Generate API key
app.post('/api/client/api-key', authenticateToken, async (req, res) => {
  try {
    // Check if client exists
    const existingClientResult = await pool.query(
      'SELECT id, api_key FROM clients WHERE user_id = $1',
      [req.user.id]
    );
    
    // Generate a new API key
    const apiKey = `captcha_${uuidv4().replace(/-/g, '')}`;
    
    let result;
    
    if (existingClientResult.rows.length > 0) {
      // Update existing client
      const updateResult = await pool.query(
        `UPDATE clients
         SET api_key = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [apiKey, existingClientResult.rows[0].id]
      );
      
      result = updateResult.rows[0];
      logger.info('API key regenerated', { clientId: result.id });
    } else {
      // Create new client
      const { company_name = 'My Company' } = req.body;
      
      const insertResult = await pool.query(
        `INSERT INTO clients
         (user_id, company_name, api_key, subscription_tier, usage_limit, current_usage)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, company_name, apiKey, 'free', 10000, 0]
      );
      
      result = insertResult.rows[0];
      logger.info('New client created with API key', { clientId: result.id });
    }
    
    res.status(200).json({ api_key: result.api_key });
  } catch (err) {
    logger.error('Error generating API key', err);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Upload challenge content
app.post('/api/challenge-content', authenticateToken, async (req, res) => {
  const { challenge_type, content_data, metadata } = req.body;
  
  if (!challenge_type || !content_data) {
    return res.status(400).json({ error: 'Challenge type and content data are required' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO challenge_content
       (challenge_type, content_data, metadata, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [challenge_type, content_data, metadata || {}, req.user.id]
    );
    
    logger.info('New challenge content created', { 
      challengeType: challenge_type, 
      contentId: result.rows[0].id 
    });
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Error uploading challenge content', err);
    res.status(500).json({ error: 'Failed to upload challenge content' });
  }
});

// Get challenge content
app.get('/api/challenge-content', async (req, res) => {
  const { challenge_type, limit = 10, offset = 0 } = req.query;
  
  try {
    let query = 'SELECT * FROM challenge_content WHERE is_active = true';
    const queryParams = [];
    
    if (challenge_type) {
      query += ' AND challenge_type = $1';
      queryParams.push(challenge_type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    
    res.status(200).json(result.rows);
  } catch (err) {
    logger.error('Error fetching challenge content', err);
    res.status(500).json({ error: 'Failed to fetch challenge content' });
  }
});

// Log configured routes
logger.info('API routes configured', {
  routes: [
    { path: '/api/health', method: 'GET' },
    { path: '/api/categories', method: 'GET' },
    { path: '/api/categories', method: 'POST' },
    { path: '/api/captchas', method: 'GET' },
    { path: '/api/captchas', method: 'POST' },
    { path: '/api/verify', method: 'POST' },
    { path: '/api/client/settings', method: 'GET' },
    { path: '/api/client/settings', method: 'PUT' },
    { path: '/api/analytics', method: 'GET' },
    { path: '/api/client/api-key', method: 'POST' },
    { path: '/api/challenge-content', method: 'POST' },
    { path: '/api/challenge-content', method: 'GET' }
  ]
});

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Server process ID: ${process.pid}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);
  
  // For Render.com health checks
  if (process.env.RENDER_EXTERNAL_URL) {
    logger.info(`External URL: ${process.env.RENDER_EXTERNAL_URL}`);
  }
  
  // Print server startup summary
  logger.info('=================================================================');
  logger.info('                 CAPTCHA SHIELD SERVER STARTED                   ');
  logger.info('=================================================================');
  logger.info(`Server time: ${new Date().toISOString()}`);
  logger.info(`Node.js version: ${process.version}`);
  logger.info(`Platform: ${process.platform} ${process.arch}`);
  logger.info('Health check endpoint: /api/health');
  logger.info('=================================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    pool.end();
    logger.info('Database connection pool closed');
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
