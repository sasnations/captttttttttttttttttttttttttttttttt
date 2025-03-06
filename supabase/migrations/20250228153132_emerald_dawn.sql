-- Create users table for custom authentication
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create captcha_categories table
CREATE TABLE IF NOT EXISTS captcha_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'testing')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create captchas table
CREATE TABLE IF NOT EXISTS captchas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES captcha_categories(id) NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'testing')) DEFAULT 'active',
  success_rate float DEFAULT 0,
  bot_detection_rate float DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  company_name text NOT NULL,
  subscription_tier text NOT NULL CHECK (subscription_tier IN ('free', 'standard', 'professional', 'enterprise')) DEFAULT 'free',
  domains text[] DEFAULT '{}',
  api_key text UNIQUE NOT NULL,
  usage_limit integer DEFAULT 10000,
  current_usage integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create verification_logs table
CREATE TABLE IF NOT EXISTS verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) NOT NULL,
  captcha_id uuid REFERENCES captchas(id),
  ip_address text NOT NULL,
  user_agent text NOT NULL,
  risk_score float NOT NULL,
  verification_result boolean NOT NULL,
  verification_time integer NOT NULL, -- in milliseconds
  created_at timestamptz DEFAULT now()
);

-- Create client_settings table
CREATE TABLE IF NOT EXISTS client_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) NOT NULL,
  risk_threshold float DEFAULT 0.5,
  challenge_difficulty text NOT NULL CHECK (challenge_difficulty IN ('easy', 'medium', 'hard', 'adaptive')) DEFAULT 'adaptive',
  preferred_captcha_types text[] DEFAULT '{}',
  behavioral_analysis_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create challenge_content table for storing additional CAPTCHA content
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE captcha_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE captchas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_content ENABLE ROW LEVEL SECURITY;

-- Create helper function for current user ID
CREATE OR REPLACE FUNCTION current_user_id() 
RETURNS uuid 
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid()
$$;

-- Create policies for users
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  USING (id = current_user_id());

-- Create policies for captcha_categories
CREATE POLICY "Anyone can view active captcha categories"
  ON captcha_categories
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create captcha categories"
  ON captcha_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their captcha categories"
  ON captcha_categories
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for captchas
CREATE POLICY "Anyone can view active captchas"
  ON captchas
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create captchas"
  ON captchas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their captchas"
  ON captchas
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for clients
CREATE POLICY "Clients can view their own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can update their own data"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for verification_logs
CREATE POLICY "Clients can view their own verification logs"
  ON verification_logs
  FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Create policies for client_settings
CREATE POLICY "Clients can view their own settings"
  ON client_settings
  FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can update their own settings"
  ON client_settings
  FOR UPDATE
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Create policies for challenge_content
CREATE POLICY "Anyone can read active challenge content"
  ON challenge_content
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create challenge content"
  ON challenge_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own challenge content"
  ON challenge_content
  FOR UPDATE
  TO authenticated
  USING (created_by = current_user_id());

-- Insert initial data for captcha categories
INSERT INTO captcha_categories (name, description, status)
VALUES 
  ('Standard', 'Traditional CAPTCHA challenges like text and image recognition', 'active'),
  ('Advanced', 'Complex puzzles and interactive challenges', 'active'),
  ('Invisible', 'Background verification without user interaction', 'active'),
  ('Accessibility', 'CAPTCHA options designed for users with disabilities', 'active'),
  ('Custom', 'Specially designed challenges for specific use cases', 'testing');

-- Insert initial captchas
INSERT INTO captchas (name, category_id, description, difficulty, status, success_rate, bot_detection_rate)
VALUES 
  ('Text Recognition', (SELECT id FROM captcha_categories WHERE name = 'Standard'), 'Recognize distorted text', 'easy', 'active', 98.7, 96.2),
  ('Image Selection', (SELECT id FROM captcha_categories WHERE name = 'Standard'), 'Select images matching a category', 'medium', 'active', 97.3, 94.5),
  ('Puzzle Completion', (SELECT id FROM captcha_categories WHERE name = 'Advanced'), 'Complete a puzzle by arranging pieces', 'hard', 'testing', 95.8, 98.1),
  ('Audio Recognition', (SELECT id FROM captcha_categories WHERE name = 'Accessibility'), 'Recognize spoken words or numbers', 'medium', 'active', 93.2, 91.8),
  ('Behavioral Analysis', (SELECT id FROM captcha_categories WHERE name = 'Invisible'), 'Analyze user behavior patterns', 'medium', 'active', 99.1, 97.4);

-- Insert a demo user for testing
INSERT INTO users (id, email, password_hash, password_salt)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'demo@captchashield.com',
  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', -- hash for 'password'
  'somesalt'
)
ON CONFLICT (id) DO NOTHING;

-- Insert a demo client for the demo user
INSERT INTO clients (user_id, company_name, api_key, subscription_tier, usage_limit)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Demo Company',
  'captcha_demo1234567890abcdef',
  'professional',
  100000
)
ON CONFLICT (api_key) DO NOTHING;

-- Insert some initial challenge content
INSERT INTO challenge_content (challenge_type, content_data, metadata, created_by)
VALUES
  ('image_selection', 
   '{"category": "animals", "images": ["https://images.unsplash.com/photo-1530595467517-49740742c05f?w=150&h=150&fit=crop&auto=format", "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=150&h=150&fit=crop&auto=format", "https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=150&h=150&fit=crop&auto=format"], "correctIndices": [0, 1]}', 
   '{"difficulty": "easy"}',
   '123e4567-e89b-12d3-a456-426614174000'),
   
  ('image_selection', 
   '{"category": "vehicles", "images": ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop&auto=format", "https://images.unsplash.com/photo-1511702771955-42b52e1cd168?w=150&h=150&fit=crop&auto=format", "https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=150&h=150&fit=crop&auto=format"], "correctIndices": [0, 2]}', 
   '{"difficulty": "medium"}',
   '123e4567-e89b-12d3-a456-426614174000'),
   
  ('text', 
   '{"text": "Security", "distortionLevel": "medium"}', 
   '{"difficulty": "medium"}',
   '123e4567-e89b-12d3-a456-426614174000'),
   
  ('pattern', 
   '{"patternLength": 5, "gridSize": "4x4"}', 
   '{"difficulty": "medium"}',
   '123e4567-e89b-12d3-a456-426614174000'),
   
  ('semantic', 
   '{"question": "Which of these is used to measure temperature?", "options": ["Ruler", "Thermometer", "Clock", "Scale"], "correctOptionIndex": 1}', 
   '{"difficulty": "easy"}',
   '123e4567-e89b-12d3-a456-426614174000');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_client_id ON verification_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_client_settings_client_id ON client_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_challenge_content_challenge_type ON challenge_content(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenge_content_is_active ON challenge_content(is_active);
