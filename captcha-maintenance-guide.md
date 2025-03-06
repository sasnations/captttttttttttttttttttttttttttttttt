# CAPTCHA System Maintenance Guide

This guide provides instructions for maintaining and troubleshooting the iCaptcha system.

## Common Issues and Solutions

### Challenge Type Inconsistencies

The system expects challenge types to be consistently named. Currently supported types are:

- `text` - Text recognition challenges
- `image_selection` - Image selection challenges
- `pattern` - Pattern memory challenges
- `semantic` - Semantic understanding challenges

If challenges were previously created with the type `image` instead of `image_selection`, they need to be updated.

### Missing Challenge Metadata

All challenges should have metadata that includes at least a `difficulty` field. Valid difficulty levels are:

- `easy`
- `medium`
- `hard`

Challenges missing difficulty metadata default to `medium` difficulty.

### Missing Correct Answers

Image selection challenges must include a `correctIndices` array that indicates which images are the correct ones to select.

## Using the Maintenance Tool

Run the maintenance tool with:

```bash
node scripts/captcha-maintenance.js
```

This tool will:

1. Check the current state of your CAPTCHA challenges
2. Identify any issues with challenge configuration
3. Provide options to fix issues automatically

### Maintenance Options

1. **Fix all issues automatically** - Applies all fixes at once
2. **Fix image type issues** - Changes any `image` type to `image_selection`
3. **Add missing difficulty metadata** - Sets `medium` difficulty where missing
4. **Activate all inactive challenges** - Ensures all challenges are available
5. **Fix missing correctIndices** - Adds default correct indices to image challenges
6. **Create sample challenges** - Adds sample challenges of each type

## Manual Database Fixes

If you prefer to fix issues directly in the database, here are some useful SQL commands:

```sql
-- Fix 'image' to 'image_selection' type
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

-- Activate all challenges
UPDATE challenge_content
SET is_active = true
WHERE is_active = false;

-- Check challenges that might need fixes
SELECT id, challenge_type, metadata 
FROM challenge_content 
WHERE metadata IS NULL OR NOT (metadata ? 'difficulty');

SELECT id, challenge_type, content_data 
FROM challenge_content 
WHERE challenge_type = 'image_selection' 
AND NOT (content_data ? 'correctIndices');
```

## Integration Testing

After making database changes, test your CAPTCHA integration:

1. Open `/captcha-integration.html` in your browser
2. Try each CAPTCHA type
3. Verify that different difficulty levels work correctly

If problems persist, check the browser console for error messages.