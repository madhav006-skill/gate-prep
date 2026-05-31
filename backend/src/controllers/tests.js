const MockTest = require('../models/MockTest');
const TestAttempt = require('../models/TestAttempt');
const Question = require('../models/Question');
const RevisionQuestion = require('../models/RevisionQuestion');
const Mistake = require('../models/Mistake');

const logMistake = async (userId, attemptId, question, ans, reason, source) => {
  try {
    let category = 'Concept Gap';
    if (reason === 'Wrong Answer') {
      if (question.difficulty === 'easy') category = 'Silly Mistake';
      else if (question.type === 'NAT') category = 'Calculation Error';
    } else if (reason === 'Slow but Correct') {
      category = 'Time Pressure';
    } else if (reason === 'Skipped Easy') {
      category = 'Skipped Easy';
    } else if (reason === 'Marked for Review') {
      category = 'Marked for Review';
    }

    const priority = (reason === 'Wrong Answer' || reason === 'Skipped Easy') ? 'High' : 'Medium';
    const marksLost = ans.marksAwarded < 0 ? Math.abs(ans.marksAwarded) + question.marks : question.marks; 
    
    let fixAction = 'Review this mistake and identify the root cause.';
    switch (category) {
      case 'Concept Gap': fixAction = "Revise core concept of this topic and solve 10 PYQs."; break;
      case 'Silly Mistake': fixAction = "Review solution steps slowly and identify the careless step."; break;
      case 'Calculation Error': fixAction = "Practice 5 numerical questions and verify units/signs after solving."; break;
      case 'Time Pressure': fixAction = "Attempt a 15-minute speed drill for this topic."; break;
      case 'Skipped Easy': fixAction = "Practice easy questions from this topic and improve question selection."; break;
      case 'Marked for Review': fixAction = "Revisit this question and confirm the concept."; break;
    }

    const historyEntry = {
      attemptId,
      questionId: question._id,
      userAnswer: ans.answer,
      wasCorrect: ans.isCorrect,
      timeSpent: ans.timeSpent || 0,
      marksLost: (reason === 'Slow but Correct' || (reason === 'Marked for Review' && ans.isCorrect)) ? 0 : marksLost,
      source,
      detectedCategory: category
    };

    let mistake = await Mistake.findOne({ user: userId, question: question._id });
    
    if (mistake) {
      mistake.timesRepeated += 1;
      mistake.lastOccurredAt = Date.now();
      mistake.status = 'Open';
      if (mistake.priority !== 'High') mistake.priority = priority;
      mistake.marksLost += historyEntry.marksLost;
      mistake.history.push(historyEntry);
      await mistake.save();
    } else {
      await Mistake.create({
        user: userId,
        question: question._id,
        subject: question.subject || 'General',
        topic: question.topic || 'General',
        questionType: question.type,
        detectedCategory: category,
        priority,
        status: 'Open',
        timesRepeated: 1,
        marksLost: historyEntry.marksLost,
        fixAction,
        source,
        history: [historyEntry]
      });
    }
  } catch (err) {
    console.error('Error logging mistake:', err);
  }
};

// @desc    Get all tests
// @route   GET /api/tests
// @access  Public
exports.getTests = async (req, res, next) => {
  try {
    const tests = await MockTest.find({ isActive: true }).sort('-createdAt');
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test (metadata only)
// @route   GET /api/tests/:id
// @access  Public
exports.getTest = async (req, res, next) => {
  try {
    const test = await MockTest.findById(req.params.id).select('-questions');
    if (!test) return next(new Error(`Test not found with id ${req.params.id}`));
    res.status(200).json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attempts for logged in user
// @route   GET /api/tests/user/my-attempts
// @access  Private
exports.getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await TestAttempt.find({ user: req.user.id })
      .select('test status score accuracy createdAt')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    next(error);
  }
};

// @desc    Create test
// @route   POST /api/tests
// @access  Admin
exports.createTest = async (req, res, next) => {
  try {
    const test = await MockTest.create(req.body);
    res.status(201).json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

// @desc    Start test attempt (fetches questions without answers)
// @route   POST /api/tests/:id/start
// @access  Private
exports.startTestAttempt = async (req, res, next) => {
  try {
    const test = await MockTest.findById(req.params.id).populate({
      path: 'questions.question',
      select: '-correctAnswer -explanation' // Hide correct answers from frontend!
    });

    if (!test) return next(new Error(`Test not found`));

    // Create a new attempt
    const attempt = await TestAttempt.create({
      user: req.user.id,
      test: test._id,
      answers: test.questions.map(q => ({
        question: q.question._id,
        status: 'Not Visited'
      }))
    });

    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id,
        test: {
          _id: test._id,
          title: test.title,
          duration: test.duration,
          questions: test.questions
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save single answer
// @route   POST /api/tests/attempts/:attemptId/save-answer
// @access  Private
exports.saveAnswer = async (req, res, next) => {
  try {
    const { questionId, answer, status, timeSpent } = req.body;
    const attempt = await TestAttempt.findById(req.params.attemptId);

    if (!attempt || attempt.user.toString() !== req.user.id) {
      return next(new Error('Attempt not found or unauthorized'));
    }
    if (attempt.status === 'Submitted') {
      return next(new Error('Test already submitted'));
    }

    const answerIndex = attempt.answers.findIndex(a => a.question.toString() === questionId);
    if (answerIndex > -1) {
      attempt.answers[answerIndex].answer = answer;
      attempt.answers[answerIndex].status = status;
      // Frontend sends cumulative timeSpent (not a delta), so use assignment not +=
      attempt.answers[answerIndex].timeSpent = timeSpent || 0;
    }

    await attempt.save();
    res.status(200).json({ success: true, message: 'Saved' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit test and evaluate
// @route   POST /api/tests/attempts/:attemptId/submit
// @access  Private
exports.submitTest = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId);

    if (!attempt || attempt.user.toString() !== req.user.id) {
      return next(new Error('Attempt not found or unauthorized'));
    }
    if (attempt.status === 'Submitted') {
      return res.status(200).json({ success: true, data: attempt });
    }

    // Evaluate answers
    let score = 0;
    let correctCount = 0;
    let attemptedCount = 0;
    
    const timeTaken = (Date.now() - new Date(attempt.startTime).getTime()) / 1000;
    attempt.timeTaken = timeTaken;
    attempt.endTime = Date.now();

    // Track per-topic wrong counts for "Repeated Topic Weakness" detection
    const topicWrongMap = {};

    for (let ans of attempt.answers) {
      const question = await Question.findById(ans.question);
      if (!question) continue;

      const isAnswered = ans.status.includes('Answered') && ans.answer !== undefined && ans.answer !== null;
      const isMarked = ans.status.includes('Marked for Review');

      if (isAnswered) {
        attemptedCount++;
        let isCorrect = false;

        if (question.type === 'MCQ') {
          isCorrect = String(ans.answer).toLowerCase() === String(question.correctAnswer).toLowerCase();
          if (isCorrect) {
            ans.marksAwarded = question.marks;
            score += question.marks;
            correctCount++;
          } else {
            const negMarks = question.negativeMarks != null ? question.negativeMarks : (question.marks / 3);
            ans.marksAwarded = -negMarks;
            score += ans.marksAwarded;
          }
        } else if (question.type === 'MSQ') {
          const correctArr = Array.isArray(question.correctAnswer) ? question.correctAnswer.map(s => String(s).toLowerCase()).sort() : [String(question.correctAnswer).toLowerCase()];
          const userArr = Array.isArray(ans.answer) ? ans.answer.map(s => String(s).toLowerCase()).sort() : [String(ans.answer).toLowerCase()];
          isCorrect = JSON.stringify(correctArr) === JSON.stringify(userArr);
          ans.marksAwarded = isCorrect ? question.marks : 0;
          if (isCorrect) { score += question.marks; correctCount++; }
        } else if (question.type === 'NAT') {
          const userVal = parseFloat(ans.answer);
          if (typeof question.correctAnswer === 'string' && question.correctAnswer.includes('-')) {
            const parts = question.correctAnswer.split('-').map(v => parseFloat(v));
            const min = parts[0];
            const max = parts[1];
            isCorrect = !isNaN(userVal) && userVal >= min && userVal <= max;
          } else {
            const correctVal = parseFloat(question.correctAnswer);
            isCorrect = !isNaN(userVal) && !isNaN(correctVal) && Math.abs(userVal - correctVal) < 0.01;
          }
          ans.marksAwarded = isCorrect ? question.marks : 0;
          if (isCorrect) { score += question.marks; correctCount++; }
        }

        ans.isCorrect = isCorrect;

        // ── Revision auto-population ──────────────────────────────────────
        const topicKey = `${question.subject}::${question.topic}`;

        if (!isCorrect) {
          // Track for repeated weakness detection
          topicWrongMap[topicKey] = (topicWrongMap[topicKey] || 0) + 1;

          const priority = question.difficulty === 'easy' ? 'High' : 'Medium';
          await RevisionQuestion.findOneAndUpdate(
            { user: req.user.id, question: question._id },
            {
              $set: {
                reason: 'Wrong Answer',
                priority,
                subject: question.subject || 'General',
                topic: question.topic || 'General',
                questionType: question.type,
                dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                status: 'Due',
                nextIntervalDays: 1,
                lastPracticed: null
              },
              $inc: { attempts: 1 }
            },
            { upsert: true }
          ).catch(() => {});
          
          await logMistake(req.user.id, attempt._id, question, ans, 'Wrong Answer', 'mock_test');
        } else if (isCorrect && ans.timeSpent > 180) {
          // Slow but correct — only add if not already flagged as Wrong
          await RevisionQuestion.findOneAndUpdate(
            { user: req.user.id, question: question._id, reason: { $ne: 'Wrong Answer' } },
            {
              $set: {
                reason: 'Slow but Correct',
                priority: 'Medium',
                subject: question.subject || 'General',
                topic: question.topic || 'General',
                questionType: question.type,
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                status: 'Upcoming',
                nextIntervalDays: 2
              },
              $inc: { attempts: 1 }
            },
            { upsert: true }
          ).catch(() => {});
          
          await logMistake(req.user.id, attempt._id, question, ans, 'Slow but Correct', 'mock_test');
        }
        // ─────────────────────────────────────────────────────────────────
      } else {
        // Not answered
        // Marked for Review
        if (isMarked) {
          await RevisionQuestion.findOneAndUpdate(
            { user: req.user.id, question: question._id, reason: { $nin: ['Wrong Answer', 'Slow but Correct'] } },
            {
              $set: {
                reason: 'Marked for Review',
                priority: 'Medium',
                subject: question.subject || 'General',
                topic: question.topic || 'General',
                questionType: question.type,
                dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                status: 'Due',
                nextIntervalDays: 1
              },
              $inc: { attempts: 1 }
            },
            { upsert: true }
          ).catch(() => {});
          
          await logMistake(req.user.id, attempt._id, question, ans, 'Marked for Review', 'mock_test');
        }

        // Skipped Easy
        if (!isMarked && question.difficulty === 'easy') {
          await RevisionQuestion.findOneAndUpdate(
            { user: req.user.id, question: question._id, reason: { $nin: ['Wrong Answer', 'Slow but Correct', 'Marked for Review'] } },
            {
              $set: {
                reason: 'Skipped Easy',
                priority: 'Medium',
                subject: question.subject || 'General',
                topic: question.topic || 'General',
                questionType: question.type,
                dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                status: 'Due',
                nextIntervalDays: 1
              },
              $inc: { attempts: 1 }
            },
            { upsert: true }
          ).catch(() => {});
          
          await logMistake(req.user.id, attempt._id, question, ans, 'Skipped Easy', 'mock_test');
        }
      }
    }

    // Repeated Topic Weakness — topic with ≥3 wrong answers in this attempt
    for (const [topicKey, count] of Object.entries(topicWrongMap)) {
      if (count >= 3) {
        const [subject, topic] = topicKey.split('::');
        // Upgrade priority of all existing revision items in this topic
        await RevisionQuestion.updateMany(
          { user: req.user.id, subject, topic, status: { $ne: 'Completed' } },
          { $set: { priority: 'High', reason: 'Repeated Topic Weakness', dueDate: new Date(), status: 'Due' } }
        );
        // Upgrade Mistake priorities for repeated topic weakness
        await Mistake.updateMany(
          { user: req.user.id, subject, topic, status: 'Open' },
          { $set: { priority: 'High' } }
        );
      }
    }

    attempt.score = Math.round(score * 100) / 100;
    attempt.accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
    attempt.status = 'Submitted';
    attempt.endTime = new Date();
    attempt.timeTaken = Math.round(timeTaken);

    // Adaptive Insights Calculation
    const testDoc = await MockTest.findById(attempt.test);
    if (testDoc && testDoc.isAdaptive) {
      let marksRecovered = 0;
      let weakTopicsImproved = [];
      let speedImprovedCount = 0;

      for (let ans of attempt.answers) {
        if (ans.isCorrect) {
          marksRecovered += ans.marksAwarded;
          const qTopic = ans.question ? (await Question.findById(ans.question)).topic : null;
          if (qTopic && testDoc.topicDistribution && testDoc.topicDistribution.get(qTopic)) {
            if (!weakTopicsImproved.includes(qTopic)) weakTopicsImproved.push(qTopic);
          }
          if (ans.timeSpent > 0 && ans.timeSpent <= 120) speedImprovedCount++;
        }
      }

      attempt.adaptiveInsights = {
        marksRecovered,
        weakTopicsImproved,
        speedImprovedCount,
        message: `You recovered ${marksRecovered} marks and showed improvement in ${weakTopicsImproved.length} targeted topics.`
      };
    }

    await attempt.save();

    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
};


// @desc    Get complete test result (with correct answers & explanations)
// @route   GET /api/tests/attempts/:attemptId/result
// @access  Private
exports.getTestResult = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId)
      .populate('test')
      .populate('answers.question');

    if (!attempt || attempt.user.toString() !== req.user.id) {
      return next(new Error('Attempt not found or unauthorized'));
    }

    if (attempt.status !== 'Submitted') {
      return next(new Error('Test is not submitted yet'));
    }

    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
};
