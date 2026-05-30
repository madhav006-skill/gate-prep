const GateResultRecord = require('../models/GateResultRecord');

const PAPER_NAMES = {
  CS: 'Computer Science & Information Technology',
  DA: 'Data Science & Artificial Intelligence',
  ECE: 'Electronics & Communication Engineering',
  ME: 'Mechanical Engineering',
  EE: 'Electrical Engineering',
  CE: 'Civil Engineering',
  IN: 'Instrumentation Engineering',
  CH: 'Chemical Engineering',
  BT: 'Biotechnology',
  MN: 'Mining Engineering'
};

// ─────────────────────────────────────────────
// PREDICTION LOGIC
// ─────────────────────────────────────────────

function interpolateRank(lowerPoint, upperPoint, targetMarks) {
  // lowerPoint = { rawMarks, allIndiaRank } where rawMarks < targetMarks
  // upperPoint = { rawMarks, allIndiaRank } where rawMarks > targetMarks
  // Linear interpolation: higher marks = lower rank number
  const marksDiff = upperPoint.rawMarks - lowerPoint.rawMarks;
  if (marksDiff === 0) return lowerPoint.allIndiaRank;
  const ratio = (targetMarks - lowerPoint.rawMarks) / marksDiff;
  // Rank decreases as marks increase
  const interpolated = lowerPoint.allIndiaRank - ratio * (lowerPoint.allIndiaRank - upperPoint.allIndiaRank);
  return Math.round(interpolated);
}

function getConfidence(recordCount, nearbyCount, usingOverall) {
  if (recordCount >= 100 && nearbyCount >= 3 && !usingOverall) return 'High';
  if (recordCount >= 50 && nearbyCount >= 2) return 'Medium';
  if (recordCount >= 20) return 'Low';
  return null; // insufficient
}

function estimateRankRange(records, targetMarks) {
  // Sort descending by marks
  const sorted = [...records].sort((a, b) => b.rawMarks - a.rawMarks);

  const maxMarks = sorted[0].rawMarks;
  const minMarks = sorted[sorted.length - 1].rawMarks;

  // Out of range - above all data
  if (targetMarks > maxMarks) {
    return {
      outOfRange: 'above',
      boundedEstimate: sorted[0].allIndiaRank,
      message: `Your marks (${targetMarks}) are above the highest verified record (${maxMarks} marks → AIR ${sorted[0].allIndiaRank}). Estimated rank is likely better than AIR ${sorted[0].allIndiaRank}.`
    };
  }

  // Out of range - below all data
  if (targetMarks < minMarks) {
    return {
      outOfRange: 'below',
      message: `Your marks (${targetMarks}) are below the lowest verified record (${minMarks} marks → AIR ${sorted[sorted.length-1].allIndiaRank}). Rank estimate is not reliable for this range.`
    };
  }

  // Handle exact matches (average if multiple)
  const exactPoints = sorted.filter(r => r.rawMarks === targetMarks);
  if (exactPoints.length > 0) {
    const avgRank = exactPoints.reduce((sum, r) => sum + r.allIndiaRank, 0) / exactPoints.length;
    const buffer = Math.round(avgRank * 0.15);
    return {
      rankMin: Math.max(1, Math.round(avgRank - buffer)),
      rankMax: Math.round(avgRank + buffer),
      centralEstimate: avgRank,
      nearestPoints: [{ rawMarks: targetMarks, allIndiaRank: Math.round(avgRank) }],
      nearbyCount: exactPoints.length
    };
  }

  // Find nearest brackets
  let upperPoint = null; // closest record with marks > targetMarks
  let lowerPoint = null; // closest record with marks < targetMarks

  for (const r of sorted) {
    if (r.rawMarks > targetMarks && (!upperPoint || r.rawMarks < upperPoint.rawMarks)) {
      upperPoint = r;
    }
    if (r.rawMarks < targetMarks && (!lowerPoint || r.rawMarks > lowerPoint.rawMarks)) {
      lowerPoint = r;
    }
  }

  if (!upperPoint || !lowerPoint) {
    return { error: 'insufficient_bracket_data' };
  }

  const centralEstimate = interpolateRank(lowerPoint, upperPoint, targetMarks);
  // Apply ±15% buffer for range
  const buffer = Math.round(centralEstimate * 0.15);

  // Find all nearby records (within 10 marks)
  const nearbyRecords = records.filter(r => Math.abs(r.rawMarks - targetMarks) <= 10);

  return {
    rankMin: Math.max(1, Math.round(centralEstimate - buffer)),
    rankMax: Math.round(centralEstimate + buffer),
    centralEstimate,
    nearestPoints: [
      { rawMarks: upperPoint.rawMarks, allIndiaRank: upperPoint.allIndiaRank },
      { rawMarks: lowerPoint.rawMarks, allIndiaRank: lowerPoint.allIndiaRank }
    ],
    nearbyCount: nearbyRecords.length
  };
}

function estimateAveragedRank(records, targetMarks) {
  // Group records by year to avoid mixing different exam difficulties
  const byYear = {};
  records.forEach(r => {
    if (!byYear[r.examYear]) byYear[r.examYear] = [];
    byYear[r.examYear].push(r);
  });

  const validYears = Object.keys(byYear);
  const estimations = [];
  const outOfRangeAbove = [];
  const outOfRangeBelow = [];

  for (const year of validYears) {
    const yearRecords = byYear[year];
    if (yearRecords.length >= 2) { // Need at least 2 points
      const est = estimateRankRange(yearRecords, targetMarks);
      if (!est.error) {
        if (est.outOfRange === 'above') outOfRangeAbove.push(est);
        else if (est.outOfRange === 'below') outOfRangeBelow.push(est);
        else estimations.push(est);
      }
    }
  }

  if (estimations.length === 0) {
    if (outOfRangeAbove.length > 0) {
      const avgBounded = outOfRangeAbove.reduce((s, e) => s + e.boundedEstimate, 0) / outOfRangeAbove.length;
      return { outOfRange: 'above', boundedEstimate: Math.round(avgBounded), message: `Your marks (${targetMarks}) are above the highest verified records for the selected years.` };
    }
    if (outOfRangeBelow.length > 0) {
      return { outOfRange: 'below', message: `Your marks (${targetMarks}) are below the lowest verified records for the selected years.` };
    }
    return { error: 'insufficient_bracket_data' };
  }

  // Average the central estimates from years that were successfully estimated
  const avgCentral = estimations.reduce((s, e) => s + e.centralEstimate, 0) / estimations.length;
  const buffer = Math.round(avgCentral * 0.15);
  
  const combinedNearbyCount = estimations.reduce((s, e) => s + e.nearbyCount, 0);
  const allNearest = estimations.flatMap(e => e.nearestPoints).sort((a,b) => Math.abs(a.rawMarks - targetMarks) - Math.abs(b.rawMarks - targetMarks));
  
  // Take top 2 unique nearest points
  const uniqueNearest = [];
  const seen = new Set();
  for (const p of allNearest) {
    const key = `${p.rawMarks}-${p.allIndiaRank}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNearest.push(p);
      if (uniqueNearest.length >= 2) break;
    }
  }

  return {
    rankMin: Math.max(1, Math.round(avgCentral - buffer)),
    rankMax: Math.round(avgCentral + buffer),
    centralEstimate: avgCentral,
    nearestPoints: uniqueNearest,
    nearbyCount: combinedNearbyCount
  };
}

// ─────────────────────────────────────────────
// ESTIMATE ENDPOINT
// ─────────────────────────────────────────────

// @desc    Estimate GATE rank
// @route   POST /api/rank-estimator/estimate
// @access  Private
exports.estimate = async (req, res, next) => {
  try {
    const { paperCode, examYears, category, expectedRawMarks } = req.body;

    if (!paperCode || !expectedRawMarks) {
      return res.status(400).json({ success: false, error: 'paperCode and expectedRawMarks are required.' });
    }

    const marks = parseFloat(expectedRawMarks);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      return res.status(400).json({ success: false, error: 'expectedRawMarks must be between 0 and 100.' });
    }

    const years = Array.isArray(examYears) ? examYears : [examYears].filter(Boolean);

    // Build query
    const query = {
      paperCode: paperCode.toUpperCase(),
      verificationStatus: 'verified'
    };
    if (years.length > 0) query.examYear = { $in: years.map(Number) };

    // Try category-specific first
    let usingOverall = false;
    let categoryNote = null;
    let records = [];

    if (category && category !== 'All') {
      query.category = category;
      records = await GateResultRecord.find(query).lean();

      if (records.length < 20) {
        // Fallback to overall
        delete query.category;
        records = await GateResultRecord.find(query).lean();
        usingOverall = true;
        categoryNote = `Category-specific data is limited (< 20 records for ${category}). Using overall verified paper data.`;
      }
    } else {
      records = await GateResultRecord.find(query).lean();
    }

    // Minimum data check
    if (records.length < 20) {
      return res.status(200).json({
        success: true,
        estimable: false,
        reason: 'insufficient_data',
        message: `Insufficient verified data. At least 20 verified records are required. Currently only ${records.length} verified records available for this selection.`,
        dataInfo: {
          recordCount: records.length,
          paperCode: paperCode.toUpperCase(),
          years: years,
          category: category || 'All'
        }
      });
    }

    // Do estimation
    const estimation = estimateAveragedRank(records, marks);

    if (estimation.error) {
      return res.status(200).json({
        success: true,
        estimable: false,
        reason: 'bracket_error',
        message: 'Could not find sufficient nearby data points for interpolation.'
      });
    }

    if (estimation.outOfRange) {
      return res.status(200).json({
        success: true,
        estimable: true,
        outOfRange: estimation.outOfRange,
        message: estimation.message,
        boundedEstimate: estimation.boundedEstimate || null,
        dataInfo: {
          recordCount: records.length,
          paperCode: paperCode.toUpperCase(),
          years: years,
          category: usingOverall ? 'All (fallback)' : (category || 'All'),
          categoryNote
        }
      });
    }

    // Calculate confidence
    const confidence = getConfidence(records.length, estimation.nearbyCount, usingOverall);

    const scoreRecords = records.filter(r => r.gateScore != null);
    let estimatedScoreRange = null;
    if (scoreRecords.length >= 5) {
      const scoreEst = estimateAveragedRank(scoreRecords.map(r => ({ ...r, allIndiaRank: r.gateScore })), marks);
      if (!scoreEst.error && !scoreEst.outOfRange) {
        estimatedScoreRange = { min: scoreEst.rankMin, max: scoreEst.rankMax };
      }
    }

    // Data years actually used
    const yearsUsed = [...new Set(records.map(r => r.examYear))].sort();
    const lastUpdated = records.reduce((latest, r) => {
      const d = new Date(r.updatedAt);
      return d > latest ? d : latest;
    }, new Date(0));

    return res.status(200).json({
      success: true,
      estimable: true,
      result: {
        rankMin: estimation.rankMin,
        rankMax: estimation.rankMax,
        estimatedScoreRange,
        confidence,
        nearestPoints: estimation.nearestPoints,
        explanation: buildExplanation(marks, estimation, records.length, confidence, usingOverall, categoryNote, paperCode, yearsUsed)
      },
      dataInfo: {
        recordCount: records.length,
        paperCode: paperCode.toUpperCase(),
        paperName: PAPER_NAMES[paperCode.toUpperCase()] || paperCode,
        years: years,
        yearsUsed,
        category: usingOverall ? 'All (fallback)' : (category || 'All'),
        categoryNote,
        lastUpdated
      },
      disclaimer: 'This is not a guaranteed rank. It is a historical-data-based estimate using verified records only. Real GATE rank depends on that year\'s difficulty and candidate distribution.'
    });

  } catch (error) {
    next(error);
  }
};

function buildExplanation(marks, estimation, recordCount, confidence, usingOverall, categoryNote, paperCode, yearsUsed) {
  let text = `This estimate is based on verified ${paperCode.toUpperCase()} records near ${marks} marks. `;

  if (estimation.nearestPoints && estimation.nearestPoints.length >= 2) {
    const p1 = estimation.nearestPoints[0];
    const p2 = estimation.nearestPoints[1];
    text += `The closest verified records are ${p1.rawMarks} marks → AIR ${p1.allIndiaRank} and ${p2.rawMarks} marks → AIR ${p2.allIndiaRank}. `;
  }

  text += `Dataset has ${recordCount} verified records from years ${yearsUsed.join(', ')}. `;

  if (usingOverall && categoryNote) {
    text += categoryNote + ' ';
  }

  if (confidence === 'High') {
    text += 'Confidence is High because 100+ verified records exist and multiple nearby data points are available.';
  } else if (confidence === 'Medium') {
    text += 'Confidence is Medium because 50+ verified records exist within the selected parameters.';
  } else if (confidence === 'Low') {
    text += 'Confidence is Low due to limited verified records (20-49). Treat this as a rough estimate only.';
  }

  return text;
}

// ─────────────────────────────────────────────
// AVAILABILITY CHECK
// ─────────────────────────────────────────────

// @desc    Check data availability for a paper/year/category combo
// @route   GET /api/rank-estimator/availability
// @access  Private
exports.checkAvailability = async (req, res, next) => {
  try {
    const { paperCode, examYear, category } = req.query;

    const query = { verificationStatus: 'verified' };
    if (paperCode) query.paperCode = paperCode.toUpperCase();
    if (examYear) query.examYear = Number(examYear);
    if (category && category !== 'All') query.category = category;

    const count = await GateResultRecord.countDocuments(query);

    // Get breakdown by paper/year
    const breakdown = await GateResultRecord.aggregate([
      { $match: { verificationStatus: 'verified' } },
      { $group: { _id: { paperCode: '$paperCode', examYear: '$examYear', category: '$category' }, count: { $sum: 1 } } },
      { $sort: { '_id.paperCode': 1, '_id.examYear': -1 } }
    ]);

    res.status(200).json({
      success: true,
      count,
      estimable: count >= 20,
      breakdown
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// USER SUBMISSION
// ─────────────────────────────────────────────

// @desc    User submits their own GATE result
// @route   POST /api/rank-estimator/submit
// @access  Private
exports.submitUserResult = async (req, res, next) => {
  try {
    const { examYear, paperCode, category, rawMarks, gateScore, allIndiaRank, consentAnonymous } = req.body;

    if (!consentAnonymous) {
      return res.status(400).json({ success: false, error: 'Consent for anonymous use is required.' });
    }

    const record = await GateResultRecord.create({
      examYear,
      paperCode: paperCode.toUpperCase(),
      paperName: PAPER_NAMES[paperCode.toUpperCase()] || paperCode,
      category,
      rawMarks: parseFloat(rawMarks),
      gateScore: gateScore ? parseFloat(gateScore) : null,
      allIndiaRank: parseInt(allIndiaRank),
      sourceType: 'user_submission',
      sourceLabel: 'User-submitted result (anonymous)',
      verificationStatus: 'pending',
      submittedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Your result has been submitted. It will be used after admin verification.',
      data: { id: record._id }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// ADMIN: LIST RECORDS
// ─────────────────────────────────────────────

// @desc    Admin: get all records with filters
// @route   GET /api/rank-estimator/admin/records
// @access  Admin
exports.adminGetRecords = async (req, res, next) => {
  try {
    const { paperCode, examYear, category, status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (paperCode) query.paperCode = paperCode.toUpperCase();
    if (examYear) query.examYear = Number(examYear);
    if (category) query.category = category;
    if (status) query.verificationStatus = status;

    const total = await GateResultRecord.countDocuments(query);
    const records = await GateResultRecord.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Summary stats
    const stats = await GateResultRecord.aggregate([
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
    ]);
    const statMap = { pending: 0, verified: 0, rejected: 0 };
    stats.forEach(s => { statMap[s._id] = s.count; });

    const byPaper = await GateResultRecord.aggregate([
      { $group: { _id: '$paperCode', count: { $sum: 1 }, verified: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      total,
      stats: statMap,
      byPaper,
      records,
      pagination: { page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// ADMIN: ADD SINGLE RECORD
// ─────────────────────────────────────────────

// @desc    Admin: manually add a record
// @route   POST /api/rank-estimator/admin/record
// @access  Admin
exports.adminAddRecord = async (req, res, next) => {
  try {
    const { examYear, paperCode, category, rawMarks, gateScore, allIndiaRank, sourceType, sourceLabel, verificationStatus } = req.body;

    const record = await GateResultRecord.create({
      examYear,
      paperCode: paperCode.toUpperCase(),
      paperName: PAPER_NAMES[paperCode.toUpperCase()] || paperCode,
      category,
      rawMarks: parseFloat(rawMarks),
      gateScore: gateScore ? parseFloat(gateScore) : null,
      allIndiaRank: parseInt(allIndiaRank),
      sourceType: sourceType || 'admin_import',
      sourceLabel: sourceLabel || 'Admin import',
      verificationStatus: verificationStatus || 'verified',
      verifiedBy: verificationStatus === 'verified' ? req.user.id : null
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// ADMIN: BULK CSV IMPORT
// ─────────────────────────────────────────────

// @desc    Admin: bulk import records from CSV data
// @route   POST /api/rank-estimator/admin/import-csv
// @access  Admin
exports.adminImportCSV = async (req, res, next) => {
  try {
    const { csvData } = req.body; // CSV text sent as string

    if (!csvData) {
      return res.status(400).json({ success: false, error: 'csvData is required.' });
    }

    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const requiredHeaders = ['examyear', 'papercode', 'category', 'rawmarks', 'allindiarank'];
    for (const h of requiredHeaders) {
      if (!headers.includes(h)) {
        return res.status(400).json({ success: false, error: `Missing required CSV column: ${h}` });
      }
    }

    const records = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      try {
        const paperCode = (row.papercode || '').toUpperCase();
        records.push({
          examYear: parseInt(row.examyear),
          paperCode,
          paperName: PAPER_NAMES[paperCode] || paperCode,
          category: row.category || 'General',
          rawMarks: parseFloat(row.rawmarks),
          gateScore: row.gatescore ? parseFloat(row.gatescore) : null,
          allIndiaRank: parseInt(row.allindiarank),
          sourceType: row.sourcetype || 'admin_import',
          sourceLabel: row.sourcelabel || 'Bulk CSV import',
          verificationStatus: row.verificationstatus || 'verified',
          verifiedBy: req.user.id
        });
      } catch (err) {
        errors.push({ line: i + 1, error: err.message });
      }
    }

    if (records.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid records found in CSV.', errors });
    }

    const inserted = await GateResultRecord.insertMany(records, { ordered: false });

    res.status(200).json({
      success: true,
      message: `${inserted.length} records imported successfully.`,
      imported: inserted.length,
      errors
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// ADMIN: UPDATE/VERIFY/DELETE RECORD
// ─────────────────────────────────────────────

// @desc    Admin: verify, reject, or delete a record
// @route   PATCH /api/rank-estimator/admin/record/:id
// @access  Admin
exports.adminUpdateRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, adminNote, verificationStatus } = req.body;

    if (action === 'delete') {
      await GateResultRecord.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Record deleted.' });
    }

    const update = {};
    if (verificationStatus) {
      update.verificationStatus = verificationStatus;
      if (verificationStatus === 'verified') update.verifiedBy = req.user.id;
    }
    if (adminNote) update.adminNote = adminNote;

    const record = await GateResultRecord.findByIdAndUpdate(id, update, { new: true });

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};
