const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
const MockTest = require('../models/MockTest');

const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding in-memory database with sample data...');

    // 1. Create a dummy admin & user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@gateprep.com',
      password: 'password123',
      role: 'admin'
    });

      // Mock Users
      await User.create([
        {
          name: 'Student One',
          email: 'student@gate.com',
          password: 'password123',
          role: 'user',
          targetYear: 2025,
          targetSubject: 'CS',
          streak: { count: 3, lastActive: new Date() }
        },
        {
          name: 'Admin User',
          email: 'admin@gate.com',
          password: 'adminpassword',
          role: 'admin',
          targetYear: 2025,
          targetSubject: 'CS',
        }
      ]);// 2. Create sample questions
    const q1 = await Question.create({
      subject: 'CS',
      topic: 'Operating Systems',
      type: 'MCQ',
      content: 'Which of the following is NOT a valid state of a thread?',
      options: [
        { text: 'Running' },
        { text: 'Waiting' },
        { text: 'Yielding' },
        { text: 'Blocked' }
      ],
      correctAnswer: 'Yielding',
      marks: 1,
      negativeMarks: 0.33,
      explanation: 'Yielding is an action, not a state. Valid states are New, Runnable/Ready, Running, Waiting/Blocked, and Terminated.'
    });

    const q2 = await Question.create({
      subject: 'CS',
      topic: 'Computer Organization',
      type: 'NAT',
      content: 'Consider a direct mapped cache with 64 blocks and a block size of 16 bytes. To what block number does byte address 1200 map?',
      correctAnswer: 11,
      marks: 2,
      negativeMarks: 0,
      explanation: 'Block address = Math.floor(1200 / 16) = 75. Block number = 75 % 64 = 11.'
    });

    const q3 = await Question.create({
      subject: 'CS',
      topic: 'Algorithms',
      type: 'MSQ',
      content: 'Which of the following sorting algorithms are stable by default?',
      options: [
        { text: 'Merge Sort' },
        { text: 'Quick Sort' },
        { text: 'Insertion Sort' },
        { text: 'Heap Sort' }
      ],
      correctAnswer: ['Merge Sort', 'Insertion Sort'],
      marks: 2,
      negativeMarks: 0,
      explanation: 'Merge sort and Insertion sort maintain relative order of equal elements. Quick sort and Heap sort do not.'
    });

    const q4 = await Question.create({
      subject: 'CS',
      topic: 'Data Structures',
      type: 'MCQ',
      content: 'What is the worst case time complexity of inserting an element into a Binary Search Tree?',
      options: [
        { text: 'O(1)' },
        { text: 'O(log n)' },
        { text: 'O(n)' },
        { text: 'O(n log n)' }
      ],
      correctAnswer: 'O(n)',
      marks: 1,
      negativeMarks: 0.33,
      explanation: 'In a skewed BST (like a linked list), you must traverse all n nodes.'
    });

    const q5 = await Question.create({
      subject: 'CS',
      topic: 'Theory of Computation',
      type: 'MSQ',
      content: 'Which of the following languages are regular?',
      options: [
        { text: 'L = {a^n b^n | n >= 0}' },
        { text: 'L = {w | w has equal number of a\'s and b\'s}' },
        { text: 'L = {a^m b^n | m, n >= 0}' },
        { text: 'Finite languages' }
      ],
      correctAnswer: ['L = {a^m b^n | m, n >= 0}', 'Finite languages'],
      marks: 2,
      negativeMarks: 0,
      explanation: 'Regular languages cannot count arbitrarily. L = a*b* is regular. All finite languages are regular.'
    });

    // 3. Create a mock test
    await MockTest.create({
      title: 'GATE CS 2026 Mini Mock Test',
      description: 'A short 5-question mock test to evaluate core CS concepts.',
      subject: 'CS',
      type: 'Full Mock',
      duration: 15,
      totalMarks: 8,
      questions: [
        { question: q1._id, order: 1 },
        { question: q2._id, order: 2 },
        { question: q3._id, order: 3 },
        { question: q4._id, order: 4 },
        { question: q5._id, order: 5 }
      ]
    });

    console.log('In-memory database seeded successfully!');
  } catch (err) {
    console.error('Error seeding DB:', err);
  }
};

module.exports = seedDatabase;
