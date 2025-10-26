#!/usr/bin/env node

// Simple script to test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('📍 Connection string:', process.env.MONGODB_URI ? 'Found ✅' : 'Missing ❌');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    // Hide password in logs for security
    const safeUri = process.env.MONGODB_URI.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1****$2');
    console.log('🔗 Connecting to:', safeUri);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log('🏠 Host:', conn.connection.host);
    console.log('🗄️  Database:', conn.connection.name);
    console.log('📊 Ready State:', conn.connection.readyState === 1 ? 'Connected' : 'Not Connected');

    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📋 Available Collections:', collections.length);

    await mongoose.connection.close();
    console.log('👋 Connection closed successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Tips for authentication errors:');
      console.log('- Check your username and password');
      console.log('- Ensure your IP is whitelisted in MongoDB Atlas');
      console.log('- Verify your connection string format');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Tips for network errors:');
      console.log('- Check your internet connection');
      console.log('- Verify your cluster URL is correct');
      console.log('- Ensure your cluster is running');
    }

    process.exit(1);
  }
}

testConnection();