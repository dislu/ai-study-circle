const mongoose = require('mongoose');
const Template = require('./models/Template');
require('dotenv').config();

const defaultTemplates = [
  {
    name: "Academic Summary - Comprehensive",
    description: "Detailed academic summary template for research papers and textbook chapters with key points, definitions, and examples.",
    type: "summary",
    category: "academic",
    difficulty: "intermediate",
    summaryConfig: {
      style: "outline",
      length: "detailed",
      targetAudience: "student",
      includeKeyPoints: true,
      includeExamples: true,
      includeDefinitions: true,
      tone: "academic",
      structure: [
        { section: "Introduction", description: "Main topic and thesis", required: true },
        { section: "Key Concepts", description: "Important definitions and terms", required: true },
        { section: "Main Arguments", description: "Core arguments or findings", required: true },
        { section: "Supporting Evidence", description: "Data, examples, and citations", required: false },
        { section: "Conclusion", description: "Summary and implications", required: true }
      ]
    },
    aiInstructions: {
      summaryPrompt: "Create a comprehensive academic summary that captures the main concepts, key arguments, and supporting evidence. Include clear definitions of important terms and provide examples where relevant. Structure the content logically with clear headings and maintain an academic tone throughout.",
      additionalContext: "Focus on clarity and educational value. Ensure all technical terms are explained and the content is accessible to students."
    },
    tags: ["academic", "research", "comprehensive", "educational"],
    isPublic: true,
    isDefault: true,
    createdBy: null // Will be set to first admin user
  },

  {
    name: "Business Brief Summary",
    description: "Concise business-focused summary template for reports, proposals, and strategic documents.",
    type: "summary",
    category: "business",
    difficulty: "intermediate",
    summaryConfig: {
      style: "bullet_points",
      length: "brief",
      targetAudience: "professional",
      includeKeyPoints: true,
      includeExamples: false,
      includeDefinitions: false,
      tone: "formal",
      structure: [
        { section: "Executive Summary", description: "Key takeaways and recommendations", required: true },
        { section: "Main Points", description: "Critical business information", required: true },
        { section: "Action Items", description: "Required steps and decisions", required: true },
        { section: "Financial Impact", description: "Cost and revenue implications", required: false }
      ]
    },
    aiInstructions: {
      summaryPrompt: "Create a concise business summary focusing on actionable insights, key decisions, and financial implications. Use clear bullet points and maintain a professional tone. Prioritize information that executives and managers need for decision-making.",
      additionalContext: "Emphasize practical applications and business value. Keep language professional but accessible."
    },
    tags: ["business", "executive", "brief", "professional"],
    isPublic: true,
    isDefault: true,
    createdBy: null
  },

  {
    name: "Technical Documentation Summary",
    description: "Technical summary template for API documentation, system guides, and technical specifications.",
    type: "summary",
    category: "technical",
    difficulty: "advanced",
    summaryConfig: {
      style: "outline",
      length: "detailed",
      targetAudience: "professional",
      includeKeyPoints: true,
      includeExamples: true,
      includeDefinitions: true,
      tone: "formal",
      structure: [
        { section: "Overview", description: "System or technology overview", required: true },
        { section: "Key Features", description: "Main functionality and capabilities", required: true },
        { section: "Implementation", description: "How to use or implement", required: true },
        { section: "Code Examples", description: "Sample code and usage patterns", required: false },
        { section: "Troubleshooting", description: "Common issues and solutions", required: false }
      ]
    },
    aiInstructions: {
      summaryPrompt: "Create a technical summary that explains complex concepts clearly while maintaining technical accuracy. Include practical examples and implementation details. Structure the content to be useful for both understanding and reference.",
      additionalContext: "Balance technical depth with clarity. Assume readers have some technical background but may be new to this specific topic."
    },
    tags: ["technical", "documentation", "implementation", "reference"],
    isPublic: true,
    isDefault: true,
    createdBy: null
  },

  {
    name: "Multiple Choice Exam - Standard",
    description: "Standard multiple choice exam template suitable for most subjects with varied difficulty levels.",
    type: "exam",
    category: "academic",
    difficulty: "intermediate",
    examConfig: {
      questionTypes: [
        { type: "multiple_choice", percentage: 70 },
        { type: "true_false", percentage: 20 },
        { type: "short_answer", percentage: 10 }
      ],
      totalQuestions: 25,
      timeLimit: 45,
      passingScore: 70,
      showAnswers: true,
      allowReview: true,
      randomizeQuestions: false,
      randomizeOptions: true,
      feedback: {
        immediate: false,
        detailed: true
      },
      sections: [
        { name: "Core Concepts", description: "Fundamental understanding", questionCount: 15, timeAllocation: 25 },
        { name: "Application", description: "Applied knowledge", questionCount: 7, timeAllocation: 15 },
        { name: "Analysis", description: "Critical thinking", questionCount: 3, timeAllocation: 5 }
      ]
    },
    aiInstructions: {
      examPrompt: "Create a well-balanced exam that tests understanding at multiple levels. Include foundational knowledge questions, application scenarios, and analytical thinking challenges. Ensure questions are clear, fair, and properly assess the learning objectives.",
      additionalContext: "Vary question difficulty gradually. Include distractors that test common misconceptions. Provide clear, educational feedback for incorrect answers."
    },
    tags: ["multiple-choice", "standard", "balanced", "assessment"],
    isPublic: true,
    isDefault: true,
    createdBy: null
  },

  {
    name: "Quick Assessment Quiz",
    description: "Short quiz template for quick knowledge checks and formative assessments.",
    type: "exam",
    category: "academic",
    difficulty: "beginner",
    examConfig: {
      questionTypes: [
        { type: "multiple_choice", percentage: 60 },
        { type: "true_false", percentage: 40 }
      ],
      totalQuestions: 10,
      timeLimit: 15,
      passingScore: 60,
      showAnswers: true,
      allowReview: false,
      randomizeQuestions: true,
      randomizeOptions: true,
      feedback: {
        immediate: true,
        detailed: false
      }
    },
    aiInstructions: {
      examPrompt: "Create a quick, engaging quiz that checks basic understanding. Focus on key concepts and avoid overly complex questions. Provide immediate feedback to enhance learning.",
      additionalContext: "Keep questions straightforward and focused. This is for learning reinforcement, not comprehensive assessment."
    },
    tags: ["quiz", "quick", "formative", "basic"],
    isPublic: true,
    isDefault: true,
    createdBy: null
  },

  {
    name: "Comprehensive Assessment",
    description: "Thorough examination template with multiple question types for comprehensive evaluation.",
    type: "exam",
    category: "academic",
    difficulty: "advanced",
    examConfig: {
      questionTypes: [
        { type: "multiple_choice", percentage: 40 },
        { type: "short_answer", percentage: 30 },
        { type: "essay", percentage: 20 },
        { type: "true_false", percentage: 10 }
      ],
      totalQuestions: 50,
      timeLimit: 120,
      passingScore: 75,
      showAnswers: true,
      allowReview: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      feedback: {
        immediate: false,
        detailed: true
      },
      sections: [
        { name: "Knowledge Base", description: "Foundational concepts", questionCount: 20, timeAllocation: 40 },
        { name: "Application", description: "Practical application", questionCount: 15, timeAllocation: 35 },
        { name: "Analysis & Synthesis", description: "Higher-order thinking", questionCount: 10, timeAllocation: 30 },
        { name: "Evaluation", description: "Critical evaluation", questionCount: 5, timeAllocation: 15 }
      ]
    },
    aiInstructions: {
      examPrompt: "Create a comprehensive exam that thoroughly evaluates understanding across all cognitive levels. Include questions that test recall, comprehension, application, analysis, synthesis, and evaluation. Ensure a logical progression in difficulty and complexity.",
      additionalContext: "This is a high-stakes assessment. Questions should be challenging but fair, with clear rubrics for subjective questions."
    },
    tags: ["comprehensive", "advanced", "thorough", "high-stakes"],
    isPublic: true,
    isDefault: true,
    createdBy: null
  },

  {
    name: "Medical Case Study Template",
    description: "Specialized template for medical education with case-based learning approach.",
    type: "both",
    category: "medical",
    difficulty: "expert",
    summaryConfig: {
      style: "outline",
      length: "comprehensive",
      targetAudience: "expert",
      includeKeyPoints: true,
      includeExamples: true,
      includeDefinitions: true,
      tone: "formal",
      structure: [
        { section: "Patient Presentation", description: "Symptoms and initial findings", required: true },
        { section: "Differential Diagnosis", description: "Possible conditions", required: true },
        { section: "Diagnostic Approach", description: "Tests and procedures", required: true },
        { section: "Treatment Plan", description: "Therapeutic interventions", required: true },
        { section: "Prognosis", description: "Expected outcomes", required: false }
      ]
    },
    examConfig: {
      questionTypes: [
        { type: "multiple_choice", percentage: 50 },
        { type: "short_answer", percentage: 30 },
        { type: "essay", percentage: 20 }
      ],
      totalQuestions: 20,
      timeLimit: 90,
      passingScore: 80,
      showAnswers: true,
      allowReview: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      feedback: {
        immediate: false,
        detailed: true
      }
    },
    aiInstructions: {
      summaryPrompt: "Create a comprehensive medical case analysis following clinical reasoning principles. Include detailed patient presentation, systematic diagnostic approach, evidence-based treatment options, and clinical decision-making rationale.",
      examPrompt: "Develop challenging medical questions that test clinical reasoning, diagnostic skills, and treatment knowledge. Include case scenarios that require critical thinking and application of medical principles.",
      additionalContext: "Maintain high clinical accuracy and follow current medical guidelines. Suitable for medical students and healthcare professionals."
    },
    tags: ["medical", "case-study", "clinical", "expert"],
    isPublic: true,
    isDefault: true,
    createdBy: null
  },

  {
    name: "Legal Document Summary",
    description: "Template for summarizing legal documents, contracts, and legal research with proper legal formatting.",
    type: "summary",
    category: "legal",
    difficulty: "advanced",
    summaryConfig: {
      style: "outline",
      length: "detailed",
      targetAudience: "professional",
      includeKeyPoints: true,
      includeExamples: false,
      includeDefinitions: true,
      tone: "formal",
      structure: [
        { section: "Document Overview", description: "Type and purpose of document", required: true },
        { section: "Key Provisions", description: "Important clauses and terms", required: true },
        { section: "Legal Implications", description: "Rights, obligations, and consequences", required: true },
        { section: "Risk Assessment", description: "Potential legal risks", required: false },
        { section: "Recommendations", description: "Suggested actions", required: false }
      ]
    },
    aiInstructions: {
      summaryPrompt: "Create a precise legal summary that identifies key provisions, legal implications, and potential risks. Use proper legal terminology while ensuring clarity. Focus on actionable information and legal significance.",
      additionalContext: "Maintain legal accuracy and precision. Suitable for legal professionals and those working with legal documents."
    },
    tags: ["legal", "contracts", "professional", "formal"],
    isPublic: true,
    isDefault: true,
    createdBy: null
  }
];

async function seedDefaultTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-study-circle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if templates already exist
    const existingTemplates = await Template.countDocuments({ isDefault: true });
    if (existingTemplates > 0) {
      console.log(`Found ${existingTemplates} default templates. Skipping seed.`);
      process.exit(0);
    }

    // Find first admin user or create a system user
    const User = require('./models/User');
    let systemUser = await User.findOne({ role: 'admin' });
    
    if (!systemUser) {
      // Create a system user for default templates
      systemUser = new User({
        username: 'system',
        email: 'system@aistudy.circle',
        password: 'system-generated', // This won't be used
        role: 'admin'
      });
      await systemUser.save();
      console.log('Created system user for default templates');
    }

    // Set createdBy for all templates
    const templatesWithCreator = defaultTemplates.map(template => ({
      ...template,
      createdBy: systemUser._id
    }));

    // Insert templates
    await Template.insertMany(templatesWithCreator);
    
    console.log(`Successfully seeded ${defaultTemplates.length} default templates`);
    console.log('Templates created:');
    templatesWithCreator.forEach(template => {
      console.log(`- ${template.name} (${template.type}, ${template.category})`);
    });

  } catch (error) {
    console.error('Error seeding default templates:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDefaultTemplates();
}

module.exports = { defaultTemplates, seedDefaultTemplates };