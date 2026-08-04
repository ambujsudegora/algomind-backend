


import crypto from 'crypto';

const aiReviewCache = new Map();
const MAX_CACHE_SIZE = 200;

const getCacheKey = (problemTitle, difficulty, topic, code) => {
  const normCode = (code || '').replace(/\s+/g, '');
  const str = `${problemTitle}_${difficulty}_${topic}_${normCode}`;
  return crypto.createHash('md5').update(str).digest('hex');
};

export const getAICodeReview = async (problemTitle, difficulty, category, code) => {
  const topic = category || 'General';
  const cacheKey = getCacheKey(problemTitle, difficulty, topic, code);

  if (aiReviewCache.has(cacheKey)) {
    console.log('[AI Service Cache] Returning cached AI review for:', problemTitle);
    return aiReviewCache.get(cacheKey);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[AI Service] GEMINI_API_KEY is not configured in .env. Generating structured mock review.');
    const mockRes = generateMockReview(problemTitle, difficulty, topic, code);
    aiReviewCache.set(cacheKey, mockRes);
    return mockRes;
  }

  const prompt = `You are a DSA code reviewer. 
Problem: ${problemTitle} | Topic: ${topic} | Difficulty: ${difficulty}
User's code: ${code}

Give honest feedback in 2-3 lines. Mention specific issues if any.
Then output topic tags as JSON: { "tags": [{ "topic": "${topic}", "strength": "strong" | "weak" }] }
Be direct. Do not flatter.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const resData = await response.json();
    const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    
    const parsed = JSON.parse(resultText.trim());
    
    
    let feedback = parsed.feedback;
    if (!feedback) {
      
      feedback = parsed.review || parsed.comments || resultText.substring(0, 150);
    }
    
    const tags = parsed.tags || [{ topic, strength: 'strong' }];

    const result = {
      feedback,
      tags
    };

    if (aiReviewCache.size >= MAX_CACHE_SIZE) {
      const firstKey = aiReviewCache.keys().next().value;
      aiReviewCache.delete(firstKey);
    }
    aiReviewCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('[AI Service Error]:', error.message);
    return generateMockReview(problemTitle, difficulty, topic, code);
  }
};


const generateMockReview = (problemTitle, difficulty, topic, code) => {
  const containsLoop = code.includes('for') || code.includes('while');
  const containsRecursion = code.includes(problemTitle.replace(/\s+/g, '')) || code.includes('helper') || code.includes('solve');
  
  let feedback = '';
  let strength = 'strong';

  if (difficulty === 'Hard') {
    feedback = `The code handles the base constraints. However, ensure edge cases (e.g. integer overflows, empty inputs) are thoroughly managed. Consider optimizing recursion stacks.`;
    strength = containsRecursion ? 'strong' : 'weak';
  } else if (difficulty === 'Medium') {
    feedback = `Good use of iteration loops to partition the search domain. Time complexity is optimal, but space constraints could be further reduced by pruning intermediate objects.`;
    strength = containsLoop ? 'strong' : 'weak';
  } else {
    feedback = `Clean, straightforward implementation. Time complexity is O(N) which is perfect for this category. Ready for revision scheduling.`;
    strength = 'strong';
  }

  return {
    feedback,
    tags: [
      {
        topic,
        strength
      }
    ]
  };
};


export const getAIPersonalizedQuote = async (username, streak, solvedToday, level) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return `Hey ${username}, keep pushing! Every revision brings you one step closer to coding mastery.`;
  }

  const prompt = `Generate a 1-line tech-focused motivational quote (no longer than 15 words) for a developer. 
User stats: Name: ${username} | Solved today: ${solvedToday} | Active streak: ${streak} days | Level: ${level}. 
Keep it direct, punchy, and related to algorithms, revision, or consistency. Do not wrap in quotes.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const resData = await response.json();
    const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    return resultText.trim().replace(/^["']|["']$/g, ''); // strip any outer quotes
  } catch (error) {
    console.error('[AI Service Motivation Quote Error]:', error.message);
    return `Hey ${username}, keep pushing! Every revision brings you one step closer to coding mastery.`;
  }
};
