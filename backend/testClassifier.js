require('dotenv').config({ path: '.env' });
const { classifyQuestions } = require('./src/utils/aiClassifier');

async function testClassifier() {
  const dummyQuestions = [
    { questionHtml: "<p>Consider a system with 3 processes sharing 4 resource units. What is the minimum number of units each process can request such that deadlock is guaranteed to occur?</p>" },
    { questionHtml: "<p>A relation R(A, B, C, D) has functional dependencies A->B, B->C. What normal form is this relation in?</p>" },
    { questionHtml: "<p>Which of the following sorting algorithms has the lowest worst-case time complexity?</p>" }
  ];

  console.log('Testing AI Classifier...');
  const results = await classifyQuestions(dummyQuestions, 'CS');
  console.log(JSON.stringify(results, null, 2));
}

testClassifier();
