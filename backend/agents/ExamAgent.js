const BaseAgent = require('./BaseAgent');

class ExamAgent extends BaseAgent {
  constructor(options = {}) {
    super(options);
    this.defaultQuestionCount = options.defaultQuestionCount || 20;
    this.defaultDifficulty = options.defaultDifficulty || 'medium';
  }

  getSystemPrompt() {
    return `You are an expert exam creation agent specialized in generating high-quality educational assessments.
    
    Your expertise includes:
    - Creating various question types (MCQ, short answer, essay, true/false, fill-in-the-blank)
    - Adapting questions to different difficulty levels (easy, medium, hard)
    - Ensuring questions test understanding rather than memorization
    - Creating balanced exams that cover all important topics
    - Providing clear, unambiguous questions with appropriate answer options
    - Including detailed answer explanations and marking schemes
    
    Always ensure questions are pedagogically sound and assess genuine understanding.`;
  }

  async generateExam(content, options = {}) {
    const {
      questionCount = this.defaultQuestionCount,
      difficulty = this.defaultDifficulty,
      questionTypes = ['mcq', 'short_answer'],
      includeAnswers = true,
      examTitle = 'Generated Assessment',
      timeLimit = null,
      topics = []
    } = options;

    const distribution = this.calculateQuestionDistribution(questionCount, questionTypes);
    
    const examPrompt = `
    Create a comprehensive exam based on the following content:

    Content:
    ${content}

    Exam Requirements:
    - Title: ${examTitle}
    - Total Questions: ${questionCount}
    - Difficulty Level: ${difficulty}
    - Question Distribution: ${JSON.stringify(distribution)}
    ${timeLimit ? `- Suggested Time Limit: ${timeLimit} minutes` : ''}
    ${topics.length > 0 ? `- Focus on topics: ${topics.join(', ')}` : ''}

    Create questions that:
    1. Test genuine understanding, not just memorization
    2. Cover the most important concepts from the content
    3. Are clear, unambiguous, and well-structured
    4. Progress logically from basic to advanced concepts
    5. Include a mix of cognitive levels (knowledge, comprehension, application, analysis)

    Format the exam in the following JSON structure:
    {
      "examTitle": "${examTitle}",
      "metadata": {
        "totalQuestions": ${questionCount},
        "difficulty": "${difficulty}",
        "estimatedTime": "X minutes",
        "topics": ["topic1", "topic2", ...],
        "createdAt": "timestamp"
      },
      "instructions": "Clear instructions for exam takers",
      "questions": [
        {
          "id": 1,
          "type": "mcq|short_answer|essay|true_false|fill_blank",
          "difficulty": "easy|medium|hard",
          "topic": "topic name",
          "question": "Question text",
          "options": ["A", "B", "C", "D"] (for MCQ only),
          "points": number,
          "answer": "correct answer" (if includeAnswers is true),
          "explanation": "detailed explanation" (if includeAnswers is true)
        }
      ],
      "answerKey": {
        "totalPoints": number,
        "passingScore": number,
        "answers": ["answer1", "answer2", ...]
      }
    }
    `;

    try {
      const examResponse = await this.generateCompletion(examPrompt, {
        temperature: 0.4,
        maxTokens: 4000
      });

      // Try to parse as JSON
      try {
        const exam = JSON.parse(examResponse);
        return this.validateAndEnhanceExam(exam);
      } catch (parseError) {
        console.warn('Failed to parse exam as JSON, attempting to structure manually');
        return this.parseUnstructuredExam(examResponse, options);
      }
    } catch (error) {
      console.error('Exam generation error:', error);
      throw new Error('Failed to generate exam: ' + error.message);
    }
  }

  async generateQuestionsByType(content, type, count = 5, difficulty = 'medium') {
    const typePrompts = {
      mcq: this.getMCQPrompt(content, count, difficulty),
      short_answer: this.getShortAnswerPrompt(content, count, difficulty),
      essay: this.getEssayPrompt(content, count, difficulty),
      true_false: this.getTrueFalsePrompt(content, count, difficulty),
      fill_blank: this.getFillBlankPrompt(content, count, difficulty)
    };

    const prompt = typePrompts[type];
    if (!prompt) {
      throw new Error(`Unsupported question type: ${type}`);
    }

    return await this.generateCompletion(prompt, {
      temperature: 0.4,
      maxTokens: 2000
    });
  }

  getMCQPrompt(content, count, difficulty) {
    return `
    Create ${count} multiple choice questions based on the following content.
    Difficulty: ${difficulty}

    Content:
    ${content}

    Requirements:
    - Each question should have 4 options (A, B, C, D)
    - Only one correct answer per question
    - Distractors should be plausible but clearly incorrect
    - Questions should test understanding, not just recall
    - Include variety in question stems (what, why, how, which, etc.)

    Format each question as:
    Question X: [Question text]
    A) [Option A]
    B) [Option B]
    C) [Option C]
    D) [Option D]
    Correct Answer: [Letter]
    Explanation: [Why this answer is correct]
    `;
  }

  getShortAnswerPrompt(content, count, difficulty) {
    return `
    Create ${count} short answer questions based on the following content.
    Difficulty: ${difficulty}

    Content:
    ${content}

    Requirements:
    - Questions should require 2-4 sentence responses
    - Test comprehension and application of concepts
    - Avoid questions with simple yes/no answers
    - Include variety in cognitive levels

    Format each question as:
    Question X: [Question text]
    Sample Answer: [Expected response]
    Points: [Point value]
    `;
  }

  getEssayPrompt(content, count, difficulty) {
    return `
    Create ${count} essay questions based on the following content.
    Difficulty: ${difficulty}

    Content:
    ${content}

    Requirements:
    - Questions should require detailed, analytical responses
    - Test higher-order thinking skills (analysis, synthesis, evaluation)
    - Should allow for multiple valid approaches
    - Include clear criteria for assessment

    Format each question as:
    Question X: [Question text]
    Expected Elements: [Key points that should be addressed]
    Assessment Criteria: [How responses should be evaluated]
    Points: [Point value]
    `;
  }

  getTrueFalsePrompt(content, count, difficulty) {
    return `
    Create ${count} true/false questions based on the following content.
    Difficulty: ${difficulty}

    Content:
    ${content}

    Requirements:
    - Statements should be clearly true or false
    - Avoid ambiguous or trick statements
    - Test important factual knowledge
    - Include justification for each answer

    Format each question as:
    Question X: [Statement]
    Answer: [True/False]
    Explanation: [Why this answer is correct]
    `;
  }

  getFillBlankPrompt(content, count, difficulty) {
    return `
    Create ${count} fill-in-the-blank questions based on the following content.
    Difficulty: ${difficulty}

    Content:
    ${content}

    Requirements:
    - Remove key terms or concepts
    - Blanks should test important vocabulary or facts
    - Provide clear context clues
    - Avoid removing too many words from one sentence

    Format each question as:
    Question X: [Sentence with _____ for blanks]
    Answer: [Correct word/phrase]
    Points: [Point value]
    `;
  }

  calculateQuestionDistribution(totalQuestions, questionTypes) {
    const distribution = {};
    const typesCount = questionTypes.length;
    const baseCount = Math.floor(totalQuestions / typesCount);
    const remainder = totalQuestions % typesCount;

    questionTypes.forEach((type, index) => {
      distribution[type] = baseCount + (index < remainder ? 1 : 0);
    });

    return distribution;
  }

  validateAndEnhanceExam(exam) {
    // Add metadata if missing
    if (!exam.metadata) {
      exam.metadata = {
        totalQuestions: exam.questions?.length || 0,
        createdAt: new Date().toISOString()
      };
    }

    // Ensure all questions have required fields
    if (exam.questions) {
      exam.questions = exam.questions.map((question, index) => ({
        id: question.id || index + 1,
        type: question.type || 'mcq',
        difficulty: question.difficulty || 'medium',
        points: question.points || 1,
        ...question
      }));
    }

    return exam;
  }

  parseUnstructuredExam(examText, options) {
    // Fallback method to structure unstructured exam text
    return {
      examTitle: options.examTitle || 'Generated Assessment',
      metadata: {
        totalQuestions: options.questionCount || 0,
        difficulty: options.difficulty || 'medium',
        createdAt: new Date().toISOString()
      },
      rawContent: examText,
      error: 'Could not parse structured exam format'
    };
  }
}

module.exports = ExamAgent;