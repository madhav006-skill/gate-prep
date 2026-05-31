const MockTest = require('../models/MockTest');
const TestAttempt = require('../models/TestAttempt');
const Mistake = require('../models/Mistake');
const RevisionQuestion = require('../models/RevisionQuestion');
const Question = require('../models/Question');
const mongoose = require('mongoose');

// Helper to calculate topic profiles
const getTopicProfiles = async (userId) => {
  const attempts = await TestAttempt.find({ user: userId, status: 'Submitted' }).populate('answers.question');
  const mistakes = await Mistake.find({ user: userId });
  const revisions = await RevisionQuestion.find({ user: userId });

  const profiles = {}; // key: "subject::topic"

  const initProfile = (subject, topic) => {
    const key = `${subject}::${topic}`;
    if (!profiles[key]) {
      profiles[key] = {
        subject,
        topic,
        attempted: 0,
        correct: 0,
        wrong: 0,
        marksLost: 0,
        timeSpent: 0,
        skippedEasy: 0,
        slow: 0,
        mistakesCount: 0,
        repeatedMistakes: 0,
        revisionDue: 0
      };
    }
    return profiles[key];
  };

  // Analyze attempts
  for (const att of attempts) {
    for (const ans of att.answers) {
      if (!ans.question) continue;
      const q = ans.question;
      const p = initProfile(q.subject || 'General', q.topic || 'General');

      const isAnswered = ans.status.includes('Answered');
      if (isAnswered) {
        p.attempted++;
        p.timeSpent += ans.timeSpent || 0;
        if (ans.isCorrect) {
          p.correct++;
          if (ans.timeSpent > 180) p.slow++;
        } else {
          p.wrong++;
          p.marksLost += ans.marksAwarded < 0 ? Math.abs(ans.marksAwarded) + q.marks : q.marks;
        }
      } else if (q.difficulty === 'easy') {
        p.skippedEasy++;
      }
    }
  }

  // Analyze mistakes
  for (const m of mistakes) {
    const p = initProfile(m.subject, m.topic);
    p.mistakesCount++;
    if (m.timesRepeated > 1) p.repeatedMistakes += m.timesRepeated;
    if (m.status === 'Open') p.marksLost += m.marksLost; // rough estimate
  }

  // Analyze revisions
  for (const r of revisions) {
    if (r.status === 'Due' || r.status === 'Overdue') {
      const p = initProfile(r.subject, r.topic);
      p.revisionDue++;
    }
  }

  // Calculate priority score
  const scoredProfiles = Object.values(profiles).map(p => {
    p.accuracy = p.attempted > 0 ? (p.correct / p.attempted) * 100 : 0;
    
    let priorityScore = (p.marksLost * 3) + 
                        (p.wrong * 2) + 
                        (p.skippedEasy * 2) + 
                        (p.repeatedMistakes * 3) + 
                        (p.slow) + 
                        (p.revisionDue * 2);

    if (p.attempted > 5) {
      if (p.accuracy > 80) priorityScore -= 10;
      if (p.accuracy < 50) priorityScore += 10;
    }

    p.priorityScore = priorityScore;
    return p;
  });

  return scoredProfiles.sort((a, b) => b.priorityScore - a.priorityScore);
};

// @desc    Get recommendation for adaptive test
// @route   GET /api/adaptive/recommendation
// @access  Private
exports.getRecommendation = async (req, res, next) => {
  try {
    const profiles = await getTopicProfiles(req.user.id);
    
    if (profiles.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          mode: 'Diagnostic',
          reason: 'You haven\'t completed enough tests yet. Take a diagnostic test to identify your baseline.',
          focusTopics: []
        }
      });
    }

    const topWeak = profiles.slice(0, 3);
    const hasMajorWeakness = topWeak.some(p => p.priorityScore > 20);
    
    let mode = 'Weakness Booster';
    let reason = `You lost significant marks recently in ${topWeak.map(t => t.topic).join(', ')}.`;

    const totalSlow = profiles.reduce((sum, p) => sum + p.slow, 0);
    if (totalSlow > 15 && !hasMajorWeakness) {
      mode = 'Speed Drill';
      reason = 'Your accuracy is good, but you are spending too much time on easy/medium questions.';
    }

    const totalRepeatedMistakes = profiles.reduce((sum, p) => sum + p.repeatedMistakes, 0);
    if (totalRepeatedMistakes > 5 && hasMajorWeakness) {
      mode = 'Mistake Recovery';
      reason = `You are repeating mistakes in ${topWeak[0].topic}. Let's fix them permanently.`;
    }

    res.status(200).json({
      success: true,
      data: {
        mode,
        reason,
        focusTopics: topWeak.map(t => t.topic)
      }
    });
  } catch (error) {
    console.error('getRecommendation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendation' });
  }
};

// @desc    Generate a new adaptive test
// @route   POST /api/adaptive/generate
// @access  Private
exports.generateTest = async (req, res, next) => {
  try {
    const { 
      mode = 'Weakness Booster', 
      questionCount = 15,
      difficultyBalance = 'Auto'
    } = req.body;

    const userId = req.user.id;
    const profiles = await getTopicProfiles(userId);
    
    if (profiles.length === 0 && mode !== 'Diagnostic') {
      return res.status(400).json({ success: false, error: 'Not enough data to generate adaptive test. Please take a Diagnostic test first.' });
    }

    // Determine target distribution based on mode
    let targetWeakRatio = 0.5;
    let targetMistakeRatio = 0.2;
    let targetMixedRatio = 0.3;

    if (mode === 'Full Adaptive Mock') {
      targetWeakRatio = 0.3; targetMistakeRatio = 0.2; targetMixedRatio = 0.5;
    } else if (mode === 'Mistake Recovery') {
      targetWeakRatio = 0.2; targetMistakeRatio = 0.7; targetMixedRatio = 0.1;
    } else if (mode === 'Speed Drill') {
      targetWeakRatio = 0.1; targetMistakeRatio = 0.1; targetMixedRatio = 0.8;
    }

    const topWeakTopics = profiles.slice(0, 5).map(p => p.topic);
    
    // Fetch user's past question attempts to calculate freshness and avoid repeats
    const pastAttempts = await TestAttempt.find({ user: userId }).populate('answers.question');
    const attemptedQIds = new Set();
    const wrongQIds = new Set();
    const slowQIds = new Set();

    pastAttempts.forEach(att => {
      att.answers.forEach(ans => {
        if (!ans.question) return;
        attemptedQIds.add(ans.question._id.toString());
        if (ans.status.includes('Answered') && !ans.isCorrect) wrongQIds.add(ans.question._id.toString());
        if (ans.status.includes('Answered') && ans.isCorrect && ans.timeSpent > 180) slowQIds.add(ans.question._id.toString());
      });
    });

    const openMistakes = await Mistake.find({ user: userId, status: 'Open' });
    const mistakeQIds = new Set(openMistakes.map(m => m.question.toString()));

    // Fetch pool of questions
    const pool = await Question.find({}).lean();
    
    // Score questions
    let scoredPool = pool.map(q => {
      let score = 0;
      const isAttempted = attemptedQIds.has(q._id.toString());
      const isWrong = wrongQIds.has(q._id.toString());
      const isMistake = mistakeQIds.has(q._id.toString());
      const isSlow = slowQIds.has(q._id.toString());
      
      const topicProfile = profiles.find(p => p.topic === q.topic);
      const topicPriority = topicProfile ? topicProfile.priorityScore : 0;

      // Base scoring
      score += topicPriority;

      // Repeat penalties and bonuses
      if (isAttempted && !isWrong && !isMistake && !isSlow) {
        score -= 100; // Heavily penalize recently answered correct questions
      }

      if (mode === 'Mistake Recovery' && (isWrong || isMistake)) {
        score += 200; 
      } else if (mode === 'Speed Drill' && isSlow) {
        score += 150;
        if (q.difficulty === 'easy' || q.difficulty === 'medium') score += 50;
      } else if (mode === 'Weakness Booster' && topWeakTopics.includes(q.topic)) {
        score += 100;
        if (isWrong) score += 50;
      } else if (mode === 'NAT Accuracy Drill' && q.type === 'NAT') {
        score += 150;
      } else if (mode === 'Rank Push Test') {
        if (q.difficulty === 'easy' && !isAttempted) score += 100; // Find easy marks
      }

      // Difficulty adjusting
      if (difficultyBalance === 'Easy Focus' && q.difficulty === 'hard') score -= 50;
      if (difficultyBalance === 'Hard Challenge' && q.difficulty === 'easy') score -= 50;

      return { ...q, selectionScore: score };
    });

    // Sort and select top N
    scoredPool.sort((a, b) => b.selectionScore - a.selectionScore);
    const selectedQuestions = scoredPool.slice(0, questionCount).map((q, idx) => ({
      question: q._id,
      order: idx + 1
    }));

    if (selectedQuestions.length === 0) {
      return res.status(400).json({ success: false, error: 'Not enough questions available to generate this test.' });
    }

    // Compute distributions
    const topicDist = {};
    const diffDist = {};
    const typeDist = {};
    let totalMarks = 0;

    selectedQuestions.forEach(sq => {
      const q = scoredPool.find(x => x._id.toString() === sq.question.toString());
      if (q) {
        topicDist[q.topic] = (topicDist[q.topic] || 0) + 1;
        diffDist[q.difficulty] = (diffDist[q.difficulty] || 0) + 1;
        typeDist[q.type] = (typeDist[q.type] || 0) + 1;
        totalMarks += q.marks;
      }
    });

    // Estimate duration: 2 mins for easy, 3 for medium, 4 for hard
    let durationMins = (diffDist['easy'] || 0) * 2 + (diffDist['medium'] || 0) * 3 + (diffDist['hard'] || 0) * 4;
    if (mode === 'Speed Drill') durationMins = Math.floor(durationMins * 0.6); // 40% less time

    // Create the test
    const adaptiveTest = await MockTest.create({
      title: `${mode} - ${new Date().toLocaleDateString()}`,
      description: `Personalized test focusing on: ${Object.keys(topicDist).slice(0,3).join(', ')}.`,
      subject: 'Mixed',
      type: 'Adaptive Mock',
      duration: durationMins,
      totalMarks,
      questions: selectedQuestions,
      isAdaptive: true,
      generatedForUser: userId,
      adaptiveMode: mode,
      adaptiveReason: `Focuses on recovering marks from your weakest areas.`,
      topicDistribution: topicDist,
      difficultyDistribution: diffDist,
      typeDistribution: typeDist
    });

    res.status(201).json({ success: true, data: adaptiveTest });

  } catch (error) {
    console.error('generateTest error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate test' });
  }
};

// @desc    Get user's adaptive test history
// @route   GET /api/adaptive/history
// @access  Private
exports.getHistory = async (req, res, next) => {
  try {
    const tests = await MockTest.find({ 
      isAdaptive: true, 
      generatedForUser: req.user.id 
    }).sort('-createdAt').select('-questions');

    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    console.error('getHistory error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
};

// @desc    Get preview of a generated adaptive test
// @route   GET /api/adaptive/:id/preview
// @access  Private
exports.getPreview = async (req, res, next) => {
  try {
    const test = await MockTest.findOne({ 
      _id: req.params.id, 
      isAdaptive: true, 
      generatedForUser: req.user.id 
    }).select('-questions');

    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });
    res.status(200).json({ success: true, data: test });
  } catch (error) {
    console.error('getPreview error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch preview' });
  }
};
