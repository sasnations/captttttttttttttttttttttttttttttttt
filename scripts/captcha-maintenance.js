import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Create readline interface for interactive fixes
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  try {
    console.log('🛠️ CAPTCHA System Maintenance');
    console.log('=============================');
    console.log('Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Connection successful!\n');
    
    // Check current state of challenges
    await checkChallengeTypes();
    
    showMenu();
  } catch (error) {
    console.error('Error connecting to database:', error);
    await cleanup();
  }
}

async function checkChallengeTypes() {
  console.log('📊 Current Challenge Statistics:');
  
  // Get challenge type counts
  const typeResult = await pool.query(`
    SELECT challenge_type, COUNT(*) as count 
    FROM challenge_content 
    GROUP BY challenge_type
    ORDER BY count DESC
  `);
  
  if (typeResult.rows.length === 0) {
    console.log('  No challenges found in the database.');
  } else {
    typeResult.rows.forEach(row => {
      console.log(`  ${row.challenge_type}: ${row.count}`);
    });
  }
  
  // Check difficulty distribution
  const difficultyResult = await pool.query(`
    SELECT metadata->>'difficulty' AS difficulty, COUNT(*) as count 
    FROM challenge_content 
    GROUP BY metadata->>'difficulty'
    ORDER BY count DESC
  `);
  
  console.log('\n📊 Challenge Difficulty Distribution:');
  if (difficultyResult.rows.length === 0) {
    console.log('  No difficulty metadata found.');
  } else {
    difficultyResult.rows.forEach(row => {
      console.log(`  ${row.difficulty || 'undefined'}: ${row.count}`);
    });
  }
  
  // Check for issues
  const issuesFound = [];
  
  // 1. Check for 'image' type instead of 'image_selection'
  const imageTypeResult = await pool.query(`
    SELECT COUNT(*) as count FROM challenge_content WHERE challenge_type = 'image'
  `);
  
  if (parseInt(imageTypeResult.rows[0].count) > 0) {
    issuesFound.push({
      issue: 'Found challenges with type "image" instead of "image_selection"',
      count: parseInt(imageTypeResult.rows[0].count),
      fixFunction: fixImageType
    });
  }
  
  // 2. Check for missing difficulty metadata
  const missingDifficultyResult = await pool.query(`
    SELECT COUNT(*) as count FROM challenge_content 
    WHERE metadata IS NULL OR NOT (metadata ? 'difficulty')
  `);
  
  if (parseInt(missingDifficultyResult.rows[0].count) > 0) {
    issuesFound.push({
      issue: 'Found challenges with missing difficulty metadata',
      count: parseInt(missingDifficultyResult.rows[0].count),
      fixFunction: fixMissingDifficulty
    });
  }
  
  // 3. Check for inactive challenges
  const inactiveResult = await pool.query(`
    SELECT COUNT(*) as count FROM challenge_content WHERE is_active = false
  `);
  
  if (parseInt(inactiveResult.rows[0].count) > 0) {
    issuesFound.push({
      issue: 'Found inactive challenges',
      count: parseInt(inactiveResult.rows[0].count),
      fixFunction: activateAllChallenges
    });
  }
  
  // 4. Check for image_selection challenges missing correctIndices
  const missingIndicesResult = await pool.query(`
    SELECT COUNT(*) as count FROM challenge_content
    WHERE challenge_type = 'image_selection' 
    AND NOT (content_data ? 'correctIndices')
  `);
  
  if (parseInt(missingIndicesResult.rows[0].count) > 0) {
    issuesFound.push({
      issue: 'Found image_selection challenges missing correctIndices',
      count: parseInt(missingIndicesResult.rows[0].count),
      fixFunction: fixMissingCorrectIndices
    });
  }
  
  // Report issues
  console.log('\n🔍 Issues Detected:');
  if (issuesFound.length === 0) {
    console.log('  No issues found. CAPTCHA system appears to be properly configured.');
  } else {
    issuesFound.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.issue} (${issue.count} affected)`);
    });
  }
  
  return issuesFound;
}

function showMenu() {
  console.log('\n🔧 Maintenance Options:');
  console.log('  1. Fix all issues automatically');
  console.log('  2. Fix image type issues (image → image_selection)');
  console.log('  3. Add missing difficulty metadata');
  console.log('  4. Activate all inactive challenges');
  console.log('  5. Fix missing correctIndices in image challenges');
  console.log('  6. Create sample challenges for all types');
  console.log('  7. Exit');
  
  rl.question('\nSelect an option: ', async (answer) => {
    switch (answer) {
      case '1':
        await fixAllIssues();
        break;
      case '2':
        await fixImageType();
        break;
      case '3':
        await fixMissingDifficulty();
        break;
      case '4':
        await activateAllChallenges();
        break;
      case '5':
        await fixMissingCorrectIndices();
        break;
      case '6':
        await createSampleChallenges();
        break;
      case '7':
        console.log('Exiting...');
        await cleanup();
        break;
      default:
        console.log('Invalid option. Please try again.');
        showMenu();
        break;
    }
  });
}

async function fixAllIssues() {
  console.log('\n🔄 Fixing all issues...');
  
  await fixImageType();
  await fixMissingDifficulty();
  await activateAllChallenges();
  await fixMissingCorrectIndices();
  
  console.log('✅ All fixes applied successfully!');
  
  // Check the current state after fixes
  await checkChallengeTypes();
  showMenu();
}

async function fixImageType() {
  console.log('\n🔄 Fixing image type issues...');
  
  const result = await pool.query(`
    UPDATE challenge_content 
    SET challenge_type = 'image_selection' 
    WHERE challenge_type = 'image'
    RETURNING id
  `);
  
  console.log(`✅ Updated ${result.rowCount} challenges from 'image' to 'image_selection'`);
  showMenu();
}

async function fixMissingDifficulty() {
  console.log('\n🔄 Adding missing difficulty metadata...');
  
  const result = await pool.query(`
    UPDATE challenge_content
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{difficulty}',
      '"medium"'
    )
    WHERE metadata IS NULL OR NOT (metadata ? 'difficulty')
    RETURNING id
  `);
  
  console.log(`✅ Added 'medium' difficulty to ${result.rowCount} challenges`);
  showMenu();
}

async function activateAllChallenges() {
  console.log('\n🔄 Activating all challenges...');
  
  const result = await pool.query(`
    UPDATE challenge_content
    SET is_active = true
    WHERE is_active = false
    RETURNING id
  `);
  
  console.log(`✅ Activated ${result.rowCount} challenges`);
  showMenu();
}

async function fixMissingCorrectIndices() {
  console.log('\n🔄 Fixing missing correctIndices in image challenges...');
  
  // First find affected challenges
  const challengesToFix = await pool.query(`
    SELECT id, content_data 
    FROM challenge_content
    WHERE challenge_type = 'image_selection'
    AND NOT (content_data ? 'correctIndices')
  `);
  
  if (challengesToFix.rows.length === 0) {
    console.log('✅ No challenges need fixing');
    showMenu();
    return;
  }
  
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
      console.error(`Error fixing challenge ${challenge.id}:`, error);
    }
  }
  
  console.log(`✅ Added correctIndices to ${fixedCount} challenges`);
  showMenu();
}

async function createSampleChallenges() {
  console.log('\n🔄 Creating sample challenges for each type...');
  
  const challengeTypes = [
    {
      type: 'text',
      content: {
        text: 'AB123C',
        distortionLevel: 'medium'
      },
      metadata: {
        difficulty: 'easy'
      }
    },
    {
      type: 'image_selection',
      content: {
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
      metadata: {
        difficulty: 'medium'
      }
    },
    {
      type: 'pattern',
      content: {
        gridSize: 3,
        patternLength: 4,
        pattern: [0, 4, 8, 2]
      },
      metadata: {
        difficulty: 'medium'
      }
    },
    {
      type: 'semantic',
      content: {
        question: 'Which of these is a color?',
        options: ['Apple', 'Blue', 'Chair', 'Dog'],
        correctIndex: 1
      },
      metadata: {
        difficulty: 'easy'
      }
    }
  ];
  
  let createdCount = 0;
  for (const challenge of challengeTypes) {
    try {
      await pool.query(`
        INSERT INTO challenge_content 
        (challenge_type, content_data, metadata, is_active)
        VALUES ($1, $2, $3, true)
      `, [challenge.type, challenge.content, challenge.metadata]);
      
      createdCount++;
    } catch (error) {
      console.error(`Error creating ${challenge.type} challenge:`, error);
    }
  }
  
  console.log(`✅ Created ${createdCount} sample challenges`);
  
  // Check current state after adding samples
  await checkChallengeTypes();
  showMenu();
}

async function cleanup() {
  await pool.end();
  rl.close();
  process.exit(0);
}

// Start the application
main();