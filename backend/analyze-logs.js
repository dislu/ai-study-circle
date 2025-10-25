#!/usr/bin/env node

/**
 * Simple log analysis script
 */

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
const today = new Date().toISOString().split('T')[0];

console.log('📊 AI Study Circle Log Analysis');
console.log('===============================');

// Check if log files exist
const combinedLog = path.join(logDir, `combined-${today}.log`);
const errorLog = path.join(logDir, `error-${today}.log`);

if (fs.existsSync(combinedLog)) {
  const logs = fs.readFileSync(combinedLog, 'utf8').split('\n').filter(line => line.trim());
  console.log(`📝 Total logs today: ${logs.length}`);
  
  // Count log levels
  const levels = { info: 0, warn: 0, error: 0, debug: 0 };
  logs.forEach(line => {
    try {
      const logEntry = JSON.parse(line);
      if (levels.hasOwnProperty(logEntry.level)) {
        levels[logEntry.level]++;
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  });
  
  console.log(`ℹ️  Info: ${levels.info}`);
  console.log(`⚠️  Warn: ${levels.warn}`);
  console.log(`❌ Error: ${levels.error}`);
  console.log(`🐛 Debug: ${levels.debug}`);
} else {
  console.log(`📝 No logs found for today (${today})`);
}

if (fs.existsSync(errorLog)) {
  const errors = fs.readFileSync(errorLog, 'utf8').split('\n').filter(line => line.trim());
  console.log(`🚨 Total errors today: ${errors.length}`);
} else {
  console.log('✅ No errors today');
}
