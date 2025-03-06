# iCaptcha Service

Advanced CAPTCHA service with behavioral analysis and multiple challenge types.

## Database Management

There are two ways to view your database tables and data:

### 1. Using the CLI Database Explorer

Run the database explorer script to interactively view tables and data:

```bash
npm run db:view
```

This script allows you to:
- View all tables in the database
- Examine table structure (columns, data types)
- View table data 
- Run custom SQL queries

### 2. Direct SQL Queries

If you prefer, you can also connect directly to the database using the following:

```bash
# Get the connection string from your .env file
DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-)

# Connect using psql (if installed)
psql $DATABASE_URL
```

## Common Database Queries

Here are some useful queries for examining the challenge content:

```sql
-- View all challenge tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- View challenge content table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'challenge_content';

-- View all challenge content
SELECT * FROM challenge_content;

-- View challenges by type
SELECT * FROM challenge_content WHERE challenge_type = 'image_selection';
SELECT * FROM challenge_content WHERE challenge_type = 'pattern';
SELECT * FROM challenge_content WHERE challenge_type = 'text';

-- View challenges by difficulty
SELECT * FROM challenge_content WHERE metadata->>'difficulty' = 'easy';
SELECT * FROM challenge_content WHERE metadata->>'difficulty' = 'medium';
SELECT * FROM challenge_content WHERE metadata->>'difficulty' = 'hard';
```

## Database Schema

The primary tables in the database are:

1. `challenge_content` - Stores all CAPTCHA challenges
   - `id` - UUID primary key
   - `challenge_type` - Type of challenge (image_selection, pattern, text, etc.)
   - `content_data` - JSONB object with challenge data
   - `metadata` - JSONB object with additional metadata (difficulty, etc.)
   - `is_active` - Boolean indicating if the challenge is active
   - `created_at` - Timestamp of creation
   - `updated_at` - Timestamp of last update

2. `verification_logs` - Stores verification attempts
   - Records success/failure of CAPTCHA verifications