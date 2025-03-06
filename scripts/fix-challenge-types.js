import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Function to fix challenge types in the database
async function fixChallengeTypes() {
  try {
    console.log('🔧 Challenge Type Fixer');
    console.log('=======================');
    console.log('Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Connection successful!\n');
    
    // Check for challenges with type 'image' but should be 'image_selection'
    const findImageChallenges = await pool.query(`
      SELECT * FROM challenge_content 
      WHERE challenge_type = 'image' 
    `);
    
    if (findImageChallenges.rows.length > 0) {
      console.log(`Found ${findImageChallenges.rows.length} challenges with type 'image'`);
      console.log(`Updating to 'image_selection'...`);
      
      // Update challenges
      const updateResult = await pool.query(`
        UPDATE challenge_content 
        SET challenge_type = 'image_selection' 
        WHERE challenge_type = 'image'
      `);
      
      console.log(`Successfully updated ${updateResult.rowCount} challenges`);
    } else {
      console.log(`No challenges with type 'image' found`);
    }
    
    // Check for challenges with type 'image_selection' (should be good now)
    const findImageSelectionChallenges = await pool.query(`
      SELECT * FROM challenge_content 
      WHERE challenge_type = 'image_selection' 
    `);
    
    console.log(`\nCurrent status: ${findImageSelectionChallenges.rows.length} challenges with type 'image_selection'`);
    
    // Get all challenge types for reference
    const challengeTypes = await pool.query(`
      SELECT challenge_type, COUNT(*) as count 
      FROM challenge_content 
      GROUP BY challenge_type
    `);
    
    console.log('\nChallenge type counts:');
    challengeTypes.rows.forEach(row => {
      console.log(`  ${row.challenge_type}: ${row.count}`);
    });
    
    console.log('\nFix complete! The system should now correctly handle all challenge types.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

// Run the fixer
fixChallengeTypes();