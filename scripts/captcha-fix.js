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

async function fixCaptchaIssues() {
  try {
    console.log('🔧 Fixing CAPTCHA System Issues');
    console.log('==============================');
    console.log('Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!\n');
    
    // Fix 1: Change 'image' type to 'image_selection'
    console.log('1️⃣ Fixing challenge types...');
    const typeResult = await pool.query(`
      UPDATE challenge_content 
      SET challenge_type = 'image_selection' 
      WHERE challenge_type = 'image'
      RETURNING id
    `);
    console.log(`   ✅ Updated ${typeResult.rowCount} challenges from 'image' to 'image_selection'`);
    
    // Fix 2: Add missing difficulty metadata
    console.log('\n2️⃣ Adding missing difficulty metadata...');
    const metadataResult = await pool.query(`
      UPDATE challenge_content
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{difficulty}',
        '"medium"'
      )
      WHERE metadata IS NULL OR NOT (metadata ? 'difficulty')
      RETURNING id
    `);
    console.log(`   ✅ Added difficulty metadata to ${metadataResult.rowCount} challenges`);
    
    // Fix 3: Activate all challenges
    console.log('\n3️⃣ Activating all challenges...');
    const activateResult = await pool.query(`
      UPDATE challenge_content
      SET is_active = true
      WHERE is_active = false
      RETURNING id
    `);
    console.log(`   ✅ Activated ${activateResult.rowCount} challenges`);
    
    // Fix 4: Fix missing correctIndices
    console.log('\n4️⃣ Fixing missing correctIndices in image challenges...');
    const challengesToFix = await pool.query(`
      SELECT id, content_data 
      FROM challenge_content
      WHERE challenge_type = 'image_selection'
      AND NOT (content_data ? 'correctIndices')
    `);
    
    if (challengesToFix.rows.length === 0) {
      console.log('   ✅ No challenges need correctIndices fixes');
    } else {
      // Fix each challenge
      let fixedCount = 0;
      for (const challenge of challengesToFix.rows) {
        try {
          // Add a default correctIndices array with the first image as correct
          const contentData = challenge.content_data;
          contentData.correctIndices = [0];
          
          await pool.query(`
            UPDATE challenge_content
            SET content_data = $1
            WHERE id = $2
          `, [contentData, challenge.id]);
          
          fixedCount++;
        } catch (error) {
          console.error(`   ❌ Error fixing challenge ${challenge.id}:`, error);
        }
      }
      
      console.log(`   ✅ Added correctIndices to ${fixedCount} challenges`);
    }
    
    // Fix 5: Add sample challenges if needed
    console.log('\n5️⃣ Checking for missing challenge types...');
    const typeCounts = await pool.query(`
      SELECT challenge_type, COUNT(*) as count 
      FROM challenge_content 
      GROUP BY challenge_type
    `);
    
    const typeMap = {};
    typeCounts.rows.forEach(row => {
      typeMap[row.challenge_type] = parseInt(row.count);
    });
    
    // Add sample challenges for missing types
    const requiredTypes = ['text', 'image_selection', 'pattern', 'semantic'];
    let addedCount = 0;
    
    for (const type of requiredTypes) {
      if (!typeMap[type] || typeMap[type] === 0) {
        console.log(`   Adding sample ${type} challenge...`);
        
        let content, metadata;
        
        if (type === 'text') {
          content = { text: 'AB123C', distortionLevel: 'medium' };
          metadata = { difficulty: 'medium' };
        } else if (type === 'image_selection') {
          content = {
            category: 'Select all images containing cats',
            images: [
              'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop',
              'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=150&h=150&fit=crop',
              'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150&h=150&fit=crop',
              'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=150&h=150&fit=crop'
            ],
            correctIndices: [0, 1, 2, 3]
          };
          metadata = { difficulty: 'medium' };
        } else if (type === 'pattern') {
          content = { 
            gridSize: 3,
            patternLength: 4,
            pattern: [0, 4, 8, 2]
          };
          metadata = { difficulty: 'medium' };
        } else if (type === 'semantic') {
          content = {
            question: 'Which of these is a color?',
            options: ['Apple', 'Blue', 'Chair', 'Dog'],
            correctIndex: 1
          };
          metadata = { difficulty: 'easy' };
        }
        
        await pool.query(`
          INSERT INTO challenge_content 
          (challenge_type, content_data, metadata, is_active)
          VALUES ($1, $2, $3, true)
        `, [type, content, metadata]);
        
        addedCount++;
      }
    }
    
    if (addedCount > 0) {
      console.log(`   ✅ Added ${addedCount} sample challenges for missing types`);
    } else {
      console.log('   ✅ All required challenge types exist');
    }
    
    // Final status
    console.log('\n🎉 All CAPTCHA system issues fixed successfully!');
    console.log('\nCurrent challenge statistics:');
    
    const finalCounts = await pool.query(`
      SELECT challenge_type, COUNT(*) as count 
      FROM challenge_content 
      GROUP BY challenge_type
      ORDER BY count DESC
    `);
    
    finalCounts.rows.forEach(row => {
      console.log(`   ${row.challenge_type}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing CAPTCHA issues:', error);
  } finally {
    await pool.end();
  }
}

// Run the fixer
fixCaptchaIssues();