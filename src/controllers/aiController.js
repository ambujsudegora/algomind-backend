const aiQuoteCache = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of aiQuoteCache.entries()) {
    if (now - value.timestamp > 24 * 60 * 60 * 1000) {
      aiQuoteCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

export const getAIDailyInsightQuote = async (req, res) => {
  try {
    const { context } = req.body;
    const user = req.user;

    const apiKey = process.env.GEMINI_API_KEY;
    const weakTopic = context?.weakTopic || 'General';
    const solvedToday = context?.solvedToday || 0;
    const currentStreak = context?.currentStreak || 0;
    const level = context?.level || 1;
    const todayStr = new Date().toISOString().slice(0, 10);

    const cacheKey = `${user._id}_${todayStr}_${weakTopic}`;
    if (aiQuoteCache.has(cacheKey)) {
      const cached = aiQuoteCache.get(cacheKey);
      return res.status(200).json({
        status: 'success',
        data: { quote: cached.quote, cached: true }
      });
    }

    if (!apiKey) {
      const fallbackQuote = `Focus on ${weakTopic} today, ${user.username}. Consistent revision builds lasting coding mastery!`;
      aiQuoteCache.set(cacheKey, { quote: fallbackQuote, timestamp: Date.now() });
      return res.status(200).json({
        status: 'success',
        data: { quote: fallbackQuote, cached: false }
      });
    }

    const prompt = `Short 1-sentence developer tip for ${user.username}: focus on ${weakTopic}. Level ${level}, streak ${currentStreak}d. Max 20 words. No quotes.`;

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
            maxOutputTokens: 45,
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const resData = await response.json();
    const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const quote = resultText.trim().replace(/^["']|["']$/g, '');
    aiQuoteCache.set(cacheKey, { quote, timestamp: Date.now() });

    res.status(200).json({
      status: 'success',
      data: { quote, cached: false }
    });
  } catch (error) {
    console.error('[Get AI Daily Insight Error]:', error);
    const fallbackQuote = `Focus on ${req.body.context?.weakTopic || 'General'} today, ${req.user.username}. Spaced repetition is key!`;
    res.status(200).json({
      status: 'success',
      data: { quote: fallbackQuote, cached: false }
    });
  }
};
