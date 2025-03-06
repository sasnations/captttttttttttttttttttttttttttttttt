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

// Create readline interface for interactive queries
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to database and show available tables
async function main() {
  try {
    console.log('📊 Database Explorer');
    console.log('====================');
    console.log('Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Connection successful!\n');
    
    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      tablesResult.rows.forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.table_name}`);
      });
    }
    
    console.log('\nOptions:');
    console.log('  1. View table structure');
    console.log('  2. View table data');
    console.log('  3. Run custom SQL query');
    console.log('  4. Exit');
    
    promptForAction();
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

function promptForAction() {
  rl.question('\nEnter option number: ', async (option) => {
    switch (option) {
      case '1':
        promptForTableStructure();
        break;
      case '2':
        promptForTableData();
        break;
      case '3':
        promptForCustomQuery();
        break;
      case '4':
        console.log('Exiting...');
        await pool.end();
        rl.close();
        break;
      default:
        console.log('Invalid option. Please try again.');
        promptForAction();
        break;
    }
  });
}

async function promptForTableStructure() {
  rl.question('Enter table name: ', async (tableName) => {
    try {
      // Get table columns
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      if (columnsResult.rows.length === 0) {
        console.log(`Table '${tableName}' not found or has no columns.`);
      } else {
        console.log(`\nStructure for table '${tableName}':`);
        console.log('-------------------------------------------');
        console.log('Column Name            | Data Type       | Nullable | Default');
        console.log('-------------------------------------------');
        
        columnsResult.rows.forEach(col => {
          const colName = col.column_name.padEnd(22);
          const dataType = col.data_type.padEnd(16);
          const nullable = col.is_nullable.padEnd(9);
          const defaultVal = col.column_default || 'null';
          
          console.log(`${colName} | ${dataType} | ${nullable} | ${defaultVal}`);
        });
      }
      promptForAction();
    } catch (error) {
      console.error('Error fetching table structure:', error);
      promptForAction();
    }
  });
}

async function promptForTableData() {
  rl.question('Enter table name: ', async (tableName) => {
    rl.question('Number of rows to view (default 10): ', async (limit) => {
      try {
        // Set a reasonable default and maximum for limit
        const rowLimit = parseInt(limit) || 10;
        const finalLimit = Math.min(rowLimit, 100); // Cap at 100 rows for safety
        
        // Get table data
        const dataResult = await pool.query(`
          SELECT * FROM ${tableName} 
          LIMIT ${finalLimit}
        `);
        
        if (dataResult.rows.length === 0) {
          console.log(`Table '${tableName}' is empty or does not exist.`);
        } else {
          console.log(`\nData in table '${tableName}' (${dataResult.rows.length} rows):`);
          
          // For each row, print all fields
          dataResult.rows.forEach((row, i) => {
            console.log(`\n--- Row ${i + 1} ---`);
            for (const [key, value] of Object.entries(row)) {
              // Format value for display
              let displayValue = value;
              if (value === null) {
                displayValue = 'NULL';
              } else if (typeof value === 'object') {
                displayValue = JSON.stringify(value, null, 2);
              }
              
              console.log(`${key}: ${displayValue}`);
            }
          });
        }
        promptForAction();
      } catch (error) {
        console.error('Error fetching table data:', error);
        promptForAction();
      }
    });
  });
}

async function promptForCustomQuery() {
  rl.question('Enter SQL query: ', async (query) => {
    try {
      if (!query.trim()) {
        console.log('Query cannot be empty.');
        promptForAction();
        return;
      }
      
      const result = await pool.query(query);
      
      console.log('\nQuery executed successfully!');
      
      if (result.command === 'SELECT') {
        console.log(`Returned ${result.rows.length} rows.`);
        if (result.rows.length > 0) {
          // Display column names
          const columns = Object.keys(result.rows[0]);
          console.log('\nColumns: ' + columns.join(', '));
          
          // Display rows (limit to 20 for readability)
          const displayRows = result.rows.slice(0, 20);
          console.log('\nData (first 20 rows):');
          displayRows.forEach((row, i) => {
            console.log(`\nRow ${i + 1}:`);
            for (const [key, value] of Object.entries(row)) {
              let displayValue = value;
              if (value === null) {
                displayValue = 'NULL';
              } else if (typeof value === 'object') {
                displayValue = JSON.stringify(value, null, 2);
              }
              
              console.log(`  ${key}: ${displayValue}`);
            }
          });
          
          if (result.rows.length > 20) {
            console.log(`\n...and ${result.rows.length - 20} more rows`);
          }
        }
      } else {
        // For non-SELECT queries
        console.log(`Command: ${result.command}`);
        if (result.rowCount !== undefined) {
          console.log(`Affected rows: ${result.rowCount}`);
        }
      }
      promptForAction();
    } catch (error) {
      console.error('Error executing query:', error);
      promptForAction();
    }
  });
}

// Start the program
main();