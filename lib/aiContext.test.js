const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAiInvestmentContext } = require('./aiContext');

test('buildAiInvestmentContext includes portfolio and market news', () => {
  const context = buildAiInvestmentContext({
    assets: [
      { name: 'HDFC Bank', type: 'Stock', price: 1500, quantity: 10 },
      { name: 'Gold', type: 'Gold', price: 7000, quantity: 1 }
    ],
    marketNews: [
      { title: 'Nifty hits record high', source: 'Economic Times' },
      { title: 'Gold prices drop on strong dollar', source: 'MCX India' }
    ]
  });

  assert.match(context, /HDFC Bank/);
  assert.match(context, /Gold/);
  assert.match(context, /Nifty hits record high/);
  assert.match(context, /Long-term buy|Avoid|watchlist/i);
});
