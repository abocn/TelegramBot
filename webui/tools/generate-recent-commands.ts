import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/schema";
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.databaseUrl,
});

const db = drizzle(pool, { schema });

const commandNames = [
  'start', 'help', 'settings', 'ai', 'wiki', 'translate', 
  'weather', 'news', 'stats', 'export', 'search', 'notify'
];

const chatTypes = ['private', 'group', 'supergroup'];

const errorMessages = [
  'Connection timed out',
  'Database error: connection failed',
  'Rate limit exceeded',
  'Invalid API response',
  'Command execution failed',
  'Network error',
  'Permission denied',
  'Resource not found'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function generateRecentCommands() {
  try {
    const count = parseInt(process.argv[2]) || 50;
    const errorRate = parseFloat(process.argv[3]) || 0.2; // 20% error rate by default
    
    console.log(`🚀 Generating ${count} recent commands with ${(errorRate * 100).toFixed(0)}% error rate...\n`);
    
    const entries = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      // Distribute commands over the last 45 minutes
      const minutesAgo = Math.random() * 45;
      const createdAt = new Date(now.getTime() - minutesAgo * 60 * 1000);
      
      const hasError = Math.random() < errorRate;
      
      const entry = {
        id: uuidv4(),
        commandName: getRandomElement(commandNames),
        chatType: getRandomElement(chatTypes),
        isSuccess: !hasError,
        errorMessage: hasError ? getRandomElement(errorMessages) : null,
        executionTime: Math.floor(Math.random() * 500) + 50,
        createdAt
      };
      
      entries.push(entry);
    }
    
    console.log('💾 Inserting commands into database...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const entry of entries) {
      await db.insert(schema.commandUsageTable).values(entry);
      if (entry.isSuccess) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log(`✅ Inserted ${entries.length} commands`);
    console.log(`   • Successful: ${successCount}`);
    console.log(`   • Failed: ${errorCount} (${((errorCount/entries.length)*100).toFixed(1)}%)`);
    
    // Show preview of what was inserted
    const recentCommands = entries.slice(0, 5).map(e => ({
      time: e.createdAt.toLocaleTimeString(),
      command: e.commandName,
      success: e.isSuccess,
      error: e.errorMessage ? e.errorMessage.substring(0, 30) + '...' : null
    }));
    
    console.log('\n📊 Sample of inserted commands:');
    console.log('─────────────────────────────────');
    recentCommands.forEach(cmd => {
      console.log(`  ${cmd.time} - /${cmd.command}: ${cmd.success ? '✅ Success' : `❌ ${cmd.error}`}`);
    });
    
    console.log('\n✨ Done! The Error Rate Timeline should now show data.');
    console.log('   Note: Health recorder runs every 5 minutes, so wait a bit for updates.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

if (import.meta.main) {
  generateRecentCommands();
}