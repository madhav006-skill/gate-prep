const { GoogleGenAI, Type } = require('@google/genai');

/**
 * Classifies an array of questions into subjects and topics using Gemini.
 * @param {Array} questions Array of question objects containing questionHtml.
 * @param {string} globalSubject The overall subject of the test (e.g., 'CS').
 * @returns {Promise<Array>} Array of predicted { subject, topic } objects matching the indices of the input questions.
 */
async function classifyQuestions(questions, globalSubject, onProgress) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found. Skipping AI classification.');
    return questions.map(() => ({ subject: globalSubject, topic: 'General' }));
  }

  let currentApiKey = process.env.GEMINI_API_KEY;
  let ai = new GoogleGenAI({ apiKey: currentApiKey });
  let fallbackUsed = false;
  
  const CHUNK_SIZE = 15;
  let allClassifications = [];
  
  if (onProgress) onProgress(0, questions.length);

  for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
    const chunk = questions.slice(i, i + CHUNK_SIZE);
    
    // Prepare questions for the prompt
    const promptData = chunk.map((q, localIdx) => {
      const globalIdx = i + localIdx;
      const plainText = q.questionHtml ? q.questionHtml.replace(/<[^>]*>?/gm, ' ').substring(0, 1000) : '';
      return `Question ${globalIdx}:\n${plainText}\n`;
    }).join('\n---\n');

    const prompt = `You are an expert GATE examiner classifying questions.
Analyze each question and extract its specific Subject and granular Topic.

CRITICAL RULES:
1. NEVER return "${globalSubject}" (e.g., "CS") as the Subject!
2. You MUST choose the Subject ONLY from this exact list:
   Algorithms, Operating Systems, Computer Networks, Database Management Systems, Theory of Computation, Data Structures, Digital Logic, Compiler Design, Computer Organization, Engineering Mathematics, General Aptitude.
3. For the Topic, provide the exact granular concept being tested (e.g., "Threads", "Deadlock", "Normalization", "Subnetting"). Keep it concise (1-3 words).

Return a JSON array mapping to the provided Question indices.

Questions:
${promptData}
`;

    let retries = 5;
    let delay = 2000;
    let chunkClassifications = [];

    while (retries > 0) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  index: { type: Type.INTEGER, description: "The index of the question as provided" },
                  subject: { type: Type.STRING, description: "The classified subject" },
                  topic: { type: Type.STRING, description: "The granular topic" }
                },
                required: ["index", "subject", "topic"]
              }
            }
          }
        });
        
        const resultsText = typeof response.text === 'function' ? response.text() : (response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '[]');
        chunkClassifications = JSON.parse(resultsText);
        break; // Success, exit retry loop
      } catch (e) {
        if (e.status === 429 && !fallbackUsed && process.env.GEMINI_API_KEY_FALLBACK) {
          console.log(`[AI Classifier] API Quota Exceeded (429). Switching to fallback API key...`);
          currentApiKey = process.env.GEMINI_API_KEY_FALLBACK;
          ai = new GoogleGenAI({ apiKey: currentApiKey });
          fallbackUsed = true;
          continue; // Retry immediately with new key
        }
        
        if ((e.status === 503 || e.status === 429) && retries > 1) {
          console.log(`[AI Classifier] API rate limit/overload (${e.status}). Retrying in ${delay}ms... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          retries--;
        } else {
          console.error(`[AI Classifier] Chunk failed after retries:`, e);
          // Fallback for this chunk
          chunkClassifications = chunk.map((_, localIdx) => ({
             index: i + localIdx, subject: globalSubject, topic: 'General'
          }));
          break;
        }
      }
    }
    
    allClassifications = allClassifications.concat(chunkClassifications);
    if (onProgress) onProgress(allClassifications.length, questions.length);
  }

  // Sort by index just in case
  allClassifications.sort((a, b) => a.index - b.index);
  return allClassifications;
}


module.exports = {
  classifyQuestions
};
