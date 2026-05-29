const TestAttempt = require('../models/TestAttempt');

// @desc    Get AI Weakness Radar analysis
// @route   GET /api/analytics/weakness-radar
// @access  Private
exports.getWeaknessRadar = async (req, res, next) => {
  try {
    // 1. Fetch all submitted attempts for the user, populate questions
    const attempts = await TestAttempt.find({ user: req.user.id, status: 'Submitted' })
      .populate('answers.question');

    if (!attempts || attempts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          isEmpty: true,
          message: 'Complete at least one mock test to unlock your AI Weakness Radar.'
        }
      });
    }

    // Initialize global trackers
    let overallTotal = 0;
    let overallAttempted = 0;
    let overallCorrect = 0;
    let slowQuestionsCount = 0;

    const topicMap = {};
    const marksLostBreakdown = {
      conceptGap: 0,
      sillyMistake: 0,
      timePressure: 0,
      skippedEasy: 0,
      unclassified: 0
    };

    // 2. Process all answers
    attempts.forEach(attempt => {
      attempt.answers.forEach(ans => {
        const q = ans.question;
        if (!q) return;

        overallTotal++;

        // Initialize topic in map
        const topicKey = `${q.subject} - ${q.topic}`;
        if (!topicMap[topicKey]) {
          topicMap[topicKey] = {
            subject: q.subject,
            topic: q.topic,
            totalQuestions: 0,
            attemptedQuestions: 0,
            correctQuestions: 0,
            wrongQuestions: 0,
            skippedQuestions: 0,
            totalTimeSpent: 0,
            marksLost: 0,
            wrongAnswersList: [], // To track repeated mistakes
            slowAnswersCount: 0,
            skippedEasyCount: 0
          };
        }

        const t = topicMap[topicKey];
        t.totalQuestions++;
        t.totalTimeSpent += ans.timeSpent || 0;

        if (ans.timeSpent > 180) {
          slowQuestionsCount++;
          t.slowAnswersCount++;
        }

        const isAttempted = ans.status === 'Answered' || ans.status === 'Answered and Marked for Review';
        if (isAttempted) {
          overallAttempted++;
          t.attemptedQuestions++;
          
          if (ans.isCorrect) {
            overallCorrect++;
            t.correctQuestions++;
          } else {
            t.wrongQuestions++;
            t.wrongAnswersList.push(q);
            // Marks lost for wrong = question marks - (negative marks if any, or 0)
            // If marksAwarded is negative, they lost (question.marks - marksAwarded)
            // We'll just say marks lost = full question marks + any negative deduction
            let lost = q.marks;
            if (ans.marksAwarded < 0) {
               lost += Math.abs(ans.marksAwarded);
            }
            t.marksLost += lost;
          }
        } else {
          // Skipped
          t.skippedQuestions++;
          t.marksLost += q.marks; // Full marks lost for skipping
          if (q.difficulty === 'easy') {
            t.skippedEasyCount++;
          }
        }
      });
    });

    // 3. Calculate scores & classify mistakes per topic
    let conceptGapTopicsCount = 0;
    const weakTopics = [];

    Object.values(topicMap).forEach(t => {
      // Accuracy
      t.accuracy = t.attemptedQuestions > 0 
        ? Math.round((t.correctQuestions / t.attemptedQuestions) * 100) 
        : 0;
      
      t.averageTime = t.totalQuestions > 0 
        ? Math.round(t.totalTimeSpent / t.totalQuestions) 
        : 0;

      // Determine primary Mistake Type
      t.mistakeType = 'Needs Practice'; // Default
      let mistakeReason = 'unclassified';
      
      const hasRepeatedWrong = t.wrongQuestions >= 2;
      const hasEasyWrong = t.wrongAnswersList.some(q => q.difficulty === 'easy');

      if (t.accuracy < 50 || hasRepeatedWrong) {
        t.mistakeType = 'Concept Gap';
        mistakeReason = 'conceptGap';
        conceptGapTopicsCount++;
      } else if (hasEasyWrong || (t.accuracy > 60 && t.wrongQuestions > 0)) {
        t.mistakeType = 'Silly Mistake';
        mistakeReason = 'sillyMistake';
      } else if (t.averageTime > 180 || t.slowAnswersCount >= 2 || (t.skippedQuestions > 0 && t.averageTime > 120)) {
        t.mistakeType = 'Time Pressure';
        mistakeReason = 'timePressure';
      } else if (t.skippedEasyCount > 0) {
        t.mistakeType = 'Skipped Easy Question';
        mistakeReason = 'skippedEasy';
      }

      // Add to overall breakdown
      if (marksLostBreakdown[mistakeReason] !== undefined) {
        marksLostBreakdown[mistakeReason] = Number((marksLostBreakdown[mistakeReason] + t.marksLost).toFixed(2));
      }

      t.marksLost = Number(t.marksLost.toFixed(2));

      // Determine Priority
      if (t.marksLost >= 5 || t.accuracy < 40 || t.mistakeType === 'Concept Gap') {
        t.priority = 'High';
      } else if (t.marksLost >= 2 || (t.accuracy >= 40 && t.accuracy <= 65) || t.mistakeType === 'Time Pressure') {
        t.priority = 'Medium';
      } else {
        t.priority = 'Low';
      }

      // Recommended Action
      if (t.mistakeType === 'Concept Gap') {
        t.recommendedAction = `Revise ${t.topic} concepts and solve 10 PYQs.`;
      } else if (t.mistakeType === 'Silly Mistake') {
        t.recommendedAction = `Review wrong answers in ${t.topic} and practice carefully.`;
      } else if (t.mistakeType === 'Time Pressure') {
        t.recommendedAction = `Take a 15-minute speed drill for ${t.topic}.`;
      } else {
        t.recommendedAction = `Solve a mix of easy and medium questions for ${t.topic}.`;
      }

      if (t.marksLost > 0) {
        weakTopics.push(t);
      }
    });

    // 4. Sort Weak Topics
    weakTopics.sort((a, b) => {
      // 1. High priority first
      const pMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
      if (pMap[b.priority] !== pMap[a.priority]) {
        return pMap[b.priority] - pMap[a.priority];
      }
      // 2. Higher marks lost
      if (b.marksLost !== a.marksLost) {
        return b.marksLost - a.marksLost;
      }
      // 3. Lower accuracy
      return a.accuracy - b.accuracy;
    });

    const topWeakTopics = weakTopics.slice(0, 5);

    // 5. Generate Overall Scores
    const accuracyScore = overallAttempted > 0 ? Math.round((overallCorrect / overallAttempted) * 100) : 0;
    
    let speedScore = 100 - (slowQuestionsCount * 5);
    if (speedScore < 0) speedScore = 0;

    let conceptStrengthScore = 100 - (conceptGapTopicsCount * 10);
    if (conceptStrengthScore < 0) conceptStrengthScore = 0;

    const completionScore = overallTotal > 0 ? Math.round((overallAttempted / overallTotal) * 100) : 0;

    const readinessScore = Math.round(
      (accuracyScore * 0.40) + 
      (speedScore * 0.25) + 
      (conceptStrengthScore * 0.25) + 
      (completionScore * 0.10)
    );

    // 6. Generate Action Items
    const actionItems = topWeakTopics.slice(0, 4).map(t => {
      if (t.mistakeType === 'Time Pressure') {
        return `Take a 15-minute speed drill for ${t.topic} (${t.subject}).`;
      } else if (t.mistakeType === 'Concept Gap') {
        return `Revise ${t.topic} notes for 30 minutes.`;
      } else {
        return `Retry wrong questions and solve 5 new PYQs from ${t.topic}.`;
      }
    });

    if (actionItems.length === 0) {
      actionItems.push("Take another mock test to gather more data.");
    }

    res.status(200).json({
      success: true,
      data: {
        isEmpty: false,
        scores: {
          readiness: readinessScore,
          accuracy: accuracyScore,
          speed: speedScore,
          conceptStrength: conceptStrengthScore
        },
        marksLostBreakdown,
        topWeakTopics,
        actionItems
      }
    });

  } catch (error) {
    console.error('Weakness Radar Error:', error);
    next(error);
  }
};

// @desc    Get basic analytics overview
// @route   GET /api/analytics/overview
// @access  Private
exports.getOverview = async (req, res, next) => {
  try {
    const attempts = await TestAttempt.find({ user: req.user.id });
    
    // Basic stats
    const testsTaken = attempts.length;
    let totalScore = 0;
    let maxPossibleScore = 0;
    let highestScore = 0;
    
    attempts.forEach(a => {
      totalScore += (a.score || 0);
      maxPossibleScore += (a.totalMarks || 100);
      if (a.score > highestScore) highestScore = a.score;
    });
    
    const averageScore = testsTaken > 0 ? (totalScore / testsTaken).toFixed(2) : 0;
    const accuracy = maxPossibleScore > 0 ? ((totalScore / maxPossibleScore) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        testsTaken,
        averageScore,
        highestScore,
        accuracy: `${accuracy}%`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get topic-wise analysis
// @route   GET /api/analytics/topic-analysis
// @access  Private
exports.getTopicAnalysis = async (req, res, next) => {
  try {
    // We can just return a basic summary or reuse weakness radar logic
    // For now, return a basic list of topics the user has encountered
    const attempts = await TestAttempt.find({ user: req.user.id }).populate('answers.question');
    
    const topics = {};
    attempts.forEach(attempt => {
      attempt.answers.forEach(ans => {
        const q = ans.question;
        if (!q) return;
        
        const key = q.topic || 'General';
        if (!topics[key]) topics[key] = { name: key, count: 0, correct: 0 };
        
        topics[key].count++;
        if (ans.isCorrect) topics[key].correct++;
      });
    });
    
    const formattedTopics = Object.values(topics).map(t => ({
      ...t,
      accuracy: t.count > 0 ? Math.round((t.correct / t.count) * 100) : 0
    }));

    res.status(200).json({
      success: true,
      data: formattedTopics
    });
  } catch (error) {
    next(error);
  }
};
