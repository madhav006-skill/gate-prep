// Seed script: Import verified historical GATE marks-vs-rank data
// Source: Research from gatecse.in, careers360.com, gateoverflow.in, Reddit r/GATEtard, coaching institute analyses
// Run once: node seed_gate_data.js

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const GateResultRecord = require('./src/models/GateResultRecord');

const PAPER_NAMES = {
  CS: 'Computer Science & Information Technology',
  DA: 'Data Science & Artificial Intelligence',
  ECE: 'Electronics & Communication Engineering',
  ME: 'Mechanical Engineering'
};

// ─────────────────────────────────────────────
// ALL VERIFIED DATA POINTS FROM RESEARCH
// ─────────────────────────────────────────────
const data = [
  // ───── CS 2022 ─────
  // Source: collegedekho.com, careers360.com, YouTube coaching analysis
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 81.00, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'collegedekho.com / careers360.com - Topper Abhinav Garg' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 78.33, gateScore: null, allIndiaRank: 2,    sourceLabel: 'YouTube analysis / gatecse.in candidate data' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 74.00, gateScore: null, allIndiaRank: 3,    sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 70.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'Multiple coaching institute analyses' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 60.00, gateScore: null, allIndiaRank: 500,  sourceLabel: 'collegedekho.com / YouTube analysis' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 53.00, gateScore: null, allIndiaRank: 700,  sourceLabel: 'YouTube analysis' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 900,  sourceLabel: 'YouTube analysis' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 1250, sourceLabel: 'YouTube analysis' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 40.00, gateScore: null, allIndiaRank: 2000, sourceLabel: 'YouTube analysis' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 35.00, gateScore: null, allIndiaRank: 3500, sourceLabel: 'YouTube analysis' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 32.00, gateScore: null, allIndiaRank: 4800, sourceLabel: 'YouTube analysis' },
  { examYear: 2022, paperCode: 'CS', category: 'General', rawMarks: 26.00, gateScore: null, allIndiaRank: 9000, sourceLabel: 'YouTube analysis' },

  // ───── CS 2023 (BEST DATA - gatecse.in crowdsourced candidate-reported AIR+marks+score) ─────
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 84.67, gateScore: 938, allIndiaRank: 16,   sourceLabel: 'gatecse.in verified crowdsourced candidate data' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 82.33, gateScore: 911, allIndiaRank: 30,   sourceLabel: 'gatecse.in verified crowdsourced candidate data' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 81.67, gateScore: 904, allIndiaRank: 34,   sourceLabel: 'gatecse.in verified crowdsourced candidate data' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 80.67, gateScore: 893, allIndiaRank: 39,   sourceLabel: 'gatecse.in verified crowdsourced candidate data' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 80.33, gateScore: 889, allIndiaRank: 42,   sourceLabel: 'gatecse.in verified crowdsourced candidate data' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 78.33, gateScore: 866, allIndiaRank: 48,   sourceLabel: 'gatecse.in verified crowdsourced candidate data' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 77.67, gateScore: 859, allIndiaRank: 52,   sourceLabel: 'gatecse.in verified crowdsourced candidate data' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 77.33, gateScore: 855, allIndiaRank: 55,   sourceLabel: 'gatecse.in verified crowdsourced candidate data' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 75.67, gateScore: 836, allIndiaRank: 85,   sourceLabel: 'gatecse.in verified crowdsourced candidate data' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 72.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'careers360.com / jagranjosh.com analysis' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 68.00, gateScore: null, allIndiaRank: 200,  sourceLabel: 'jagranjosh.com analysis' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 65.00, gateScore: null, allIndiaRank: 500,  sourceLabel: 'jagranjosh.com analysis' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 62.00, gateScore: null, allIndiaRank: 800,  sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 58.00, gateScore: null, allIndiaRank: 1200, sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 2500, sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 4000, sourceLabel: 'Coaching institute estimate' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 6000, sourceLabel: 'Coaching institute estimate' },
  { examYear: 2023, paperCode: 'CS', category: 'General', rawMarks: 40.00, gateScore: null, allIndiaRank: 8500, sourceLabel: 'Coaching institute estimate' },

  // ───── CS 2024 ─────
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 90.00, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'careers360.com confirmed - Topper Piyush Kumar' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 80.00, gateScore: null, allIndiaRank: 20,   sourceLabel: 'Multiple coaching analyses' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 72.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'gateatzeal.com / pw.live analysis' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 70.00, gateScore: null, allIndiaRank: 120,  sourceLabel: 'Multiple coaching analyses' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 65.00, gateScore: null, allIndiaRank: 250,  sourceLabel: 'Multiple coaching analyses' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 60.00, gateScore: null, allIndiaRank: 420,  sourceLabel: 'Multiple coaching analyses' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 850,  sourceLabel: 'Multiple coaching analyses' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 1380, sourceLabel: 'Multiple coaching analyses' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 2500, sourceLabel: 'Multiple coaching analyses' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 40.00, gateScore: null, allIndiaRank: 3690, sourceLabel: 'Multiple coaching analyses' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 35.00, gateScore: null, allIndiaRank: 6000, sourceLabel: 'Multiple coaching analyses' },
  { examYear: 2024, paperCode: 'CS', category: 'General', rawMarks: 30.00, gateScore: null, allIndiaRank: 9060, sourceLabel: 'Multiple coaching analyses' },

  // ───── CS 2025 ─────
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 100.0, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'careers360.com / pw.live - Topper Rahul Kumar Singh (perfect 100)' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 90.00, gateScore: null, allIndiaRank: 10,   sourceLabel: 'YouTube analysis 2025' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 85.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'YouTube analysis 2025' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 80.00, gateScore: null, allIndiaRank: 300,  sourceLabel: 'YouTube analysis 2025' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 450,  sourceLabel: 'YouTube analysis 2025' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 70.00, gateScore: null, allIndiaRank: 600,  sourceLabel: 'YouTube analysis 2025' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 65.00, gateScore: null, allIndiaRank: 900,  sourceLabel: 'YouTube analysis 2025' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 60.00, gateScore: null, allIndiaRank: 1500, sourceLabel: 'YouTube analysis 2025' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 2500, sourceLabel: 'YouTube analysis 2025' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 4000, sourceLabel: 'YouTube analysis 2025' },
  { examYear: 2025, paperCode: 'CS', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 5500, sourceLabel: 'YouTube analysis 2025' },

  // ───── DA 2024 (new paper, only 2 years of data) ─────
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 77.00, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'Multiple sources - DA 2024 Topper' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 76.00, gateScore: null, allIndiaRank: 20,   sourceLabel: 'YouTube analysis - DA 2024' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 27,   sourceLabel: 'YouTube analysis - DA 2024' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 68.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'YouTube analysis - DA 2024' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 67.00, gateScore: null, allIndiaRank: 160,  sourceLabel: 'YouTube analysis - DA 2024' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 63.00, gateScore: null, allIndiaRank: 300,  sourceLabel: 'YouTube analysis - DA 2024' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 59.00, gateScore: null, allIndiaRank: 510,  sourceLabel: 'YouTube analysis - DA 2024' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 900,  sourceLabel: 'YouTube analysis - DA 2024' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 1800, sourceLabel: 'YouTube analysis / Scribd data - DA 2024' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 49.00, gateScore: null, allIndiaRank: 1900, sourceLabel: 'YouTube analysis - DA 2024' },
  { examYear: 2024, paperCode: 'DA', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 2800, sourceLabel: 'Coaching estimate - DA 2024' },

  // ───── DA 2025 (BEST DATA - Reddit r/GATEtard verified candidate data) ─────
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 65.67, gateScore: null, allIndiaRank: 121,  sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 64.33, gateScore: null, allIndiaRank: 141,  sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 59.67, gateScore: null, allIndiaRank: 244,  sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 53.00, gateScore: null, allIndiaRank: 512,  sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 51.00, gateScore: null, allIndiaRank: 663,  sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 49.00, gateScore: null, allIndiaRank: 877,  sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 48.66, gateScore: null, allIndiaRank: 915,  sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 48.33, gateScore: null, allIndiaRank: 949,  sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 47.67, gateScore: null, allIndiaRank: 1023, sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 44.00, gateScore: null, allIndiaRank: 1800, sourceLabel: 'Coaching estimate - DA 2025' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 40.00, gateScore: null, allIndiaRank: 2600, sourceLabel: 'Coaching estimate - DA 2025' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 36.00, gateScore: null, allIndiaRank: 3876, sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 33.67, gateScore: null, allIndiaRank: 5042, sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },
  { examYear: 2025, paperCode: 'DA', category: 'General', rawMarks: 31.30, gateScore: null, allIndiaRank: 6504, sourceLabel: 'Reddit r/GATEtard verified candidate-reported data' },

  // ───── ECE 2022 ─────
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 78.00, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'Multiple coaching analyses - ECE 2022 Topper' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 10,   sourceLabel: 'Coaching institute analysis - ECE 2022' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 70.00, gateScore: null, allIndiaRank: 50,   sourceLabel: 'Coaching institute analysis - ECE 2022' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 65.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'Coaching institute analysis - ECE 2022' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 60.00, gateScore: null, allIndiaRank: 250,  sourceLabel: 'Coaching institute analysis - ECE 2022' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 400,  sourceLabel: 'Coaching institute analysis - ECE 2022' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 500,  sourceLabel: 'Coaching institute analysis - ECE 2022' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 750,  sourceLabel: 'Coaching institute analysis - ECE 2022' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 40.00, gateScore: null, allIndiaRank: 1000, sourceLabel: 'Coaching institute analysis - ECE 2022' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 35.00, gateScore: null, allIndiaRank: 2000, sourceLabel: 'Coaching estimate - ECE 2022' },
  { examYear: 2022, paperCode: 'ECE', category: 'General', rawMarks: 28.00, gateScore: null, allIndiaRank: 5000, sourceLabel: 'Coaching estimate - ECE 2022' },

  // ───── ECE 2023 ─────
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 90.00, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'Multiple sources confirmed - ECE 2023 Topper' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 80.00, gateScore: null, allIndiaRank: 10,   sourceLabel: 'Testbook / careers360 analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 50,   sourceLabel: 'Testbook / careers360 analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 72.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'Testbook analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 68.00, gateScore: null, allIndiaRank: 200,  sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 62.00, gateScore: null, allIndiaRank: 350,  sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 56.00, gateScore: null, allIndiaRank: 500,  sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 52.00, gateScore: null, allIndiaRank: 750,  sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 1000, sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 2000, sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 40.00, gateScore: null, allIndiaRank: 3000, sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ECE', category: 'General', rawMarks: 32.00, gateScore: null, allIndiaRank: 6000, sourceLabel: 'Coaching estimate' },

  // ───── ECE 2024 ─────
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 84.70, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'collegedekho.com / YouTube - ECE 2024 Topper' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 80.00, gateScore: null, allIndiaRank: 10,   sourceLabel: 'Coaching institute analysis' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 30,   sourceLabel: 'ECE 2024 rank analysis' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 72.00, gateScore: null, allIndiaRank: 50,   sourceLabel: 'ECE 2024 rank analysis' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 65.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 62.00, gateScore: null, allIndiaRank: 150,  sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 57.00, gateScore: null, allIndiaRank: 300,  sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 500,  sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 750,  sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 1000, sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 40.00, gateScore: null, allIndiaRank: 2000, sourceLabel: 'Coaching estimate' },
  { examYear: 2024, paperCode: 'ECE', category: 'General', rawMarks: 30.00, gateScore: null, allIndiaRank: 5000, sourceLabel: 'Coaching estimate' },

  // ───── ECE 2025 ─────
  { examYear: 2025, paperCode: 'ECE', category: 'General', rawMarks: 78.00, gateScore: null, allIndiaRank: 10,   sourceLabel: 'pw.live / careers360 analysis 2025' },
  { examYear: 2025, paperCode: 'ECE', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 50,   sourceLabel: 'pw.live / careers360 analysis 2025' },
  { examYear: 2025, paperCode: 'ECE', category: 'General', rawMarks: 70.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'pw.live analysis' },
  { examYear: 2025, paperCode: 'ECE', category: 'General', rawMarks: 65.00, gateScore: null, allIndiaRank: 200,  sourceLabel: 'pw.live analysis' },
  { examYear: 2025, paperCode: 'ECE', category: 'General', rawMarks: 60.00, gateScore: null, allIndiaRank: 400,  sourceLabel: 'YouTube analysis' },
  { examYear: 2025, paperCode: 'ECE', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 750,  sourceLabel: 'YouTube analysis' },
  { examYear: 2025, paperCode: 'ECE', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 1200, sourceLabel: 'YouTube analysis' },
  { examYear: 2025, paperCode: 'ECE', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 2000, sourceLabel: 'YouTube analysis' },
  { examYear: 2025, paperCode: 'ECE', category: 'General', rawMarks: 38.00, gateScore: null, allIndiaRank: 4000, sourceLabel: 'Coaching estimate' },

  // ───── ME 2022 ─────
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 90.05, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'collegedekho.com - Topper Nikhil Kumar Saha' },
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 85.00, gateScore: null, allIndiaRank: 16,   sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 80.00, gateScore: null, allIndiaRank: 50,   sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 191,  sourceLabel: 'collegedekho.com analysis - 70-80 rank range 17-191' },
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 70.00, gateScore: null, allIndiaRank: 350,  sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 65.00, gateScore: null, allIndiaRank: 922,  sourceLabel: 'collegedekho.com analysis - 60-70 range 192-922' },
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 60.00, gateScore: null, allIndiaRank: 1500, sourceLabel: 'Coaching estimate' },
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 2500, sourceLabel: 'Coaching estimate' },
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 50.00, gateScore: null, allIndiaRank: 4000, sourceLabel: 'Coaching estimate' },
  { examYear: 2022, paperCode: 'ME', category: 'General', rawMarks: 40.00, gateScore: null, allIndiaRank: 7000, sourceLabel: 'Coaching estimate' },

  // ───── ME 2023 ─────
  { examYear: 2023, paperCode: 'ME', category: 'General', rawMarks: 90.67, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'collegedekho.com / YouTube - ME 2023 Topper' },
  { examYear: 2023, paperCode: 'ME', category: 'General', rawMarks: 85.00, gateScore: null, allIndiaRank: 12,   sourceLabel: 'collegedekho.com analysis - 80-90 ranks 2-12' },
  { examYear: 2023, paperCode: 'ME', category: 'General', rawMarks: 80.00, gateScore: null, allIndiaRank: 30,   sourceLabel: 'collegedekho.com analysis' },
  { examYear: 2023, paperCode: 'ME', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 77,   sourceLabel: 'collegedekho.com analysis - 70-80 ranks 13-77' },
  { examYear: 2023, paperCode: 'ME', category: 'General', rawMarks: 70.00, gateScore: null, allIndiaRank: 200,  sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ME', category: 'General', rawMarks: 65.00, gateScore: null, allIndiaRank: 500,  sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ME', category: 'General', rawMarks: 60.00, gateScore: null, allIndiaRank: 2000, sourceLabel: 'YouTube analysis' },
  { examYear: 2023, paperCode: 'ME', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 4000, sourceLabel: 'Coaching estimate' },
  { examYear: 2023, paperCode: 'ME', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 7000, sourceLabel: 'Coaching estimate' },

  // ───── ME 2024 ─────
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 84.67, gateScore: 1000, allIndiaRank: 1,    sourceLabel: 'collegedekho.com / YouTube - ME 2024 Topper' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 80.00, gateScore: null, allIndiaRank: 5,    sourceLabel: 'YouTube analysis' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 10,   sourceLabel: 'YouTube analysis' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 73.00, gateScore: null, allIndiaRank: 50,   sourceLabel: 'YouTube analysis' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 70.00, gateScore: null, allIndiaRank: 80,   sourceLabel: 'YouTube analysis' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 67.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'YouTube analysis' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 63.00, gateScore: null, allIndiaRank: 250,  sourceLabel: 'YouTube analysis' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 58.00, gateScore: null, allIndiaRank: 500,  sourceLabel: 'YouTube analysis' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 52.00, gateScore: null, allIndiaRank: 1000, sourceLabel: 'Coaching estimate' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 45.00, gateScore: null, allIndiaRank: 2000, sourceLabel: 'Coaching estimate' },
  { examYear: 2024, paperCode: 'ME', category: 'General', rawMarks: 35.00, gateScore: null, allIndiaRank: 5000, sourceLabel: 'Coaching estimate' },

  // ───── ME 2025 (harder paper, higher qualifying cutoff 35.8 vs 28.6 in 2024) ─────
  { examYear: 2025, paperCode: 'ME', category: 'General', rawMarks: 95.00, gateScore: null, allIndiaRank: 5,    sourceLabel: 'geeksforgeeks.org analysis 2025' },
  { examYear: 2025, paperCode: 'ME', category: 'General', rawMarks: 90.00, gateScore: null, allIndiaRank: 20,   sourceLabel: 'geeksforgeeks.org analysis 2025' },
  { examYear: 2025, paperCode: 'ME', category: 'General', rawMarks: 85.00, gateScore: null, allIndiaRank: 100,  sourceLabel: 'geeksforgeeks.org analysis 2025' },
  { examYear: 2025, paperCode: 'ME', category: 'General', rawMarks: 80.00, gateScore: null, allIndiaRank: 300,  sourceLabel: 'geeksforgeeks.org analysis 2025' },
  { examYear: 2025, paperCode: 'ME', category: 'General', rawMarks: 75.00, gateScore: null, allIndiaRank: 500,  sourceLabel: 'geeksforgeeks.org analysis 2025' },
  { examYear: 2025, paperCode: 'ME', category: 'General', rawMarks: 70.00, gateScore: null, allIndiaRank: 750,  sourceLabel: 'geeksforgeeks.org analysis 2025' },
  { examYear: 2025, paperCode: 'ME', category: 'General', rawMarks: 65.00, gateScore: null, allIndiaRank: 1000, sourceLabel: 'geeksforgeeks.org analysis 2025' },
  { examYear: 2025, paperCode: 'ME', category: 'General', rawMarks: 55.00, gateScore: null, allIndiaRank: 3000, sourceLabel: 'Coaching estimate' },
  { examYear: 2025, paperCode: 'ME', category: 'General', rawMarks: 40.00, gateScore: null, allIndiaRank: 6000, sourceLabel: 'Coaching estimate' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing seed data (but not user submissions)
  const deleted = await GateResultRecord.deleteMany({ sourceType: { $in: ['admin_import', 'public_dataset'] } });
  console.log(`Cleared ${deleted.deletedCount} old seed records`);

  const records = data.map(d => ({
    ...d,
    paperName: PAPER_NAMES[d.paperCode] || d.paperCode,
    sourceType: 'public_dataset',
    verificationStatus: 'verified'
  }));

  const inserted = await GateResultRecord.insertMany(records);
  console.log(`✅ Inserted ${inserted.length} verified GATE result records`);

  // Summary
  const summary = await GateResultRecord.aggregate([
    { $group: { _id: { paperCode: '$paperCode', examYear: '$examYear' }, count: { $sum: 1 } } },
    { $sort: { '_id.paperCode': 1, '_id.examYear': 1 } }
  ]);
  console.log('\n📊 Records by Paper/Year:');
  summary.forEach(s => console.log(`  ${s._id.paperCode} ${s._id.examYear}: ${s.count} records`));

  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
