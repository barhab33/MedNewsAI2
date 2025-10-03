#!/usr/bin/env node

/**
 * Automatic News Updater
 * Runs the crawler and export process every 2 hours
 */

const { spawn } = require('child_process');
const fs = require('fs');

const UPDATE_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

console.log('🚀 Medical News Auto-Updater Started');
console.log(`⏰ Will update every 2 hours\n`);

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Running: ${command} ${args.join(' ')}`);

    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function updateNews() {
  const timestamp = new Date().toLocaleString();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 Starting update cycle at ${timestamp}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Run the crawler
    console.log('\n📰 Step 1: Crawling news with Gemini AI...');
    await runCommand('node', ['crawl-multi-ai.cjs']);
    console.log('✅ Crawling complete');

    // Step 2: Export to public folder
    console.log('\n📤 Step 2: Exporting to public folder...');
    await runCommand('node', ['export-to-public.cjs']);
    console.log('✅ Export complete');

    // Check if file was updated
    const filePath = './public/news-data.json';
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const fileSize = (stats.size / 1024).toFixed(2);
      console.log(`\n✅ news-data.json updated successfully (${fileSize} KB)`);
      console.log(`📊 Last modified: ${stats.mtime.toLocaleString()}`);
    }

    console.log(`\n🎉 Update complete! Website has fresh articles.`);
    console.log(`⏰ Next update in 2 hours at ${new Date(Date.now() + UPDATE_INTERVAL).toLocaleString()}\n`);

  } catch (error) {
    console.error(`\n❌ Update failed:`, error.message);
    console.log(`⏰ Will retry in 2 hours\n`);
  }
}

// Run immediately on startup
updateNews();

// Then run every 2 hours
setInterval(updateNews, UPDATE_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down auto-updater...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down auto-updater...');
  process.exit(0);
});
