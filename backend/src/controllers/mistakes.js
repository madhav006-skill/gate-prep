const Mistake = require('../models/Mistake');
const Question = require('../models/Question');

// Helper to generate fix actions based on category
const generateFixAction = (category) => {
  switch (category) {
    case 'Concept Gap': return "Revise core concept of this topic and solve 10 PYQs.";
    case 'Silly Mistake': return "Review solution steps slowly and identify the careless step.";
    case 'Calculation Error': return "Practice 5 numerical questions and verify units/signs after solving.";
    case 'Time Pressure': return "Attempt a 15-minute speed drill for this topic.";
    case 'Question Misread': return "Underline keywords and constraints before solving similar questions.";
    case 'Formula Forgotten': return "Add formula to formula sheet and revise it daily for 3 days.";
    case 'Skipped Easy': return "Practice easy questions from this topic and improve question selection.";
    case 'Marked for Review': return "Revisit this question and confirm the concept.";
    default: return "Review this mistake and identify the root cause.";
  }
};

// @desc    Get all mistakes for a user with filtering
// @route   GET /api/mistakes
// @access  Private
exports.getMistakes = async (req, res, next) => {
  try {
    const { status, priority, category, search } = req.query;
    
    let query = { user: req.user.id };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.detectedCategory = category;
    
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { shortSummary: { $regex: search, $options: 'i' } },
        { userNote: { $regex: search, $options: 'i' } }
      ];
    }
    
    const mistakes = await Mistake.find(query)
      .populate('question')
      .sort({ lastOccurredAt: -1 });
      
    res.status(200).json({ success: true, count: mistakes.length, data: mistakes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get summary stats of mistakes
// @route   GET /api/mistakes/summary
// @access  Private
exports.getSummary = async (req, res, next) => {
  try {
    const mistakes = await Mistake.find({ user: req.user.id });
    
    const summary = {
      total: mistakes.length,
      open: 0,
      resolved: 0,
      repeated: 0,
      highPriority: 0,
      categories: {}
    };
    
    mistakes.forEach(m => {
      if (m.status === 'Open') summary.open++;
      if (m.status === 'Resolved') summary.resolved++;
      if (m.timesRepeated > 1) summary.repeated++;
      if (m.priority === 'High') summary.highPriority++;
      
      summary.categories[m.detectedCategory] = (summary.categories[m.detectedCategory] || 0) + 1;
    });
    
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

// @desc    Add manual mistake note
// @route   POST /api/mistakes/manual
// @access  Private
exports.addManualMistake = async (req, res, next) => {
  try {
    const { subject, topic, category, description, fixAction, priority } = req.body;
    
    const mistake = await Mistake.create({
      user: req.user.id,
      subject,
      topic,
      questionType: 'Manual',
      detectedCategory: category || 'Other',
      priority: priority || 'Low',
      status: 'Open',
      shortSummary: description,
      fixAction: fixAction || generateFixAction(category || 'Other'),
      source: 'manual'
    });
    
    res.status(201).json({ success: true, data: mistake });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a mistake (status, note, category)
// @route   PUT /api/mistakes/:id
// @access  Private
exports.updateMistake = async (req, res, next) => {
  try {
    let mistake = await Mistake.findById(req.params.id);
    
    if (!mistake) {
      return res.status(404).json({ success: false, error: 'Mistake not found' });
    }
    
    if (mistake.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Update fields
    const { status, detectedCategory, userNote, priority, fixAction } = req.body;
    
    if (status) {
      mistake.status = status;
      if (status === 'Resolved') {
        mistake.resolvedAt = new Date();
      }
    }
    if (detectedCategory) {
      mistake.detectedCategory = detectedCategory;
      if (!mistake.fixAction || mistake.fixAction === generateFixAction('Other')) {
        mistake.fixAction = generateFixAction(detectedCategory);
      }
    }
    if (userNote !== undefined) mistake.userNote = userNote;
    if (priority) mistake.priority = priority;
    if (fixAction) mistake.fixAction = fixAction;
    
    await mistake.save();
    
    res.status(200).json({ success: true, data: mistake });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a mistake
// @route   DELETE /api/mistakes/:id
// @access  Private
exports.deleteMistake = async (req, res, next) => {
  try {
    const mistake = await Mistake.findById(req.params.id);
    
    if (!mistake) {
      return res.status(404).json({ success: false, error: 'Mistake not found' });
    }
    
    if (mistake.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    await mistake.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
