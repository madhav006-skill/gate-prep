const RevisionQuestion = require('../models/RevisionQuestion');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');

// Helper: compute dueDate based on reason
function computeDueDate(reason) {
  const now = new Date();
  const map = {
    'Wrong Answer': 1,
    'Marked for Review': 1,
    'Skipped Easy': 1,
    'Slow but Correct': 2,
    'Repeated Topic Weakness': 0
  };
  const days = map[reason] ?? 1;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

// Helper: compute initial priority
function computePriority(reason, difficulty, isRepeat) {
  if (reason === 'Repeated Topic Weakness') return 'High';
  if (reason === 'Wrong Answer' && difficulty === 'easy') return 'High';
  if (reason === 'Wrong Answer' && isRepeat) return 'High';
  if (reason === 'Wrong Answer') return 'Medium';
  return 'Medium';
}

// Helper: compute status from dueDate
function computeStatus(dueDate) {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  if (dueDate < now && dueDate.toDateString() !== now.toDateString()) return 'Overdue';
  if (dueDate <= todayEnd) return 'Due';
  return 'Upcoming';
}

// Helper: recommended action text
function getRecommendedAction(reason, priority) {
  const actions = {
    'Wrong Answer': 'Revise the concept thoroughly and retry this question.',
    'Slow but Correct': 'Practice similar questions to improve speed.',
    'Marked for Review': 'Re-read the question and verify your understanding.',
    'Skipped Easy': 'Attempt this easy question to build confidence.',
    'Repeated Topic Weakness': 'Focus on this topic — study the concept and retry.'
  };
  return actions[reason] || 'Review and practice this question.';
}

// @desc  Get user's revision queue
// @route GET /api/revision
// @access Private
exports.getRevisionQueue = async (req, res) => {
  try {
    const { filter, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // First, mark overdue items
    await RevisionQuestion.updateMany(
      {
        user: req.user.id,
        status: { $in: ['Due', 'Upcoming'] },
        dueDate: { $lt: new Date(new Date().setHours(0, 0, 0, 0)) }
      },
      { $set: { status: 'Overdue' } }
    );

    let query = { user: req.user.id };
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    switch (filter) {
      case 'due-today':
        query.dueDate = { $lte: todayEnd };
        query.status = { $in: ['Due', 'Overdue'] };
        break;
      case 'high-priority':
        query.priority = 'High';
        query.status = { $ne: 'Completed' };
        break;
      case 'wrong':
        query.reason = 'Wrong Answer';
        query.status = { $ne: 'Completed' };
        break;
      case 'slow':
        query.reason = 'Slow but Correct';
        query.status = { $ne: 'Completed' };
        break;
      case 'marked':
        query.reason = 'Marked for Review';
        query.status = { $ne: 'Completed' };
        break;
      case 'completed':
        query.status = 'Completed';
        break;
      default:
        // 'all' — everything
        break;
    }

    const items = await RevisionQuestion.find(query)
      .populate('question', 'questionHtml options correctAnswer explanation explanationHtml imageUrl type marks difficulty')
      .sort({ status: 1, priority: 1, dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RevisionQuestion.countDocuments(query);

    // Attach recommended action
    const enriched = items.map(item => {
      const obj = item.toObject();
      obj.recommendedAction = getRecommendedAction(obj.reason, obj.priority);
      return obj;
    });

    res.status(200).json({ success: true, total, data: enriched });
  } catch (err) {
    console.error('getRevisionQueue error:', err);
    res.status(500).json({ success: false, error: 'Failed to load revision queue' });
  }
};

// @desc  Get today's revision summary stats
// @route GET /api/revision/summary
// @access Private
exports.getRevisionSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Mark overdue
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    await RevisionQuestion.updateMany(
      {
        user: userId,
        status: { $in: ['Due', 'Upcoming'] },
        dueDate: { $lt: startOfDay }
      },
      { $set: { status: 'Overdue' } }
    );

    const [dueToday, highPriority, wrongCount, slowCount, total, completed] = await Promise.all([
      RevisionQuestion.countDocuments({ user: userId, dueDate: { $lte: todayEnd }, status: { $in: ['Due', 'Overdue'] } }),
      RevisionQuestion.countDocuments({ user: userId, priority: 'High', status: { $ne: 'Completed' } }),
      RevisionQuestion.countDocuments({ user: userId, reason: 'Wrong Answer', status: { $ne: 'Completed' } }),
      RevisionQuestion.countDocuments({ user: userId, reason: 'Slow but Correct', status: { $ne: 'Completed' } }),
      RevisionQuestion.countDocuments({ user: userId }),
      RevisionQuestion.countDocuments({ user: userId, status: 'Completed' })
    ]);

    // Estimate time: 3 min per due item (rough average)
    const estimatedTimeMinutes = dueToday * 3;

    res.status(200).json({
      success: true,
      data: {
        dueToday,
        highPriority,
        wrongCount,
        slowCount,
        total,
        completed,
        estimatedTimeMinutes
      }
    });
  } catch (err) {
    console.error('getRevisionSummary error:', err);
    res.status(500).json({ success: false, error: 'Failed to load revision summary' });
  }
};

// @desc  Practice a revision question (submit answer, update schedule)
// @route PUT /api/revision/:id/practice
// @access Private
exports.practiceRevision = async (req, res) => {
  try {
    const { answer, timeSpent } = req.body;

    const item = await RevisionQuestion.findOne({ _id: req.params.id, user: req.user.id })
      .populate('question', 'correctAnswer type marks difficulty');

    if (!item) return res.status(404).json({ success: false, error: 'Revision item not found' });

    const q = item.question;
    let isCorrect = false;

    // Evaluate answer
    if (q.type === 'MCQ') {
      isCorrect = String(answer).toLowerCase() === String(q.correctAnswer).toLowerCase();
    } else if (q.type === 'MSQ') {
      const cArr = Array.isArray(q.correctAnswer) ? q.correctAnswer.map(s => String(s).toLowerCase()).sort() : [];
      const uArr = Array.isArray(answer) ? answer.map(s => String(s).toLowerCase()).sort() : [];
      isCorrect = JSON.stringify(cArr) === JSON.stringify(uArr);
    } else if (q.type === 'NAT') {
      const userVal = parseFloat(answer);
      if (typeof q.correctAnswer === 'string' && q.correctAnswer.includes('-')) {
        const parts = q.correctAnswer.split('-').map(v => parseFloat(v));
        const min = parts[0];
        const max = parts[1];
        isCorrect = !isNaN(userVal) && userVal >= min && userVal <= max;
      } else {
        const correctVal = parseFloat(q.correctAnswer);
        isCorrect = !isNaN(userVal) && !isNaN(correctVal) && Math.abs(userVal - correctVal) < 0.01;
      }
    }

    const isFast = (timeSpent || 0) <= 120;
    let resultType, newInterval, newPriority, newStatus;

    if (isCorrect && isFast) {
      resultType = 'Correct Fast';
      newInterval = Math.min((item.nextIntervalDays || 1) * 2, 30);
      newPriority = item.priority === 'High' ? 'Medium' : 'Low';
      newStatus = 'Completed';
    } else if (isCorrect && !isFast) {
      resultType = 'Correct Slow';
      newInterval = 3;
      newPriority = 'Medium';
      newStatus = 'Upcoming';
    } else {
      // Wrong
      resultType = 'Wrong';
      newInterval = 1;
      newPriority = 'High';
      newStatus = 'Due';
    }

    const newDueDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

    await RevisionQuestion.findByIdAndUpdate(item._id, {
      $set: {
        status: newStatus,
        priority: newPriority,
        dueDate: newDueDate,
        nextIntervalDays: newInterval,
        lastPracticed: new Date()
      },
      $inc: { attempts: 1 },
      $push: {
        history: {
          date: new Date(),
          wasCorrect: isCorrect,
          timeSpent: timeSpent || 0,
          answer,
          resultType
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        resultType,
        newStatus,
        newPriority,
        nextDueDate: newDueDate
      }
    });
  } catch (err) {
    console.error('practiceRevision error:', err);
    res.status(500).json({ success: false, error: 'Failed to update practice result' });
  }
};

// @desc  Snooze a revision item by 1 day
// @route PUT /api/revision/:id/snooze
// @access Private
exports.snoozeRevision = async (req, res) => {
  try {
    const item = await RevisionQuestion.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        $set: {
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'Upcoming'
        }
      },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to snooze' });
  }
};

// @desc  Mark revision item as completed
// @route PUT /api/revision/:id/complete
// @access Private
exports.completeRevision = async (req, res) => {
  try {
    const item = await RevisionQuestion.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        $set: {
          status: 'Completed',
          lastPracticed: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark complete' });
  }
};

// @desc  Force regenerate revision queue from all past attempts
// @route POST /api/revision/generate
// @access Private
exports.generateRevisionFromAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    const attempts = await TestAttempt.find({ user: userId, status: 'Submitted' })
      .populate('answers.question');

    // Count per-topic wrong answers across all attempts
    const topicWrongCount = {};
    let generated = 0;

    for (const attempt of attempts) {
      for (const ans of attempt.answers) {
        const q = ans.question;
        if (!q) continue;

        const topicKey = `${q.subject}::${q.topic}`;
        const isAnswered = ans.status.includes('Answered');
        const isWrong = isAnswered && !ans.isCorrect;

        if (isWrong) {
          topicWrongCount[topicKey] = (topicWrongCount[topicKey] || 0) + 1;
        }

        let reason = null;
        let priority = 'Medium';
        let daysUntilDue = 1;

        if (isAnswered && !ans.isCorrect) {
          reason = 'Wrong Answer';
          daysUntilDue = 1;
          priority = q.difficulty === 'easy' ? 'High' : 'Medium';
        } else if (isAnswered && ans.isCorrect && ans.timeSpent > 180) {
          reason = 'Slow but Correct';
          daysUntilDue = 2;
          priority = 'Medium';
        } else if (ans.status.includes('Marked for Review')) {
          reason = 'Marked for Review';
          daysUntilDue = 1;
          priority = 'Medium';
        } else if (!isAnswered && q.difficulty === 'easy') {
          reason = 'Skipped Easy';
          daysUntilDue = 1;
          priority = 'Medium';
        }

        if (reason) {
          try {
            await RevisionQuestion.findOneAndUpdate(
              { user: userId, question: q._id },
              {
                $set: {
                  reason,
                  priority,
                  subject: q.subject || 'General',
                  topic: q.topic || 'General',
                  questionType: q.type,
                  dueDate: new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000),
                  status: daysUntilDue === 0 ? 'Due' : 'Upcoming',
                  nextIntervalDays: daysUntilDue
                },
                $inc: { attempts: 1 }
              },
              { upsert: true }
            );
            generated++;
          } catch (e) {
            // ignore duplicate key errors
          }
        }
      }
    }

    // Handle repeated topic weakness (≥3 wrongs in a topic)
    for (const [key, count] of Object.entries(topicWrongCount)) {
      if (count >= 3) {
        const [subject, topic] = key.split('::');
        // Find questions from this topic not already in revision
        const existingQIds = await RevisionQuestion.find({ user: userId }).distinct('question');
        const weakTopicQs = await Question.find({
          subject, topic,
          _id: { $nin: existingQIds }
        }).limit(5);

        for (const q of weakTopicQs) {
          try {
            await RevisionQuestion.findOneAndUpdate(
              { user: userId, question: q._id },
              {
                $set: {
                  reason: 'Repeated Topic Weakness',
                  priority: 'High',
                  subject: q.subject,
                  topic: q.topic,
                  questionType: q.type,
                  dueDate: new Date(), // due today
                  status: 'Due',
                  nextIntervalDays: 0
                },
                $setOnInsert: { attempts: 1 }
              },
              { upsert: true }
            );
            generated++;
          } catch (e) { /* skip */ }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated/updated ${generated} revision items from ${attempts.length} test attempts.`
    });
  } catch (err) {
    console.error('generateRevisionFromAttempts error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate revision queue' });
  }
};
