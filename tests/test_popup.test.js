// tests/test_popup.test.js
const test = require('node:test');
const assert = require('node:assert');
const {
  dateDiffInDays,
  makeClampedDate,
  isValidISIN,
  parseFIGITicker,
  lookupISIN,
  getCouponDates,
  countRemainingCoupons,
  calculateBondMetrics,
  ISIN_REFERENCE_DB
} = require('../js/popup.js');

test('dateDiffInDays calculates exact day difference', () => {
  const d1 = new Date('2025-01-01T00:00:00Z');
  const d2 = new Date('2025-01-10T00:00:00Z');
  assert.strictEqual(dateDiffInDays(d1, d2), 9);
});

test('makeClampedDate clamps invalid leap days properly', () => {
  const clamped = makeClampedDate(2023, 1, 31);
  assert.strictEqual(clamped.getFullYear(), 2023);
  assert.strictEqual(clamped.getMonth(), 1);
  assert.strictEqual(clamped.getDate(), 28);
});

test('isValidISIN validates ISO 6166 checksums accurately', () => {
  assert.strictEqual(isValidISIN('DE0001102580'), true);
  assert.strictEqual(isValidISIN('US9128286T00'), true);
  assert.strictEqual(isValidISIN('DE000BU2D004'), true);
  assert.strictEqual(isValidISIN('DE0001135275'), true);
  assert.strictEqual(isValidISIN('XS2200244072'), true);
  assert.strictEqual(isValidISIN('IT0001086567'), true);

  assert.strictEqual(isValidISIN('INVALID12345'), false);
  assert.strictEqual(isValidISIN('DE0001102581'), false);
  assert.strictEqual(isValidISIN('123'), false);
  assert.strictEqual(isValidISIN(null), false);
});

test('parseFIGITicker parses coupons and maturity dates from tickers', () => {
  const dbr = parseFIGITicker('DBR 4 01/04/37', '');
  assert.strictEqual(dbr.couponRate, 4);
  assert.strictEqual(dbr.maturityDate, '2037-01-04');

  const arg = parseFIGITicker('ARGENT 0.5 07/09/29', '');
  assert.strictEqual(arg.couponRate, 0.5);
  assert.strictEqual(arg.maturityDate, '2029-07-09');

  const btp = parseFIGITicker('BTPS 7.25 11/01/26 30Y', '');
  assert.strictEqual(btp.couponRate, 7.25);
  assert.strictEqual(btp.maturityDate, '2026-11-01');

  const frac = parseFIGITicker('T 4 1/4 02/15/34', '');
  assert.strictEqual(frac.couponRate, 4.25);
  assert.strictEqual(frac.maturityDate, '2034-02-15');
});

test('lookupISIN resolves benchmark securities from database', async () => {
  const bund = await lookupISIN('DE0001102580');
  assert.strictEqual(bund.isin, 'DE0001102580');
  assert.strictEqual(bund.couponRate, 2.50);
  assert.strictEqual(bund.maturityDate, '2035-02-15');

  const treasury = await lookupISIN('US9128286T00');
  assert.strictEqual(treasury.isin, 'US9128286T00');
  assert.strictEqual(treasury.frequency, 2);
});

test('lookupISIN resolves user test ISIN DE0001135275 (German Bund 4% 2037)', async () => {
  const bond = await lookupISIN('DE0001135275');
  assert.strictEqual(bond.isin, 'DE0001135275');
  assert.strictEqual(bond.couponRate, 4.00);
  assert.strictEqual(bond.maturityDate, '2037-01-04');
  assert.strictEqual(bond.cleanPrice, 104.72);
  assert.strictEqual(bond.frequency, 1);
  assert.strictEqual(bond.autoSet, true);
  assert.ok(bond.fieldsSet.includes('cleanPrice'));
  assert.ok(bond.fieldsSet.includes('couponRate'));
});

test('lookupISIN resolves user test ISIN XS2200244072 (Argentina 0.5% 2029)', async () => {
  const bond = await lookupISIN('XS2200244072');
  assert.strictEqual(bond.isin, 'XS2200244072');
  assert.strictEqual(bond.couponRate, 0.50);
  assert.strictEqual(bond.maturityDate, '2029-07-09');
  assert.strictEqual(bond.cleanPrice, 86.45);
  assert.strictEqual(bond.frequency, 2);
  assert.strictEqual(bond.autoSet, true);
});

test('lookupISIN resolves user test ISIN IT0001086567 (Italy BTP 7.25% 2026)', async () => {
  const bond = await lookupISIN('IT0001086567');
  assert.strictEqual(bond.isin, 'IT0001086567');
  assert.strictEqual(bond.couponRate, 7.25);
  assert.strictEqual(bond.maturityDate, '2026-11-01');
  assert.strictEqual(bond.cleanPrice, 99.71);
  assert.strictEqual(bond.frequency, 2);
  assert.strictEqual(bond.autoSet, true);
});

test('lookupISIN throws error on invalid ISIN checksum', async () => {
  await assert.rejects(async () => {
    await lookupISIN('INVALID12345');
  }, /Invalid ISIN code/);
});

test('getCouponDates identifies correct coupon boundaries (Annual)', () => {
  const settlement = new Date('2024-10-01T00:00:00Z');
  const maturity = new Date('2034-05-25T00:00:00Z');
  const [lastC, nextC] = getCouponDates(settlement, maturity, 1);

  assert.strictEqual(lastC.getFullYear(), 2024);
  assert.strictEqual(lastC.getMonth(), 4);
  assert.strictEqual(lastC.getDate(), 25);

  assert.strictEqual(nextC.getFullYear(), 2025);
  assert.strictEqual(nextC.getMonth(), 4);
  assert.strictEqual(nextC.getDate(), 25);
});

test('getCouponDates identifies correct coupon boundaries (Semi-Annual)', () => {
  const settlement = new Date('2024-10-01T00:00:00Z');
  const maturity = new Date('2034-05-25T00:00:00Z');
  const [lastC, nextC] = getCouponDates(settlement, maturity, 2);

  assert.strictEqual(lastC.getFullYear(), 2024);
  assert.strictEqual(lastC.getMonth(), 4);
  assert.strictEqual(lastC.getDate(), 25);

  assert.strictEqual(nextC.getFullYear(), 2024);
  assert.strictEqual(nextC.getMonth(), 10);
  assert.strictEqual(nextC.getDate(), 25);
});

test('countRemainingCoupons counts correct remaining payments', () => {
  const nextC = new Date('2024-11-25T00:00:00Z');
  const maturity = new Date('2034-05-25T00:00:00Z');
  const count = countRemainingCoupons(nextC, maturity, 2);
  assert.strictEqual(count, 20);
});

test('calculateBondMetrics Par Bond (100% price, 4% coupon -> 4% YTM on coupon date)', () => {
  const settlement = new Date('2026-05-25T00:00:00Z');
  const maturity = new Date('2036-05-25T00:00:00Z');
  const res = calculateBondMetrics(100.0, 100.0, 4.0, settlement, maturity, 1);

  assert.ok(Math.abs(res.accruedInterest) < 1e-5);
  assert.ok(Math.abs(res.dirtyPrice - 100.0) < 1e-5);
  assert.ok(Math.abs(res.ytm - 4.0) < 1e-3);
});

test('calculateBondMetrics Discount Bond (Clean Price 73.39%)', () => {
  const settlement = new Date('2024-10-01T00:00:00Z');
  const maturity = new Date('2034-05-25T00:00:00Z');
  const res = calculateBondMetrics(100.0, 73.39, 1.25, settlement, maturity, 1);

  assert.ok(res.accruedInterest > 0.4 && res.accruedInterest < 0.5);
  assert.ok(res.dirtyPrice > 73.8 && res.dirtyPrice < 73.9);
  assert.ok(res.ytm > 4.5 && res.ytm < 5.5);
});
