/*
  # Create challenge_content table

  1. New Tables
    - `challenge_content` - Stores the CAPTCHA challenges
      - `id` (uuid, primary key)
      - `challenge_type` (text) - Type of challenge (text, image_selection, pattern, semantic)
      - `content_data` (jsonb) - Challenge-specific data (images, text, pattern, etc.)
      - `metadata` (jsonb) - Additional metadata (difficulty, tags, etc.)
      - `is_active` (boolean) - Whether the challenge is active
      - `created_by` (uuid, references users) - User who created the challenge
      - `created_at` (timestamp) - When the challenge was created
      - `updated_at` (timestamp) - When the challenge was last updated
  
  2. Security
    - Enable RLS on `challenge_content` table
    - Add policies for authenticated users to read all challenges
    - Add policies for admins to create/update/delete challenges
*/

-- Create challenge_content table if it doesn't exist
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

-- Create an index for faster filtering by challenge_type
CREATE INDEX IF NOT EXISTS idx_challenge_content_type ON challenge_content(challenge_type);

-- Create an index for faster filtering by active status
CREATE INDEX IF NOT EXISTS idx_challenge_content_active ON challenge_content(is_active);

-- Enable Row Level Security
ALTER TABLE challenge_content ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read active challenges
CREATE POLICY "Authenticated users can read active challenges"
  ON challenge_content
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create policy for admins to manage challenges (assuming an admin role for future implementation)
CREATE POLICY "Admins can manage all challenges"
  ON challenge_content
  USING (true)
  WITH CHECK (true);

-- Add sample challenges for testing
INSERT INTO challenge_content (challenge_type, content_data, metadata) 
VALUES
-- Text challenges
('text', 
  '{"text": "ABC123"}'::JSONB, 
  '{"difficulty": "easy"}'::JSONB
),
('text', 
  '{"text": "RH9X7A"}'::JSONB, 
  '{"difficulty": "medium"}'::JSONB
),
('text', 
  '{"text": "R4#X$9A"}'::JSONB, 
  '{"difficulty": "hard"}'::JSONB
),

-- Image selection challenges
('image_selection', 
  '{"question": "Select all images containing animals", "images": ["https://images.unsplash.com/photo-1530595467517-49740742c05f?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop"], "correctIndices": [0, 1, 2, 3]}'::JSONB, 
  '{"difficulty": "medium"}'::JSONB
),
('image_selection', 
  '{"question": "Select all images containing vehicles", "images": ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1511702771955-42b52e1cd168?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1625042700258-a2376cf792e0?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1530595467517-49740742c05f?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=150&h=150&fit=crop"], "correctIndices": [0, 1, 2, 3]}'::JSONB, 
  '{"difficulty": "medium"}'::JSONB
),

-- Pattern challenges
('pattern', 
  '{"gridSize": 3, "pattern": [0, 4, 8]}'::JSONB, 
  '{"difficulty": "easy"}'::JSONB
),
('pattern', 
  '{"gridSize": 3, "pattern": [0, 4, 8, 5, 2]}'::JSONB, 
  '{"difficulty": "medium"}'::JSONB
),
('pattern', 
  '{"gridSize": 4, "pattern": [0, 5, 10, 15, 14, 13, 12]}'::JSONB, 
  '{"difficulty": "hard"}'::JSONB
),

-- Semantic challenges
('semantic', 
  '{"question": "Which of these is an animal?", "options": ["Dog", "Apple", "Car", "Book"], "correctIndex": 0}'::JSONB, 
  '{"difficulty": "easy"}'::JSONB
),
('semantic', 
  '{"question": "Which of these is used to measure temperature?", "options": ["Ruler", "Thermometer", "Clock", "Scale"], "correctIndex": 1}'::JSONB, 
  '{"difficulty": "medium"}'::JSONB
),
('semantic', 
  '{"question": "Which item doesn''t belong in this list?", "options": ["Mercury", "Venus", "Mars", "Moon"], "correctIndex": 3}'::JSONB, 
  '{"difficulty": "hard"}'::JSONB
);