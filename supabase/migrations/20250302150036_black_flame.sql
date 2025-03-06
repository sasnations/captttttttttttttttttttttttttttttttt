/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `password_salt` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
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
ALTER TABLE challenge_content ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  USING (id = current_user_id());

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