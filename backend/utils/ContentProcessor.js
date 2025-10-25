const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class ContentProcessor {
  constructor() {
    this.supportedFormats = ['pdf', 'docx', 'txt', 'md'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
  }

  async processFile(filePath, originalName) {
    try {
      const fileExtension = this.getFileExtension(originalName);
      
      if (!this.supportedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      const fileStats = await fs.stat(filePath);
      if (fileStats.size > this.maxFileSize) {
        throw new Error(`File too large: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB (max: 50MB)`);
      }

      let extractedText = '';
      let metadata = {
        originalName,
        fileSize: fileStats.size,
        fileType: fileExtension,
        processedAt: new Date().toISOString()
      };

      switch (fileExtension) {
        case 'pdf':
          const result = await this.processPDF(filePath);
          extractedText = result.text;
          metadata = { ...metadata, ...result.metadata };
          break;
        case 'docx':
          const docResult = await this.processDOCX(filePath);
          extractedText = docResult.text;
          metadata = { ...metadata, ...docResult.metadata };
          break;
        case 'txt':
        case 'md':
          extractedText = await this.processTextFile(filePath);
          break;
        default:
          throw new Error(`Processing not implemented for: ${fileExtension}`);
      }

      // Clean and validate extracted text
      extractedText = this.cleanText(extractedText);
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Insufficient text content extracted from file');
      }

      metadata.wordCount = this.countWords(extractedText);
      metadata.characterCount = extractedText.length;
      metadata.estimatedReadTime = Math.ceil(metadata.wordCount / 200); // Assuming 200 words per minute

      return {
        text: extractedText,
        metadata
      };
    } catch (error) {
      console.error('Content processing error:', error);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  async processPDF(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(fileBuffer);
      
      return {
        text: pdfData.text,
        metadata: {
          pageCount: pdfData.numpages,
          pdfInfo: pdfData.info
        }
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  async processDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      return {
        text: result.value,
        metadata: {
          warnings: result.messages
        }
      };
    } catch (error) {
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }

  async processTextFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Text file processing failed: ${error.message}`);
    }
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  getFileExtension(filename) {
    return path.extname(filename).toLowerCase().substring(1);
  }

  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  validateContent(text, minLength = 100) {
    if (!text || typeof text !== 'string') {
      return { valid: false, error: 'No text content provided' };
    }

    const trimmedText = text.trim();
    if (trimmedText.length < minLength) {
      return { valid: false, error: `Content too short (minimum ${minLength} characters)` };
    }

    const wordCount = this.countWords(trimmedText);
    if (wordCount < 20) {
      return { valid: false, error: 'Content has insufficient words (minimum 20 words)' };
    }

    return { valid: true, wordCount, characterCount: trimmedText.length };
  }

  extractSections(text) {
    // Simple section extraction based on headers and structure
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { title: 'Introduction', content: '' };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line looks like a header
      if (this.isLikelyHeader(trimmedLine)) {
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        currentSection = { title: trimmedLine, content: '' };
      } else {
        currentSection.content += line + '\n';
      }
    }
    
    // Add the last section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  isLikelyHeader(line) {
    // Simple heuristics for header detection
    if (!line) return false;
    
    // Check for common header patterns
    const headerPatterns = [
      /^#{1,6}\s+/, // Markdown headers
      /^[A-Z][A-Z\s]{3,}$/, // ALL CAPS headers
      /^\d+\.\s+[A-Z]/, // Numbered headers
      /^[IVX]+\.\s+/, // Roman numerals
    ];
    
    return headerPatterns.some(pattern => pattern.test(line)) ||
           (line.length < 80 && line.length > 5 && !line.endsWith('.') && 
            line[0] === line[0].toUpperCase());
  }

  async preprocessForAI(text, options = {}) {
    const {
      maxLength = 15000, // Reasonable limit for AI processing
      preserveSections = true,
      includeMetadata = true
    } = options;

    let processedText = text;

    // If text is too long, intelligently truncate
    if (processedText.length > maxLength) {
      if (preserveSections) {
        const sections = this.extractSections(processedText);
        processedText = this.intelligentTruncate(sections, maxLength);
      } else {
        processedText = processedText.substring(0, maxLength) + '\n[Content truncated...]';
      }
    }

    const result = { text: processedText };

    if (includeMetadata) {
      result.metadata = {
        originalLength: text.length,
        processedLength: processedText.length,
        truncated: processedText.length < text.length,
        wordCount: this.countWords(processedText),
        estimatedTokens: Math.ceil(processedText.length / 4) // Rough token estimate
      };
    }

    return result;
  }

  intelligentTruncate(sections, maxLength) {
    let totalLength = 0;
    const includedSections = [];

    for (const section of sections) {
      const sectionLength = section.title.length + section.content.length;
      if (totalLength + sectionLength <= maxLength) {
        includedSections.push(section);
        totalLength += sectionLength;
      } else {
        // Include partial content from this section if possible
        const remainingLength = maxLength - totalLength - section.title.length;
        if (remainingLength > 100) {
          includedSections.push({
            title: section.title,
            content: section.content.substring(0, remainingLength) + '\n[Section truncated...]'
          });
        }
        break;
      }
    }

    return includedSections.map(section => 
      `${section.title}\n${section.content}`
    ).join('\n\n');
  }
}

module.exports = ContentProcessor;