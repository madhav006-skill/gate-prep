const SochoReview = require('../models/SochoReview');
const TestAttempt = require('../models/TestAttempt');
const RevisionQuestion = require('../models/RevisionQuestion');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @desc    Get Socho summary (True Mastery Score & stats)
// @route   GET /api/socho/summary
// @access  Private
exports.getSummary = async (req, res) => {
  try {
    const reviews = await SochoReview.find({ user: req.user.id });

    let questionsReviewed = 0;
    let masteredConcepts = 0;
    let doubtfulCorrect = 0;
    let luckyCorrect = 0;
    let conceptGaps = 0;
    let pendingCount = 0;
    
    let totalExplanationQuality = 0;
    let totalConceptClarity = 0;
    
    reviews.forEach(review => {
      if (review.status === 'Pending') {
        pendingCount++;
        return; // Don't count pending towards stats
      }
      
      questionsReviewed++;
      totalExplanationQuality += review.explanationQuality || 0;
      totalConceptClarity += review.conceptClarity || 0;

      switch (review.masteryLabel) {
        case 'Mastered':
          masteredConcepts++;
          break;
        case 'Correct but Doubtful':
          doubtfulCorrect++;
          break;
        case 'Lucky Correct':
          luckyCorrect++;
          break;
        case 'Concept Gap':
          conceptGaps++;
          break;
      }
    });

    let trueMasteryScore = 0;
    if (questionsReviewed > 0) {
      const avgExpQuality = totalExplanationQuality / questionsReviewed;
      const avgClarity = totalConceptClarity / questionsReviewed;
      const masteredRatio = masteredConcepts / questionsReviewed;

      // True Mastery Score = average explanation quality * 0.35 + mastered ratio * 100 * 0.35 + concept clarity average * 0.20 + consistency bonus * 0.10 - doubtful correct penalty
      trueMasteryScore = (avgExpQuality * 0.35) + (masteredRatio * 100 * 0.35) + (avgClarity * 0.20);
      
      // Bonus & Penalty
      const consistencyBonus = (questionsReviewed > 10 && masteredRatio > 0.5) ? 10 : 0;
      const doubtPenalty = (doubtfulCorrect + luckyCorrect) * 2;
      
      trueMasteryScore = trueMasteryScore + consistencyBonus - doubtPenalty;
      if (trueMasteryScore < 0) trueMasteryScore = 0;
      if (trueMasteryScore > 100) trueMasteryScore = 100;
    }

    res.status(200).json({
      success: true,
      data: {
        trueMasteryScore: Math.round(trueMasteryScore),
        questionsReviewed,
        masteredConcepts,
        doubtfulCorrect,
        luckyCorrect,
        conceptGaps,
        pendingCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error fetching Socho summary' });
  }
};

// @desc    Get Socho queue (pending items)
// @route   GET /api/socho/queue
// @access  Private
exports.getQueue = async (req, res) => {
  try {
    const queue = await SochoReview.find({ user: req.user.id, status: 'Pending' })
      .populate('question')
      .populate('test', 'title')
      .sort({ priority: 1, createdAt: -1 }); // We will map 'High' to show first. Wait, String sort 'High' vs 'Medium' vs 'Low' will be H, L, M.
      // To sort properly by priority enum:
    
    const priorityMap = { 'High': 1, 'Medium': 2, 'Low': 3 };
    const sortedQueue = queue.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority] || b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      data: sortedQueue
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error fetching Socho queue' });
  }
};

// @desc    Generate Socho queue from submitted attempts
// @route   POST /api/socho/generate
// @access  Private
exports.generateQueue = async (req, res) => {
  try {
    // 1. Get recent attempts that have not been fully processed by Socho
    // For simplicity, we just fetch all submitted attempts from the last 7 days and check answers
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attempts = await TestAttempt.find({ 
      user: req.user.id, 
      status: 'Submitted',
      createdAt: { $gte: thirtyDaysAgo }
    }).populate('test').populate('answers.question');

    let generatedCount = 0;

    for (let attempt of attempts) {
      for (let ans of attempt.answers) {
        if (!ans.question) continue;

        let suspicionReason = null;
        let priority = 'Low';

        const q = ans.question;
        const isCorrect = ans.isCorrect;
        const timeSpent = ans.timeSpent;
        const status = ans.status;

        // Condition 1: Correct but slow
        if (isCorrect && timeSpent > 180) {
          suspicionReason = "Correct but slow";
          priority = "Medium";
        }
        // Condition 3: Correct but marked for review
        else if (isCorrect && (status === 'Marked for Review' || status === 'Answered and Marked for Review')) {
          suspicionReason = "Correct but marked for review";
          priority = "High";
        }
        // Condition 7: Easy question wrong
        else if (!isCorrect && q.difficulty === 'Easy' && status.includes('Answered')) {
          suspicionReason = "Easy question wrong";
          priority = "High";
        }
        // Condition 8: Skipped easy question
        else if (q.difficulty === 'Easy' && !status.includes('Answered')) {
          suspicionReason = "Skipped easy question";
          priority = "Medium";
        }
        // Condition 5: Normal wrong answer (Medium/Hard)
        else if (!isCorrect && status.includes('Answered')) {
          suspicionReason = "Wrong answer needs reasoning check";
          priority = q.difficulty === 'Medium' ? "Medium" : "Low";
        }
        // Condition 6: NAT close answer
        else if (!isCorrect && q.type === 'NAT' && status.includes('Answered')) {
          suspicionReason = "Possible calculation or precision error";
          priority = "Medium";
        }
        // Condition 2 & 4 (Topic accuracy history) requires deeper aggregation, 
        // skipped for basic evaluation performance, but can be added if needed.

        if (suspicionReason) {
          // Check if already exists to prevent duplicate
          const existing = await SochoReview.findOne({
            user: req.user.id,
            attempt: attempt._id,
            question: q._id
          });

          if (!existing) {
            await SochoReview.create({
              user: req.user.id,
              question: q._id,
              attempt: attempt._id,
              test: attempt.test._id,
              subject: q.subject,
              topic: q.topic,
              questionType: q.type,
              originalResult: isCorrect ? 'Correct' : (!status.includes('Answered') ? 'Skipped' : 'Wrong'),
              originalStatus: status,
              userAnswer: ans.answer,
              timeSpent: timeSpent,
              marks: q.marks,
              marksAwarded: ans.marksAwarded,
              suspicionReason,
              priority
            });
            generatedCount++;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      generatedCount,
      message: `Generated ${generatedCount} new Socho reviews.`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to generate Socho queue' });
  }
};

// @desc    Get Socho history
// @route   GET /api/socho/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const { status, label } = req.query;
    
    let query = { user: req.user.id, status: { $ne: 'Pending' } };
    
    if (status) query.status = status;
    if (label) query.masteryLabel = label;

    const history = await SochoReview.find(query)
      .populate('question')
      .populate('test', 'title')
      .sort({ reviewedAt: -1 });

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error fetching Socho history' });
  }
};

// @desc    Get single review
// @route   GET /api/socho/reviews/:id
// @access  Private
exports.getReview = async (req, res) => {
  try {
    const review = await SochoReview.findOne({ _id: req.params.id, user: req.user.id })
      .populate('question')
      .populate('test', 'title');

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error fetching Socho review' });
  }
};

// @desc    Submit explanation and get diagnosis
// @route   POST /api/socho/reviews/:id/submit
// @access  Private
exports.submitExplanation = async (req, res) => {
  try {
    const { explanation } = req.body;
    if (!explanation) {
      return res.status(400).json({ success: false, error: 'Explanation is required' });
    }

    const review = await SochoReview.findOne({ _id: req.params.id, user: req.user.id }).populate('question');
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const isCorrect = review.originalResult === 'Correct';

    // Gemini AI Engine
    let masteryLabel = 'Mastered';
    let explanationQuality = 80;
    let conceptClarity = 80;
    let feedback = 'Good explanation. You seem to understand the core concept well.';
    let recommendedAction = 'Great. Keep this concept in light revision.';

    try {
      const prompt = `
        You are "Socho", a strict but helpful AI tutor evaluating a student's explanation for a competitive exam question (like GATE).
        
        Question: "${review.question.content}"
        Question Difficulty: ${review.question.difficulty}
        Correct Answer: "${review.question.correctAnswer}"
        Student's Given Answer: "${review.userAnswer}"
        Student's Result: ${isCorrect ? 'Correct' : 'Wrong'}
        
        Student's Explanation for their answer:
        "${explanation}"
        
        Analyze the student's explanation and evaluate their true understanding of the concept.
        Return ONLY a JSON object (without markdown blocks) with the following exact keys:
        - masteryLabel: Must be exactly one of ["Mastered", "Correct but Doubtful", "Lucky Correct", "Partial Understanding", "Concept Gap", "Calculation Error", "Question Misread", "Formula Forgotten", "Needs Revision"].
        - explanationQuality: Number between 0 and 100 representing how well they articulated their reasoning.
        - conceptClarity: Number between 0 and 100 representing how well they actually understand the underlying concept.
        - feedback: A 2-3 sentence personalized feedback explaining why you gave this label and pointing out any flaws in their logic.
        - recommendedAction: A short, actionable next step (e.g., "Review the formula for X and practice 2 questions").
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const resultText = response.text;
      const parsed = JSON.parse(resultText);

      if (parsed.masteryLabel) masteryLabel = parsed.masteryLabel;
      if (parsed.explanationQuality) explanationQuality = parsed.explanationQuality;
      if (parsed.conceptClarity) conceptClarity = parsed.conceptClarity;
      if (parsed.feedback) feedback = parsed.feedback;
      if (parsed.recommendedAction) recommendedAction = parsed.recommendedAction;

    } catch (aiError) {
      console.error("Gemini API Error, falling back to heuristics:", aiError);
      
      // Fallback heuristics if API fails
      const text = explanation.toLowerCase();
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      
      if (wordCount < 5) {
        masteryLabel = 'Needs Revision';
        feedback = 'API unavailable. Explanation too short.';
        recommendedAction = 'Add to revision.';
      } else if (!isCorrect) {
        masteryLabel = 'Concept Gap';
        feedback = 'API unavailable. You got this wrong.';
        recommendedAction = 'Review concept.';
      }
    }

    // Update the review
    review.explanationText = explanation;
    review.masteryLabel = masteryLabel;
    review.explanationQuality = explanationQuality;
    review.conceptClarity = conceptClarity;
    review.feedback = feedback;
    review.recommendedAction = recommendedAction;
    review.status = 'Reviewed';
    review.reviewedAt = Date.now();

    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to submit explanation' });
  }
};

// @desc    Add question to Smart Revision
// @route   POST /api/socho/reviews/:id/add-to-revision
// @access  Private
exports.addToRevision = async (req, res) => {
  try {
    const review = await SochoReview.findOne({ _id: req.params.id, user: req.user.id });
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Check if it already exists in Revision
    const existing = await RevisionQuestion.findOne({ user: req.user.id, question: review.question });
    if (!existing) {
      await RevisionQuestion.create({
        user: req.user.id,
        question: review.question,
        priority: review.priority === 'High' ? 1 : 2,
        nextReviewDate: new Date(Date.now() + 86400000), // tomorrow
        reason: review.masteryLabel,
        topic: review.topic,
        subject: review.subject
      });
    }

    review.status = 'AddedToRevision';
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Added to Smart Revision queue'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add to revision' });
  }
};

// @desc    Mark as Mastered
// @route   POST /api/socho/reviews/:id/mark-mastered
// @access  Private
exports.markMastered = async (req, res) => {
  try {
    const review = await SochoReview.findOne({ _id: req.params.id, user: req.user.id });
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    review.status = 'Mastered';
    review.masteryLabel = 'Mastered';
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Marked as Mastered'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
};
