function summarizePortfolio(assets = []) {
  if (!Array.isArray(assets) || !assets.length) {
    return 'You do not have any tracked assets yet. Ask me for a beginner-friendly allocation strategy from scratch.';
  }

  const totalValue = assets.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const byType = {};
  assets.forEach((asset) => {
    const type = asset.type || 'Other';
    byType[type] = (byType[type] || 0) + Number(asset.price || 0) * Number(asset.quantity || 0);
  });

  const typeSummary = Object.entries(byType)
    .map(([type, value]) => `${type}: ₹${Math.round(value).toLocaleString('en-IN')}`)
    .join(' | ');

  const holdings = assets.slice(0, 6).map((asset) => {
    const value = Number(asset.price || 0) * Number(asset.quantity || 0);
    return `${asset.name || 'Unnamed'} (${asset.type || 'Asset'}): ₹${Math.round(value).toLocaleString('en-IN')}`;
  });

  return [
    `Portfolio value: ₹${Math.round(totalValue).toLocaleString('en-IN')}`,
    `Asset mix: ${typeSummary}`,
    `Top holdings: ${holdings.join(' | ')}`,
  ].join('\n');
}

function summarizeMarketNews(marketNews = []) {
  const items = Array.isArray(marketNews) ? marketNews.slice(0, 5) : [];
  if (!items.length) {
    return 'No recent market news was available for context.';
  }

  return items.map((item, index) => {
    const title = item.title || 'Market update';
    const source = item.source ? ` (${item.source})` : '';
    const sentiment = item.entities?.[0]?.sentiment_score;
    const direction = typeof sentiment === 'number'
      ? sentiment >= 0.6 ? 'positive' : sentiment <= 0.35 ? 'cautious' : 'mixed'
      : 'mixed';
    return `${index + 1}. ${title}${source} — ${direction} sentiment.`;
  }).join('\n');
}

function buildAiInvestmentContext({ assets = [], marketNews = [] } = {}) {
  const portfolioSummary = summarizePortfolio(assets);
  const marketSummary = summarizeMarketNews(marketNews);

  return [
    'User portfolio context:',
    portfolioSummary,
    '',
    'Recent market news context:',
    marketSummary,
    '',
    'Investment guidance: Use this to tell the user which assets are good long-term buy candidates, what should be watched, and what to avoid or trim for long-term risk. Be specific: Long-term buy candidates should match strong fundamentals and positive recent news; avoid or limit crowded, weak, or high-volatility assets when the headlines are negative or the user is already overexposed. Use a concise list: Long-term buy candidates, Watchlist, Avoid / trim.',
  ].join('\n');
}

module.exports = { buildAiInvestmentContext, summarizePortfolio, summarizeMarketNews };
