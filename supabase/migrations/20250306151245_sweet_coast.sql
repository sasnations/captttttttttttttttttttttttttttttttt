-- Fix 'image' type to 'image_selection'
UPDATE challenge_content 
SET challenge_type = 'image_selection' 
WHERE challenge_type = 'image';

-- Add missing difficulty metadata
UPDATE challenge_content
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{difficulty}',
  '"medium"'
)
WHERE metadata IS NULL OR NOT (metadata ? 'difficulty');

-- Activate all inactive challenges
UPDATE challenge_content
SET is_active = true
WHERE is_active = false;

-- Add sample text challenge if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM challenge_content WHERE challenge_type = 'text') THEN
    INSERT INTO challenge_content 
    (challenge_type, content_data, metadata, is_active)
    VALUES (
      'text',
      '{"text": "AB123C", "distortionLevel": "medium"}'::jsonb,
      '{"difficulty": "medium"}'::jsonb,
      true
    );
  END IF;
END $$;

-- Add sample image_selection challenge if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM challenge_content WHERE challenge_type = 'image_selection') THEN
    INSERT INTO challenge_content 
    (challenge_type, content_data, metadata, is_active)
    VALUES (
      'image_selection',
      '{"category": "Select all images containing cats", "images": ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1561948955-570b270e7c36?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=150&h=150&fit=crop"], "correctIndices": [0, 1, 2, 3]}'::jsonb,
      '{"difficulty": "medium"}'::jsonb,
      true
    );
  END IF;
END $$;

-- Add sample pattern challenge if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM challenge_content WHERE challenge_type = 'pattern') THEN
    INSERT INTO challenge_content 
    (challenge_type, content_data, metadata, is_active)
    VALUES (
      'pattern',
      '{"gridSize": 3, "patternLength": 4, "pattern": [0, 4, 8, 2]}'::jsonb,
      '{"difficulty": "medium"}'::jsonb,
      true
    );
  END IF;
END $$;

-- Add sample semantic challenge if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM challenge_content WHERE challenge_type = 'semantic') THEN
    INSERT INTO challenge_content 
    (challenge_type, content_data, metadata, is_active)
    VALUES (
      'semantic',
      '{"question": "Which of these is a color?", "options": ["Apple", "Blue", "Chair", "Dog"], "correctIndex": 1}'::jsonb,
      '{"difficulty": "easy"}'::jsonb,
      true
    );
  END IF;
END $$;

-- Fix missing correctIndices in image_selection challenges
DO $$
DECLARE
  challenge record;
BEGIN
  FOR challenge IN 
    SELECT id, content_data 
    FROM challenge_content
    WHERE challenge_type = 'image_selection'
    AND NOT (content_data ? 'correctIndices')
  LOOP
    -- Add default correctIndices with first image as correct
    UPDATE challenge_content
    SET content_data = jsonb_set(
      content_data,
      '{correctIndices}',
      '[0]'::jsonb
    )
    WHERE id = challenge.id;
  END LOOP;
END $$;