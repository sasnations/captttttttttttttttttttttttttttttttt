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
import fs from 'fs';

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

// Middleware - Configure CORS to accept requests from any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
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

// Initialize database tables
async function initializeDatabase() {
  logger.info('Checking database tables');
  
  try {
    // Check if users table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!result.rows[0].exists) {
      logger.info('Database tables not found. Creating tables...');
      
      try {
        // Run migrations
        const migrationsPath = path.resolve(__dirname, '..', 'supabase', 'migrations');
        if (fs.existsSync(migrationsPath)) {
          const files = fs.readdirSync(migrationsPath);
          
          for (const file of files) {
            if (file.endsWith('.sql')) {
              logger.info(`Running migration: ${file}`);
              const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
              await pool.query(sql);
            }
          }
          
          logger.info('Migrations complete');
        } else {
          logger.warn('Migrations directory not found');
          
          // Create minimal required tables if migrations can't be found
          await createMinimalTables();
        }
      } catch (err) {
        logger.error('Error running migrations', err);
        
        // Fallback to creating minimal tables
        await createMinimalTables();
      }
    } else {
      logger.info('Database tables already exist');
    }
  } catch (err) {
    logger.error('Database initialization error', err);
  }
}

// Create minimal required tables
async function createMinimalTables() {
  logger.info('Creating minimal required tables');
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY,
        email text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        password_salt text NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);
    
    // Create challenge_content table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenge_content (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        challenge_type text NOT NULL,
        content_data jsonb NOT NULL,
        metadata jsonb DEFAULT '{}'::jsonb,
        is_active boolean DEFAULT true,
        created_by uuid REFERENCES users(id),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);
    
    // Insert demo user
    await pool.query(`
      INSERT INTO users (id, email, password_hash, password_salt)
      VALUES (
        '123e4567-e89b-12d3-a456-426614174000',
        'demo@captchashield.com',
        '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        'somesalt'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    
    logger.info('Minimal tables created successfully');
  } catch (err) {
    logger.error('Error creating minimal tables', err);
  }
}

// Run database initialization
initializeDatabase();

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
  
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production', (err, user) => {
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
    logger.info('Registration attempt', { email });
    
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
    
    // Generate token
    const token = jwt.sign(
      { id: userId, email }, 
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production', 
      { expiresIn: '7d' }
    );
    
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
    logger.info('Login attempt', { email });
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Special case for demo user
    if (email === 'demo@captchashield.com' && password === 'demo123456') {
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production', 
        { expiresIn: '7d' }
      );
      
      logger.info('Demo user logged in', { userId: user.id, email });
      
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        token
      });
    }
    
    // Verify password
    const hash = crypto.pbkdf2Sync(password, user.password_salt, 1000, 64, 'sha512').toString('hex');
    if (hash !== user.password_hash) {
      logger.warn('Failed login attempt - invalid password', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production', 
      { expiresIn: '7d' }
    );
    
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
    // Check if captcha_categories table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'captcha_categories'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Return mock data if table doesn't exist
      return res.status(200).json([
        {
          id: 'cat_1',
          name: 'Standard',
          description: 'Traditional CAPTCHA challenges like text and image recognition',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'cat_2',
          name: 'Advanced',
          description: 'Complex puzzles and interactive challenges',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'cat_3',
          name: 'Invisible',
          description: 'Background verification without user interaction',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ]);
    }
    
    // Get real data from the database
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
    // Check if captchas table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'captchas'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Return mock data if table doesn't exist
      return res.status(200).json([
        {
          id: 'cap_1',
          name: 'Text Recognition',
          category_id: 'cat_1',
          description: 'Recognize distorted text',
          difficulty: 'easy',
          status: 'active',
          success_rate: 98.7,
          bot_detection_rate: 96.2,
          created_at: new Date().toISOString(),
          captcha_categories: {
            name: 'Standard'
          }
        },
        {
          id: 'cap_2',
          name: 'Image Selection',
          category_id: 'cat_1',
          description: 'Select images matching a category',
          difficulty: 'medium',
          status: 'active',
          success_rate: 97.3,
          bot_detection_rate: 94.5,
          created_at: new Date().toISOString(),
          captcha_categories: {
            name: 'Standard'
          }
        }
      ]);
    }
    
    // Get real data from the database
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
app.post('/api/categories', async (req, res) => {
  const { name, description } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }
  
  try {
    // Check if captcha_categories table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'captcha_categories'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS captcha_categories (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          description text NOT NULL,
          status text NOT NULL CHECK (status IN ('active', 'inactive', 'testing')) DEFAULT 'active',
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
      `);
    }
    
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
app.post('/api/captchas', async (req, res) => {
  const { name, category_id, description, difficulty = 'medium' } = req.body;
  
  if (!name || !category_id || !description) {
    return res.status(400).json({ error: 'Name, category_id, and description are required' });
  }
  
  try {
    // Check if captchas table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'captchas'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS captchas (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          category_id uuid NOT NULL,
          description text NOT NULL,
          difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
          status text NOT NULL CHECK (status IN ('active', 'inactive', 'testing')) DEFAULT 'active',
          success_rate float DEFAULT 0,
          bot_detection_rate float DEFAULT 0,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
      `);
    }
    
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
app.post('/api/verify', async (req, res) => {
  const { captcha_id, token, risk_score = 0.5 } = req.body;
  
  // For demo purposes, we'll accept all verifications without requiring API key
  try {
    // Log the verification
    logger.info('CAPTCHA verification processed', { 
      captchaId: captcha_id, 
      riskScore: risk_score 
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Verification successful'
    });
  } catch (err) {
    logger.error('Error processing verification', err);
    res.status(500).json({ error: 'Failed to process verification' });
  }
});

// Get challenge content
app.get('/api/challenge-content', async (req, res) => {
  const { challenge_type, limit = 10, offset = 0 } = req.query;
  
  try {
    // Check if the table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'challenge_content'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS challenge_content (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          challenge_type text NOT NULL,
          content_data jsonb NOT NULL,
          metadata jsonb DEFAULT '{}'::jsonb,
          is_active boolean DEFAULT true,
          created_by uuid,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
      `);
      
      // Return empty array for first request
      return res.status(200).json([]);
    }
    
    // Prepare the query
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

// Upload challenge content
app.post('/api/challenge-content', async (req, res) => {
  const { challenge_type, content_data, metadata } = req.body;
  
  if (!challenge_type || !content_data) {
    return res.status(400).json({ error: 'Challenge type and content data are required' });
  }
  
  try {
    // Check if the table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'challenge_content'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS challenge_content (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          challenge_type text NOT NULL,
          content_data jsonb NOT NULL,
          metadata jsonb DEFAULT '{}'::jsonb,
          is_active boolean DEFAULT true,
          created_by uuid,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
      `);
    }
    
    // Get user ID from authentication or use default for demo
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    
    const result = await pool.query(
      `INSERT INTO challenge_content
       (challenge_type, content_data, metadata, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [challenge_type, content_data, metadata || {}, userId]
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

// Log configured routes
logger.info('API routes configured', {
  routes: [
    { path: '/api/health', method: 'GET' },
    { path: '/api/categories', method: 'GET' },
    { path: '/api/categories', method: 'POST' },
    { path: '/api/captchas', method: 'GET' },
    { path: '/api/captchas', method: 'POST' },
    { path: '/api/verify', method: 'POST' },
    { path: '/api/challenge-content', method: 'GET' },
    { path: '/api/challenge-content', method: 'POST' }
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
