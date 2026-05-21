const MockTest = require('../models/MockTest');
const TestAttempt = require('../models/TestAttempt');
const Question = require('../models/Question');
const RevisionQuestion = require('../models/RevisionQuestion');

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
      attempt.answers[answerIndex].timeSpent += (timeSpent || 0);
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
    
    // Calculate total time taken
    const timeTaken = (Date.now() - new Date(attempt.startTime).getTime()) / 1000;
    attempt.timeTaken = timeTaken;
    attempt.endTime = Date.now();

    for (let ans of attempt.answers) {
      if (ans.status.includes('Answered') && ans.answer !== undefined && ans.answer !== null) {
        attemptedCount++;
        const question = await Question.findById(ans.question);
        
        let isCorrect = false;

        // Evaluation Logic based on Question Type
        if (question.type === 'MCQ') {
          isCorrect = String(ans.answer).toLowerCase() === String(question.correctAnswer).toLowerCase();
          if (isCorrect) {
            ans.marksAwarded = question.marks;
            score += question.marks;
            correctCount++;
          } else {
            ans.marksAwarded = -(question.negativeMarks || (question.marks / 3)); // GATE standard negative
            score += ans.marksAwarded;
            
            // Add to Revision Engine for mistakes
            await RevisionQuestion.findOneAndUpdate(
              { user: req.user.id, question: question._id },
              { reason: 'Wrong', lastPracticed: Date.now(), $inc: { attempts: 1 } },
              { upsert: true }
            );
          }
        } else if (question.type === 'MSQ') {
          // MSQ logic: Arrays must match exactly. No negative marking.
          const correctArr = Array.isArray(question.correctAnswer) ? question.correctAnswer.map(s => String(s).toLowerCase()).sort() : [String(question.correctAnswer).toLowerCase()];
          const userArr = Array.isArray(ans.answer) ? ans.answer.map(s => String(s).toLowerCase()).sort() : [String(ans.answer).toLowerCase()];
          
          isCorrect = JSON.stringify(correctArr) === JSON.stringify(userArr);
          if (isCorrect) {
            ans.marksAwarded = question.marks;
            score += question.marks;
            correctCount++;
          } else {
            ans.marksAwarded = 0; // No negative marking in MSQ
          }
        } else if (question.type === 'NAT') {
          // NAT logic: Check if within range. No negative marking.
          const userVal = parseFloat(ans.answer);
          if (typeof question.correctAnswer === 'string' && question.correctAnswer.includes('-')) {
            const [min, max] = question.correctAnswer.split('-').map(parseFloat);
            isCorrect = userVal >= min && userVal <= max;
          } else {
            isCorrect = userVal === parseFloat(question.correctAnswer);
          }

          if (isCorrect) {
            ans.marksAwarded = question.marks;
            score += question.marks;
            correctCount++;
          } else {
            ans.marksAwarded = 0;
          }
        }

        ans.isCorrect = isCorrect;
      }
      
      // Track slow questions
      if (ans.timeSpent > 180 && ans.isCorrect) { // If it took more than 3 minutes but was correct
        await RevisionQuestion.findOneAndUpdate(
          { user: req.user.id, question: ans.question, reason: { $ne: 'Wrong' } },
          { reason: 'Slow', lastPracticed: Date.now(), $inc: { attempts: 1 } },
          { upsert: true }
        );
      }
    }

    attempt.score = Math.round(score * 100) / 100;
    attempt.accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
    attempt.status = 'Submitted';

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
