/**
 * Jaffna Cuisine Food Data Import - Wrapper Script
 * Run this from the project root
 * 
 * Usage: node import-jaffna-food.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const importFood = async () => {
  try {
    console.log('🍛 Importing Authentic Jaffna Cuisine Data...\n');
    console.log('📂 Changing to backend directory...\n');
    
    const { stdout, stderr } = await execAsync('cd backend && node ../mongodb-data/import-food-data.js');
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('\n✅ Import completed!');
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
};

importFood();

