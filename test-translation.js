const axios = require('axios');

class TranslationSystemTester {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.testResults = [];
    
    // Test content in different languages
    this.testContent = {
      hindi: 'मैं एक छात्र हूं और मुझे अध्ययन में सहायता चाहिए। कृपया मेरी मदद करें।',
      bengali: 'আমি একজন ছাত্র এবং আমার পড়াশোনায় সাহায্য প্রয়োজন।',
      tamil: 'நான் ஒரு மாணவர் மற்றும் எனக்கு படிப்பில் உதவி தேவை।',
      telugu: 'నేను ఒక విద్యార్థిని మరియు నాకు చదువులలో సహాయం కావాలి।',
      gujarati: 'હું એક વિદ્યાર્થી છું અને મને અભ્યાસમાં મદદ જોઈએ છે।',
      english: 'I am a student and I need help with my studies. Please help me.'
    };
  }

  async runAllTests() {
    console.log('🧪 AI Study Circle - Translation System Tests');
    console.log('==============================================\n');

    try {
      await this.testHealthCheck();
      await this.testSupportedLanguages();
      await this.testLanguageDetection();
      await this.testTranslation();
      await this.testContentProcessing();
      await this.testBatchTranslation();
      await this.testAIIntegration();
      
      this.showResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testHealthCheck() {
    console.log('🔍 Testing translation service health...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/translation/health`);
      
      if (response.data.success) {
        this.addResult('✅ Health Check', 'PASS', 'Translation service is healthy');
      } else {
        this.addResult('⚠️  Health Check', 'WARN', 'Service has configuration issues');
      }
      
    } catch (error) {
      this.addResult('❌ Health Check', 'FAIL', error.message);
    }
  }

  async testSupportedLanguages() {
    console.log('🌏 Testing supported languages endpoint...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/translation/languages`);
      
      if (response.data.success && response.data.data.languages.length > 0) {
        const languageCount = response.data.data.languages.length;
        this.addResult('✅ Supported Languages', 'PASS', `Found ${languageCount} supported languages`);
      } else {
        this.addResult('❌ Supported Languages', 'FAIL', 'No languages found');
      }
      
    } catch (error) {
      this.addResult('❌ Supported Languages', 'FAIL', error.message);
    }
  }

  async testLanguageDetection() {
    console.log('🔍 Testing language detection...');
    
    const testCases = [
      { text: this.testContent.hindi, expected: 'hi', name: 'Hindi' },
      { text: this.testContent.bengali, expected: 'bn', name: 'Bengali' },
      { text: this.testContent.english, expected: 'en', name: 'English' }
    ];

    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${this.baseURL}/api/translation/detect`, {
          text: testCase.text
        });

        if (response.data.success) {
          const detected = response.data.data.language;
          const confidence = response.data.data.confidence;
          
          if (detected === testCase.expected) {
            this.addResult(`✅ Detection (${testCase.name})`, 'PASS', 
              `Correctly detected ${detected} with ${Math.round(confidence * 100)}% confidence`);
          } else {
            this.addResult(`⚠️  Detection (${testCase.name})`, 'WARN', 
              `Expected ${testCase.expected}, got ${detected}`);
          }
        } else {
          this.addResult(`❌ Detection (${testCase.name})`, 'FAIL', response.data.error);
        }
        
      } catch (error) {
        this.addResult(`❌ Detection (${testCase.name})`, 'FAIL', error.message);
      }
    }
  }

  async testTranslation() {
    console.log('🔄 Testing translation functionality...');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/translation/translate`, {
        text: this.testContent.hindi,
        sourceLanguage: 'hi',
        targetLanguage: 'en'
      });

      if (response.data.success) {
        const translation = response.data.data;
        
        if (translation.translatedText && translation.translatedText !== translation.originalText) {
          this.addResult('✅ Translation', 'PASS', 'Successfully translated Hindi to English');
        } else {
          this.addResult('⚠️  Translation', 'WARN', 'Translation may not have occurred');
        }
      } else {
        this.addResult('❌ Translation', 'FAIL', response.data.error);
      }
      
    } catch (error) {
      this.addResult('❌ Translation', 'FAIL', error.message);
    }
  }

  async testContentProcessing() {
    console.log('⚙️  Testing content processing for AI...');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/translation/process`, {
        content: this.testContent.hindi
      });

      if (response.data.success) {
        const result = response.data.data;
        
        if (result.processedContent && result.languageInfo && result.metadata) {
          this.addResult('✅ Content Processing', 'PASS', 
            `Processed ${result.languageInfo.language} content for AI`);
        } else {
          this.addResult('⚠️  Content Processing', 'WARN', 'Incomplete processing result');
        }
      } else {
        this.addResult('❌ Content Processing', 'FAIL', response.data.error);
      }
      
    } catch (error) {
      this.addResult('❌ Content Processing', 'FAIL', error.message);
    }
  }

  async testBatchTranslation() {
    console.log('📦 Testing batch translation...');
    
    try {
      const texts = [this.testContent.hindi, this.testContent.bengali];
      
      const response = await axios.post(`${this.baseURL}/api/translation/batch`, {
        texts,
        targetLanguage: 'en'
      });

      if (response.data.success) {
        const results = response.data.data.results;
        
        if (results && results.length === texts.length) {
          this.addResult('✅ Batch Translation', 'PASS', 
            `Successfully processed ${results.length} texts`);
        } else {
          this.addResult('⚠️  Batch Translation', 'WARN', 'Incomplete batch results');
        }
      } else {
        this.addResult('❌ Batch Translation', 'FAIL', response.data.error);
      }
      
    } catch (error) {
      this.addResult('❌ Batch Translation', 'FAIL', error.message);
    }
  }

  async testAIIntegration() {
    console.log('🤖 Testing AI agent integration...');
    
    // Test summary generation with translation
    try {
      const response = await axios.post(`${this.baseURL}/api/summary/generate`, {
        content: this.testContent.hindi,
        options: {
          length: 'brief',
          style: 'academic'
        }
      });

      // This might fail if the summary endpoint isn't fully implemented
      // but we can check if the translation metadata is present
      if (response.data.translationMeta) {
        this.addResult('✅ AI Integration', 'PASS', 'Translation metadata present in AI response');
      } else if (response.data.success) {
        this.addResult('⚠️  AI Integration', 'WARN', 'AI working but no translation metadata');
      } else {
        this.addResult('❌ AI Integration', 'FAIL', 'AI endpoint not available');
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        this.addResult('⚠️  AI Integration', 'SKIP', 'Summary endpoint not implemented yet');
      } else {
        this.addResult('❌ AI Integration', 'FAIL', error.message);
      }
    }
  }

  addResult(test, status, message) {
    this.testResults.push({ test, status, message });
    
    // Color coding for console output
    const colors = {
      PASS: '\x1b[32m', // Green
      WARN: '\x1b[33m', // Yellow
      FAIL: '\x1b[31m', // Red
      SKIP: '\x1b[36m', // Cyan
      RESET: '\x1b[0m'
    };

    console.log(`   ${colors[status]}${test}: ${message}${colors.RESET}`);
  }

  showResults() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');

    const summary = this.testResults.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ PASSED: ${summary.PASS || 0}`);
    console.log(`⚠️  WARNED: ${summary.WARN || 0}`);
    console.log(`❌ FAILED: ${summary.FAIL || 0}`);
    console.log(`🔄 SKIPPED: ${summary.SKIP || 0}`);

    const totalTests = this.testResults.length;
    const successRate = Math.round(((summary.PASS || 0) / totalTests) * 100);

    console.log(`\n📈 Success Rate: ${successRate}%`);

    if (summary.FAIL > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
    }

    if (summary.WARN > 0) {
      console.log('\n⚠️  Warnings:');
      this.testResults
        .filter(r => r.status === 'WARN')
        .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
    }

    console.log('\n🎯 Recommendations:');
    
    if (summary.FAIL > 0) {
      console.log('   - Check server configuration and API keys');
      console.log('   - Ensure all services are running');
    }
    
    if (summary.WARN > 0) {
      console.log('   - Review translation service configuration');
      console.log('   - Consider adding Google Cloud API credentials');
    }
    
    if (successRate >= 80) {
      console.log('   - Translation system is working well! 🎉');
    }

    console.log('\nFor detailed setup instructions, see: TRANSLATION_GUIDE.md\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new TranslationSystemTester();
  
  console.log('Starting translation system tests...\n');
  console.log('Make sure the backend server is running on port 3001\n');
  
  // Wait a bit for user to start server if needed
  setTimeout(() => {
    tester.runAllTests().catch(console.error);
  }, 2000);
}

module.exports = TranslationSystemTester;