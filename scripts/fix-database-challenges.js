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

async function fixDatabaseChallenges() {
  try {
    console.log('🔧 Running Database Challenge Fixes');
    console.log('==================================');
    
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Step 1: Fix the challenge types (image → image_selection)
    console.log('\n1. Fixing challenge types...');
    const typeUpdateResult = await pool.query(`
      UPDATE challenge_content 
      SET challenge_type = 'image_selection' 
      WHERE challenge_type = 'image'
    `);
    
    console.log(`   Updated ${typeUpdateResult.rowCount} challenges from 'image' to 'image_selection'`);
    
    // Step 2: Add difficulty metadata where missing
    console.log('\n2. Adding missing difficulty metadata...');
    const difficultyUpdateResult = await pool.query(`
      UPDATE challenge_content
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{difficulty}',
        '"medium"'
      )
      WHERE metadata IS NULL OR NOT (metadata ? 'difficulty')
    `);
    
    console.log(`   Added difficulty metadata to ${difficultyUpdateResult.rowCount} challenges`);
    
    // Step 3: Ensure all challenges are active
    console.log('\n3. Activating all challenges...');
    const activeUpdateResult = await pool.query(`
      UPDATE challenge_content
      SET is_active = true
      WHERE is_active = false
    `);
    
    console.log(`   Activated ${activeUpdateResult.rowCount} challenges`);
    
    // Step 4: Ensure image_selection challenges have correctIndices
    console.log('\n4. Adding correctIndices to image_selection challenges where missing...');
    
    // First, find affected challenges
    const challengesWithoutIndices = await pool.query(`
      SELECT id, content_data 
      FROM challenge_content
      WHERE challenge_type = 'image_selection'
      AND NOT (content_data ? 'correctIndices')
    `);
    
    let fixedCount = 0;
    
    // Fix each challenge
    for (const challenge of challengesWithoutIndices.rows) {
      try {
        const contentData = challenge.content_data;
        
        // Add correctIndices array with first image selected
        contentData.correctIndices = [0];
        
        await pool.query(`
          UPDATE challenge_content
          SET content_data = $1
          WHERE id = $2
        `, [contentData, challenge.id]);
        
        fixedCount++;
      } catch (error) {
        console.error(`   Error fixing challenge ${challenge.id}:`, error);
      }
    }
    
    console.log(`   Added correctIndices to ${fixedCount} challenges`);
    
    // Step 5: Create sample challenges for missing types
    console.log('\n5. Creating sample challenges for missing types...');
    
    // Get count of each challenge type
    const typeCounts = await pool.query(`
      SELECT challenge_type, COUNT(*) as count 
      FROM challenge_content 
      GROUP BY challenge_type
    `);
    
    const typeMap = {};
    typeCounts.rows.forEach(row => {
      typeMap[row.challenge_type] = parseInt(row.count);
    });
    
    // Required challenge types
    const requiredTypes = [
      {
        type: 'text',
        data: { text: 'AB123C', distortionLevel: 'medium' },
        metadata: { difficulty: 'medium' }
      },
      {
        type: 'image_selection',
        data: {
          category: 'Select all images containing cats',
          images: [
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=150&h=150&fit=crop'
          ],
          correctIndices: [0, 1, 2, 3]
        },
        metadata: { difficulty: 'medium' }
      },
      {
        type: 'pattern',
        data: {
          gridSize: 3,
          patternLength: 4,
          pattern: [0, 4, 8, 2]
        },
        metadata: { difficulty: 'medium' }
      },
      {
        type: 'semantic',
        data: {
          question: 'Which of these is a color?',
          options: ['Apple', 'Blue', 'Chair', 'Dog'],
          correctIndex: 1
        },
        metadata: { difficulty: 'easy' }
      }
    ];
    
    let createdCount = 0;
    
    for (const challenge of requiredTypes) {
      // If type doesn't exist or count is 0, create sample
      if (!typeMap[challenge.type] || typeMap[challenge.type] === 0) {
        try {
          await pool.query(`
            INSERT INTO challenge_content 
            (challenge_type, content_data, metadata, is_active)
            VALUES ($1, $2, $3, true)
          `, [challenge.type, challenge.data, challenge.metadata]);
          
          createdCount++;
          console.log(`   Created sample ${challenge.type} challenge`);
        } catch (error) {
          console.error(`   Error creating ${challenge.type} challenge:`, error);
        }
      }
    }
    
    if (createdCount === 0) {
      console.log('   All required challenge types already exist');
    } else {
      console.log(`   Created ${createdCount} sample challenges`);
    }
    
    // Step 6: Make sure challenges have correct case for types
    console.log('\n6. Ensuring consistent challenge type names...');
    
    const caseFixResult = await pool.query(`
      UPDATE challenge_content
      SET challenge_type = 'image_selection'
      WHERE challenge_type = 'image_selection' OR challenge_type = 'imageselection' OR challenge_type = 'ImageSelection'
    `);
    
    // Final report
    console.log('\n📊 Current Challenge Status:');
    
    const finalTypes = await pool.query(`
      SELECT challenge_type, COUNT(*) as count 
      FROM challenge_content 
      GROUP BY challenge_type
      ORDER BY count DESC
    `);
    
    finalTypes.rows.forEach(row => {
      console.log(`   ${row.challenge_type}: ${row.count}`);
    });
    
    const activeCounts = await pool.query(`
      SELECT COUNT(*) as active
      FROM challenge_content
      WHERE is_active = true
    `);
    
    console.log(`\n   Total active challenges: ${activeCounts.rows[0].active}`);
    
    console.log('\n✅ Database challenge fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database challenges:', error);
  } finally {
    await pool.end();
  }
}

fixDatabaseChallenges();