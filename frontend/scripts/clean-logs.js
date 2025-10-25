/**
 * Log Cleanup Script
 * Cleans up old logs and manages log file size
 */

const fs = require('fs');
const path = require('path');

class LogCleaner {
  constructor() {
    this.logsPath = path.join(__dirname, '../logs');
    this.maxAge = 30; // days
    this.maxSize = 100; // MB
  }

  /**
   * Run complete cleanup process
   */
  async cleanup() {
    console.log('🧹 Starting log cleanup...');
    
    try {
      this.ensureLogsDirectory();
      this.cleanupOldFiles();
      this.cleanupLargeFiles();
      this.cleanupLocalStorage();
      this.optimizeLogFiles();
      this.generateCleanupReport();
      
      console.log('✅ Log cleanup completed successfully!');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsPath)) {
      fs.mkdirSync(this.logsPath, { recursive: true });
      console.log('📁 Created logs directory');
    }
  }

  /**
   * Clean up old log files
   */
  cleanupOldFiles() {
    console.log('🗓️ Cleaning up old files...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxAge);
    
    let deletedFiles = 0;
    let deletedSize = 0;

    if (fs.existsSync(this.logsPath)) {
      const files = fs.readdirSync(this.logsPath);
      
      files.forEach(file => {
        const filePath = path.join(this.logsPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          deletedSize += stats.size;
          fs.unlinkSync(filePath);
          deletedFiles++;
          console.log(`🗑️ Deleted old file: ${file}`);
        }
      });
    }

    console.log(`✅ Deleted ${deletedFiles} old files (${this.formatBytes(deletedSize)})`);
  }

  /**
   * Clean up large log files
   */
  cleanupLargeFiles() {
    console.log('📏 Checking for large files...');
    
    const maxSizeBytes = this.maxSize * 1024 * 1024; // Convert MB to bytes
    let processedFiles = 0;

    if (fs.existsSync(this.logsPath)) {
      const files = fs.readdirSync(this.logsPath);
      
      files.forEach(file => {
        const filePath = path.join(this.logsPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.size > maxSizeBytes) {
          this.truncateFile(filePath, maxSizeBytes);
          processedFiles++;
          console.log(`✂️ Truncated large file: ${file}`);
        }
      });
    }

    console.log(`✅ Processed ${processedFiles} large files`);
  }

  /**
   * Truncate file to specified size
   */
  truncateFile(filePath, maxSize) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Keep the most recent lines that fit within the size limit
    let truncatedContent = '';
    let size = 0;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i] + '\n';
      if (size + line.length > maxSize) break;
      
      truncatedContent = line + truncatedContent;
      size += line.length;
    }
    
    // Add truncation notice at the beginning
    const notice = `[LOG TRUNCATED - Original file was larger than ${this.maxSize}MB]\n`;
    truncatedContent = notice + truncatedContent;
    
    fs.writeFileSync(filePath, truncatedContent);
  }

  /**
   * Clean up localStorage items (browser-specific guidance)
   */
  cleanupLocalStorage() {
    console.log('💾 Generating localStorage cleanup guidance...');
    
    const cleanupScript = `
// Frontend localStorage Cleanup Script
// Run this in the browser console to clean up logging data

(function() {
  const logKeys = [
    'ai_study_circle_logs',
    'frontend_logger_queue',
    'performance_metrics',
    'user_session_data'
  ];

  let cleaned = 0;
  let totalSize = 0;

  logKeys.forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      totalSize += item.length;
      localStorage.removeItem(key);
      cleaned++;
      console.log('Removed:', key);
    }
  });

  console.log(\`Cleaned up \${cleaned} localStorage items (\${Math.round(totalSize/1024)}KB)\`);
})();
`;

    const cleanupPath = path.join(this.logsPath, 'cleanup-localstorage.js');
    fs.writeFileSync(cleanupPath, cleanupScript);
    
    console.log('✅ Generated localStorage cleanup script');
  }

  /**
   * Optimize log files by compressing and formatting
   */
  optimizeLogFiles() {
    console.log('⚡ Optimizing log files...');
    
    let optimizedFiles = 0;
    let spaceSaved = 0;

    if (fs.existsSync(this.logsPath)) {
      const files = fs.readdirSync(this.logsPath);
      
      files.filter(file => file.endsWith('.json')).forEach(file => {
        const filePath = path.join(this.logsPath, file);
        const originalSize = fs.statSync(filePath).size;
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          
          // Remove unnecessary fields and compress
          const optimized = this.optimizeLogData(parsed);
          const compressedContent = JSON.stringify(optimized);
          
          fs.writeFileSync(filePath, compressedContent);
          
          const newSize = fs.statSync(filePath).size;
          spaceSaved += originalSize - newSize;
          optimizedFiles++;
          
        } catch (error) {
          console.warn(`⚠️ Could not optimize ${file}:`, error.message);
        }
      });
    }

    console.log(`✅ Optimized ${optimizedFiles} files (saved ${this.formatBytes(spaceSaved)})`);
  }

  /**
   * Optimize log data structure
   */
  optimizeLogData(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.optimizeLogEntry(item));
    } else if (data && typeof data === 'object') {
      return this.optimizeLogEntry(data);
    }
    return data;
  }

  /**
   * Optimize individual log entry
   */
  optimizeLogEntry(entry) {
    const optimized = { ...entry };
    
    // Remove verbose fields in production
    if (process.env.NODE_ENV === 'production') {
      delete optimized.stack;
      delete optimized.componentStack;
      delete optimized.userAgent;
    }
    
    // Truncate long messages
    if (optimized.message && optimized.message.length > 500) {
      optimized.message = optimized.message.substring(0, 500) + '...';
    }
    
    // Compress nested objects
    if (optimized.data && typeof optimized.data === 'object') {
      Object.keys(optimized.data).forEach(key => {
        if (typeof optimized.data[key] === 'string' && optimized.data[key].length > 1000) {
          optimized.data[key] = optimized.data[key].substring(0, 1000) + '...';
        }
      });
    }
    
    return optimized;
  }

  /**
   * Generate cleanup report
   */
  generateCleanupReport() {
    console.log('📊 Generating cleanup report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      settings: {
        maxAge: this.maxAge,
        maxSize: this.maxSize
      },
      summary: this.getDirectorySummary(),
      nextCleanup: this.getNextCleanupDate()
    };
    
    const reportPath = path.join(this.logsPath, 'cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('✅ Cleanup report saved to cleanup-report.json');
    
    // Display summary
    this.displaySummary(report);
  }

  /**
   * Get directory summary
   */
  getDirectorySummary() {
    if (!fs.existsSync(this.logsPath)) {
      return { files: 0, totalSize: 0, oldestFile: null, newestFile: null };
    }

    const files = fs.readdirSync(this.logsPath);
    let totalSize = 0;
    let oldestDate = new Date();
    let newestDate = new Date(0);
    let oldestFile = null;
    let newestFile = null;

    files.forEach(file => {
      const filePath = path.join(this.logsPath, file);
      const stats = fs.statSync(filePath);
      
      totalSize += stats.size;
      
      if (stats.mtime < oldestDate) {
        oldestDate = stats.mtime;
        oldestFile = file;
      }
      
      if (stats.mtime > newestDate) {
        newestDate = stats.mtime;
        newestFile = file;
      }
    });

    return {
      files: files.length,
      totalSize,
      oldestFile: oldestFile ? { name: oldestFile, date: oldestDate } : null,
      newestFile: newestFile ? { name: newestFile, date: newestDate } : null
    };
  }

  /**
   * Get next cleanup date
   */
  getNextCleanupDate() {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7); // Weekly cleanup
    return nextDate.toISOString();
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Display cleanup summary
   */
  displaySummary(report) {
    console.log('\n🧹 CLEANUP SUMMARY');
    console.log('=================');
    console.log(`Files: ${report.summary.files}`);
    console.log(`Total Size: ${this.formatBytes(report.summary.totalSize)}`);
    console.log(`Oldest File: ${report.summary.oldestFile?.name || 'None'}`);
    console.log(`Newest File: ${report.summary.newestFile?.name || 'None'}`);
    console.log(`Next Cleanup: ${new Date(report.nextCleanup).toLocaleDateString()}`);
    console.log('\n💡 TIP: Run this script weekly to maintain optimal log storage');
  }

  /**
   * Create cleanup schedule
   */
  createSchedule() {
    const scheduleScript = `#!/bin/bash
# Log Cleanup Schedule Script
# Add this to your crontab with: crontab -e
# 0 2 * * 0  cd /path/to/frontend && node scripts/clean-logs.js

echo "Running weekly log cleanup..."
cd "$(dirname "$0")/.."
node scripts/clean-logs.js

# Optional: Also run log analysis
# node scripts/analyze-logs.js
`;

    const schedulePath = path.join(__dirname, 'cleanup-schedule.sh');
    fs.writeFileSync(schedulePath, scheduleScript);
    fs.chmodSync(schedulePath, '755');
    
    console.log('📅 Created cleanup schedule script at scripts/cleanup-schedule.sh');
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleaner = new LogCleaner();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--schedule')) {
    cleaner.createSchedule();
  } else {
    cleaner.cleanup();
  }
}

module.exports = LogCleaner;