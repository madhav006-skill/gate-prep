require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Question = require('./src/models/Question');

const keywordMap = [
  { subject: 'Operating Systems', topic: 'Threads', keywords: ['thread', 'multithreading', 'user-level'] },
  { subject: 'Operating Systems', topic: 'Deadlock', keywords: ['deadlock', 'bankers algorithm', 'circular wait'] },
  { subject: 'Operating Systems', topic: 'Memory Management', keywords: ['paging', 'virtual memory', 'tlb', 'cache'] },
  { subject: 'Operating Systems', topic: 'Process Scheduling', keywords: ['process', 'scheduling', 'round robin', 'fcfs', 'sjf'] },
  { subject: 'Algorithms', topic: 'Dynamic Programming', keywords: ['dynamic programming', 'longest common subsequence', 'matrix chain'] },
  { subject: 'Algorithms', topic: 'Sorting', keywords: ['sort', 'quicksort', 'mergesort', 'heapsort'] },
  { subject: 'Algorithms', topic: 'Graph Algorithms', keywords: ['dijkstra', 'kruskal', 'prims', 'bfs', 'dfs', 'graph'] },
  { subject: 'Database Management Systems', topic: 'Normalization', keywords: ['normal form', 'bcnf', 'functional dependency'] },
  { subject: 'Database Management Systems', topic: 'SQL', keywords: ['sql', 'select', 'join', 'group by'] },
  { subject: 'Database Management Systems', topic: 'Transactions', keywords: ['transaction', 'acid', 'schedule', 'serializability'] },
  { subject: 'Computer Networks', topic: 'IP Addressing', keywords: ['ip address', 'subnet', 'cidr'] },
  { subject: 'Computer Networks', topic: 'TCP/UDP', keywords: ['tcp', 'udp', 'congestion', 'window size'] },
  { subject: 'Data Structures', topic: 'Trees', keywords: ['binary tree', 'avl', 'bst', 'height'] },
  { subject: 'Data Structures', topic: 'Arrays/Linked Lists', keywords: ['array', 'linked list', 'pointer'] },
  { subject: 'Theory of Computation', topic: 'Regular Languages', keywords: ['regular expression', 'dfa', 'nfa', 'finite automaton'] },
  { subject: 'Theory of Computation', topic: 'Context-Free Languages', keywords: ['context-free', 'cfg', 'pushdown automaton'] },
  { subject: 'Digital Logic', topic: 'Boolean Algebra', keywords: ['boolean', 'k-map', 'logic gate'] },
  { subject: 'Computer Organization', topic: 'Pipelining', keywords: ['pipeline', 'hazards', 'instruction cycle'] },
  { subject: 'Engineering Mathematics', topic: 'Probability', keywords: ['probability', 'random variable', 'distribution'] },
  { subject: 'Engineering Mathematics', topic: 'Linear Algebra', keywords: ['matrix', 'eigenvalue', 'determinant'] }
];

async function manualFallbackClassification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const questions = await Question.find({ subject: 'CS' });
    
    console.log(`Found ${questions.length} questions to manually classify.`);
    let updatedCount = 0;

    for (const q of questions) {
      const content = q.content ? q.content.toLowerCase() : '';
      let matched = false;

      for (const rule of keywordMap) {
        if (rule.keywords.some(kw => content.includes(kw))) {
          q.subject = rule.subject;
          q.topic = rule.topic;
          await q.save();
          matched = true;
          updatedCount++;
          break;
        }
      }
      
      // Fallback if no keywords matched
      if (!matched) {
        q.subject = 'General Computer Science';
        q.topic = 'Miscellaneous';
        await q.save();
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} questions using local keyword analysis.`);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

manualFallbackClassification();
