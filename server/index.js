import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeCaptchaScript, generateChallenge, verifyChallenge } from './services/captchaService.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;

// Get the frontend URL from environment variables
const frontendUrl = process.env.FRONTEND_URL || 'https://icaptcha.onrender.com';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure CORS to accept requests from any origin
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

// Setup static files - Serve the client side JavaScript directly from server
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Initialize captcha script
initializeCaptchaScript(frontendUrl);

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
    logger.error('Database connection error:', err);
  } else {
    logger.info('Database connected successfully:', res.rows[0]);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CAPTCHA API routes

// Generate a CAPTCHA challenge
app.post('/api/captcha/generate', async (req, res) => {
  try {
    const { type = 'text', difficulty = 'medium' } = req.body;
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ 
        success: false, 
        error: 'API key is required' 
      });
    }
    
    // Validate API key (in a real implementation, check against database)
    // For now, we'll accept any API key for testing
    
    // Generate a challenge from the database with proper filtering
    const challenge = await generateChallenge(pool, type, {
      difficulty: difficulty,
      onlyActive: true
    });
    
    logger.info(`Generated challenge of type ${type}, difficulty ${difficulty}`);
    
    res.status(200).json({
      success: true,
      challenge: {
        id: challenge.id,
        type: challenge.type,
        data: challenge.data
      }
    });
  } catch (error) {
    logger.error('Error generating CAPTCHA', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate CAPTCHA challenge' 
    });
  }
});

// Verify a CAPTCHA response
app.post('/api/captcha/verify', async (req, res) => {
  try {
    const { challengeId, response, behaviorData, invisible } = req.body;
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // Handle invisible verification (behavior-based)
    if (invisible && behaviorData) {
      const result = await verifyChallenge(pool, null, null, { 
        invisible: true,
        behaviorData
      });
      
      return res.status(200).json({
        success: result.success,
        token: result.token,
        error: result.error
      });
    }
    
    // For regular challenges
    if (!challengeId || response === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Challenge ID and response are required'
      });
    }
    
    // Verify the challenge response
    const result = await verifyChallenge(pool, challengeId, response);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        token: result.token
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Verification failed'
      });
    }
  } catch (error) {
    logger.error('Error verifying CAPTCHA', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify CAPTCHA challenge' 
    });
  }
});

// Challenge Content routes

// Get challenge content
app.get('/api/challenge-content', authenticateOptional, async (req, res) => {
  try {
    const { challenge_type, limit = 10, offset = 0, active_only = true } = req.query;
    
    let query = `
      SELECT * FROM challenge_content 
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (challenge_type) {
      query += ` AND challenge_type = $${paramIndex}`;
      queryParams.push(challenge_type);
      paramIndex++;
    }
    
    if (active_only === 'true') {
      query += ` AND is_active = $${paramIndex}`;
      queryParams.push(true);
      paramIndex++;
    }
    
    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Error fetching challenge content', error);
    res.status(500).json({ error: 'Failed to fetch challenge content' });
  }
});

// Add new challenge content
app.post('/api/challenge-content', authenticate, async (req, res) => {
  try {
    const { challenge_type, content_data, metadata = {} } = req.body;
    
    if (!challenge_type || !content_data) {
      return res.status(400).json({ error: 'Challenge type and content data are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO challenge_content 
       (challenge_type, content_data, metadata, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [challenge_type, content_data, metadata, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating challenge content', error);
    res.status(500).json({ error: 'Failed to create challenge content' });
  }
});

// Authentication routes

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Generate salt and hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
    
    // Create user
    const userId = uuidv4();
    await pool.query(
      'INSERT INTO users (id, email, password_hash, password_salt) VALUES ($1, $2, $3, $4)',
      [userId, email.toLowerCase(), hash, salt]
    );
    
    // Generate JWT token
    const token = generateToken(userId);
    
    res.status(201).json({
      user: {
        id: userId,
        email
      },
      token
    });
  } catch (error) {
    logger.error('Error in registration', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const hash = crypto.createHash('sha256').update(password + user.password_salt).digest('hex');
    
    if (hash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email
      },
      token
    });
  } catch (error) {
    logger.error('Error in login', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/user', authenticate, (req, res) => {
  res.status(200).json({ user: req.user });
});

// Helper functions

// Generate a JWT token
function generateToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET || 'default_jwt_secret',
    { expiresIn: '7d' }
  );
}

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    req.user = { id: decoded.sub };
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional authentication middleware (doesn't require auth but sets user if present)
function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
        req.user = { id: decoded.sub };
      } catch (error) {
        // Just ignore auth errors in optional auth
        logger.debug('Optional auth failed', error);
      }
    }
  }
  
  next();
}

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Initialize database
  initializeDatabase().catch(err => {
    logger.error('Database initialization failed', err);
  });
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
    logger.error('Error checking database tables', err);
  }
}

// Create minimal required tables
async function createMinimalTables() {
  logger.info('Creating minimal required tables');
  
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Challenge content table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenge_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        challenge_type TEXT NOT NULL,
        content_data JSONB NOT NULL,
        metadata JSONB DEFAULT '{}'::JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    logger.info('Minimal tables created successfully');
  } catch (err) {
    logger.error('Error creating minimal tables', err);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Close database connections, etc.
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  // Close database connections, etc.
  process.exit(0);
});