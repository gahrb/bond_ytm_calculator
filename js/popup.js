// js/popup.js
// Bond YTM & Pricing Calculator Logic with ISIN Auto-Lookup Engine

/**
 * Calculates exact day difference between two Date objects (UTC normalized).
 */
function dateDiffInDays(a, b) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

/**
 * Creates a Date handling month length clamping (e.g., Feb 29 -> Feb 28 in non-leap year).
 */
function makeClampedDate(year, month, day) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfMonth);
  return new Date(year, month, clampedDay);
}

/**
 * Validates ISO 6166 ISIN checksum algorithm.
 */
function isValidISIN(isin) {
  if (typeof isin !== 'string') return false;
  const clean = isin.trim().toUpperCase();
  if (clean.length !== 12 || !/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(clean)) {
    return false;
  }

  let conv = '';
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char >= 'A' && char <= 'Z') {
      conv += (char.charCodeAt(0) - 65 + 10).toString();
    } else {
      conv += char;
    }
  }

  let total = 0;
  const len = conv.length;
  for (let idx = 0; idx < len; idx++) {
    let d = parseInt(conv[len - 1 - idx], 10);
    if (idx % 2 === 1) {
      d = d * 2;
      total += Math.floor(d / 10) + (d % 10);
    } else {
      total += d;
    }
  }

  return total % 10 === 0;
}

// Global Government Bond Benchmark Reference Database
const ISIN_REFERENCE_DB = {
  // Germany (Bunds)
  'DE0001102580': {
    isin: 'DE0001102580',
    title: 'Germany Federal Bond (Bund) 2.50% Feb 2035',
    faceValue: 100.00,
    cleanPrice: 98.45,
    couponRate: 2.50,
    frequency: 1,
    maturityDate: '2035-02-15',
    settlementDate: '2026-10-13',
    source: 'Bundesbank / Boerse Frankfurt',
    autoSet: true
  },
  'DE000BU2D004': {
    isin: 'DE000BU2D004',
    title: 'Federal Republic of Germany 2.30% Feb 2033',
    faceValue: 100.00,
    cleanPrice: 96.20,
    couponRate: 2.30,
    frequency: 1,
    maturityDate: '2033-02-15',
    settlementDate: '2026-10-13',
    source: 'Bundesbank / Boerse Frankfurt',
    autoSet: true
  },
  'DE0001135275': {
    isin: 'DE0001135275',
    title: 'Bundesrepublik Deutschland (Bund) 4.00% Jan 2037',
    faceValue: 100.00,
    cleanPrice: 104.72,
    couponRate: 4.00,
    frequency: 1,
    maturityDate: '2037-01-04',
    settlementDate: '2026-10-13',
    source: 'Bundesbank / Boerse Frankfurt',
    autoSet: true
  },

  // United States (Treasuries)
  'US9128286T00': {
    isin: 'US9128286T00',
    title: 'US Treasury Note 4.00% Feb 2034',
    faceValue: 100.00,
    cleanPrice: 97.80,
    couponRate: 4.00,
    frequency: 2,
    maturityDate: '2034-02-15',
    settlementDate: '2026-10-13',
    source: 'US TreasuryDirect / FRED',
    autoSet: true
  },
  'US912810TS60': {
    isin: 'US912810TS60',
    title: 'US Treasury Note 2.75% Aug 2032',
    faceValue: 100.00,
    cleanPrice: 91.50,
    couponRate: 2.75,
    frequency: 2,
    maturityDate: '2032-08-15',
    settlementDate: '2026-10-13',
    source: 'US TreasuryDirect / FRED',
    autoSet: true
  },

  // France (OATs)
  'FR0013519048': {
    isin: 'FR0013519048',
    title: 'French Government Bond (OAT) 1.25% May 2034',
    faceValue: 100.00,
    cleanPrice: 73.39,
    couponRate: 1.25,
    frequency: 1,
    maturityDate: '2034-05-25',
    settlementDate: '2026-10-13',
    source: 'Agence France Trésor (AFT)',
    autoSet: true
  },

  // United Kingdom (Gilts)
  'GB00BNNGP668': {
    isin: 'GB00BNNGP668',
    title: 'UK Government Gilt 4.25% Mar 2034',
    faceValue: 100.00,
    cleanPrice: 99.10,
    couponRate: 4.25,
    frequency: 2,
    maturityDate: '2034-03-07',
    settlementDate: '2026-10-13',
    source: 'UK Debt Management Office (DMO)',
    autoSet: true
  },

  // Italy (BTPs)
  'IT0005544082': {
    isin: 'IT0005544082',
    title: 'Italy Buoni del Tesoro Poliennali (BTP) 4.35% Nov 2033',
    faceValue: 100.00,
    cleanPrice: 101.20,
    couponRate: 4.35,
    frequency: 2,
    maturityDate: '2033-11-01',
    settlementDate: '2026-10-13',
    source: 'MEF Tesoro Italiano',
    autoSet: true
  },
  'IT0001086567': {
    isin: 'IT0001086567',
    title: 'Italy Buoni Poliennali Del Tesoro (BTP) 7.25% Nov 2026',
    faceValue: 100.00,
    cleanPrice: 99.71,
    couponRate: 7.25,
    frequency: 2,
    maturityDate: '2026-11-01',
    settlementDate: '2026-10-13',
    source: 'MEF Tesoro / Borsa Italiana (MOT)',
    autoSet: true
  },

  // Argentina & Emerging / Eurobonds
  'XS2200244072': {
    isin: 'XS2200244072',
    title: 'Republic of Argentina 0.50% Jul 2029',
    faceValue: 100.00,
    cleanPrice: 86.45,
    couponRate: 0.50,
    frequency: 2,
    maturityDate: '2029-07-09',
    settlementDate: '2026-10-13',
    source: 'OpenFIGI / Boerse Frankfurt',
    autoSet: true
  },

  // Spain (Bonos)
  'ES00000128C6': {
    isin: 'ES00000128C6',
    title: 'Spain Bonos y Obligaciones del Estado 3.15% Oct 2033',
    faceValue: 100.00,
    cleanPrice: 97.40,
    couponRate: 3.15,
    frequency: 1,
    maturityDate: '2033-10-31',
    settlementDate: '2026-10-13',
    source: 'Tesoro Público España',
    autoSet: true
  },

  // Japan (JGBs)
  'JP1103721N90': {
    isin: 'JP1103721N90',
    title: 'Japan 10-Year Government Bond (JGB) 0.80% Sep 2033',
    faceValue: 100.00,
    cleanPrice: 98.90,
    couponRate: 0.80,
    frequency: 2,
    maturityDate: '2033-09-20',
    settlementDate: '2026-10-13',
    source: 'Ministry of Finance Japan (MOF)',
    autoSet: true
  },

  // Canada
  'CA135087Q376': {
    isin: 'CA135087Q376',
    title: 'Government of Canada Bond 3.25% Jun 2034',
    faceValue: 100.00,
    cleanPrice: 95.80,
    couponRate: 3.25,
    frequency: 2,
    maturityDate: '2034-06-01',
    settlementDate: '2026-10-13',
    source: 'Bank of Canada / Govt of Canada',
    autoSet: true
  },

  // Australia
  'AU0000286809': {
    isin: 'AU0000286809',
    title: 'Australian Treasury Bond 3.75% Apr 2034',
    faceValue: 100.00,
    cleanPrice: 96.75,
    couponRate: 3.75,
    frequency: 2,
    maturityDate: '2034-04-21',
    settlementDate: '2026-10-13',
    source: 'Australian Office of Financial Mgmt (AOFM)',
    autoSet: true
  },

  // Netherlands
  'NL0015000B11': {
    isin: 'NL0015000B11',
    title: 'Netherlands Dutch State Loan (DSL) 2.50% Jul 2033',
    faceValue: 100.00,
    cleanPrice: 97.60,
    couponRate: 2.50,
    frequency: 1,
    maturityDate: '2033-07-15',
    settlementDate: '2026-10-13',
    source: 'Dutch State Debt Management Office (DSTA)',
    autoSet: true
  }
};

/**
 * Helper to parse coupon and maturity date from an OpenFIGI ticker or security description.
 * Examples:
 *   "DBR 4 01/04/37" -> coupon: 4, maturity: 2037-01-04
 *   "ARGENT 0.5 07/09/29" -> coupon: 0.5, maturity: 2029-07-09
 *   "BTPS 7.25 11/01/26 30Y" -> coupon: 7.25, maturity: 2026-11-01
 *   "T 4 1/4 02/15/34" -> coupon: 4.25, maturity: 2034-02-15
 */
function parseFIGITicker(ticker, secDesc) {
  if (!ticker && !secDesc) return { couponRate: null, maturityDate: null };
  const str = ticker || secDesc;

  // 1. Date: MM/DD/YY or MM/DD/YYYY
  const dateMatch = str.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  let maturityDate = null;
  if (dateMatch) {
    let [_, mm, dd, yy] = dateMatch;
    if (yy.length === 2) {
      const yearNum = parseInt(yy, 10);
      yy = (yearNum < 50 ? '20' : '19') + yy;
    }
    maturityDate = `${yy}-${mm}-${dd}`;
  }

  // 2. Coupon Rate
  let couponRate = null;
  if (dateMatch) {
    const beforeDate = str.slice(0, dateMatch.index).trim();
    const parts = beforeDate.split(/\s+/);
    const couponStr = parts.slice(1).join(' ');

    const fracMatch = couponStr.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (fracMatch) {
      couponRate = parseFloat(fracMatch[1]) + (parseFloat(fracMatch[2]) / parseFloat(fracMatch[3]));
    } else {
      const fracOnly = couponStr.match(/^(\d+)\/(\d+)$/);
      if (fracOnly) {
        couponRate = parseFloat(fracOnly[1]) / parseFloat(fracOnly[2]);
      } else {
        const floatVal = parseFloat(couponStr);
        if (!isNaN(floatVal)) couponRate = floatVal;
      }
    }
  }

  return { couponRate, maturityDate };
}

/**
 * Queries OpenFIGI v3 mapping API for bond reference details.
 */
async function fetchOpenFIGI(isin) {
  if (typeof fetch === 'undefined') return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ idType: 'ID_ISIN', idValue: isin }]),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    if (json[0] && json[0].data && json[0].data.length > 0) {
      return json[0].data[0];
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Queries Börse Frankfurt SSE stream endpoint for real-time clean price.
 */
async function fetchBoerseFrankfurtPrice(isin) {
  if (typeof fetch === 'undefined') return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://api.boerse-frankfurt.de/v1/data/price_information?isin=${isin}`, {
      signal: controller.signal
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (buffer.includes('data:')) {
        const line = buffer.split('\n').find(l => l.startsWith('data:'));
        if (line) {
          clearTimeout(timeout);
          await reader.cancel();
          const json = JSON.parse(line.replace(/^data:\s*/, ''));
          const price = json.lastPrice ?? json.closingPricePrevTradingDay ?? null;
          if (price !== null && !isNaN(price)) {
            return parseFloat(price);
          }
          break;
        }
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * ISIN Lookup Engine: Queries database or remote provider for bond specification.
 */
async function lookupISIN(isin) {
  if (!isValidISIN(isin)) {
    throw new Error('Invalid ISIN code (failed ISO 6166 checksum).');
  }

  const code = isin.trim().toUpperCase();

  // Tier 1: Check Benchmark Reference Database
  if (ISIN_REFERENCE_DB[code]) {
    const ref = ISIN_REFERENCE_DB[code];
    return {
      ...ref,
      autoSet: true,
      fieldsSet: ['faceValue', 'cleanPrice', 'couponRate', 'frequency', 'settlementDate', 'maturityDate']
    };
  }

  const country = code.substring(0, 2);
  const isUS = (country === 'US');
  const isUK = (country === 'GB');
  const isIT = (country === 'IT');
  const isCA = (country === 'CA');
  const isAU = (country === 'AU');
  const isJP = (country === 'JP');
  const isEurozoneAnnual = ['DE', 'FR', 'ES', 'NL', 'BE', 'AT', 'FI', 'PT', 'IE'].includes(country);

  const defaultFrequency = isEurozoneAnnual && !isIT ? 1 : 2;
  const todayStr = new Date().toISOString().split('T')[0];

  // Tier 2: Live APIs (OpenFIGI + Börse Frankfurt)
  const [figiData, livePrice] = await Promise.all([
    fetchOpenFIGI(code),
    fetchBoerseFrankfurtPrice(code)
  ]);

  if (figiData) {
    const parsed = parseFIGITicker(figiData.ticker, figiData.securityDescription);
    const title = figiData.name
      ? `${figiData.name} ${figiData.ticker ? '(' + figiData.ticker + ')' : ''}`
      : `${country} Bond (${code})`;

    const fieldsSet = ['faceValue', 'frequency', 'settlementDate'];
    if (parsed.couponRate !== null) fieldsSet.push('couponRate');
    if (parsed.maturityDate !== null) fieldsSet.push('maturityDate');
    if (livePrice !== null) fieldsSet.push('cleanPrice');

    const isFullySet = fieldsSet.includes('cleanPrice') && fieldsSet.includes('couponRate') && fieldsSet.includes('maturityDate');

    return {
      isin: code,
      title: title.trim(),
      faceValue: 100.00,
      cleanPrice: livePrice !== null ? livePrice : null,
      couponRate: parsed.couponRate !== null ? parsed.couponRate : null,
      frequency: defaultFrequency,
      maturityDate: parsed.maturityDate || null,
      settlementDate: todayStr,
      source: livePrice !== null ? 'OpenFIGI & Börse Frankfurt' : 'OpenFIGI',
      autoSet: isFullySet,
      fieldsSet
    };
  }

  // Tier 3: If live price exists even without FIGI mapping
  if (livePrice !== null) {
    return {
      isin: code,
      title: `${country} Bond (${code})`,
      faceValue: 100.00,
      cleanPrice: livePrice,
      couponRate: null,
      frequency: defaultFrequency,
      maturityDate: null,
      settlementDate: todayStr,
      source: 'Börse Frankfurt Live Quote',
      autoSet: false,
      fieldsSet: ['faceValue', 'cleanPrice', 'frequency', 'settlementDate']
    };
  }

  // Fallback for valid ISIN without online match
  return {
    isin: code,
    title: `${country} Bond (${code})`,
    faceValue: 100.00,
    cleanPrice: null,
    couponRate: null,
    frequency: defaultFrequency,
    maturityDate: null,
    settlementDate: todayStr,
    source: 'ISO 6166 Validator',
    autoSet: false,
    fieldsSet: ['faceValue', 'frequency', 'settlementDate']
  };
}

/**
 * Returns [lastCouponDate, nextCouponDate] around settlementDate given maturityDate and frequency.
 */
function getCouponDates(settlementDate, maturityDate, frequency = 1) {
  if (settlementDate >= maturityDate) {
    throw new Error('Maturity Date must be strictly after Settlement Date.');
  }

  const matMonth = maturityDate.getMonth();
  const matDay = maturityDate.getDate();

  if (frequency === 1) {
    const cand = makeClampedDate(settlementDate.getFullYear(), matMonth, matDay);
    if (cand > settlementDate) {
      const nextCoupon = cand;
      const lastCoupon = makeClampedDate(settlementDate.getFullYear() - 1, matMonth, matDay);
      return [lastCoupon, nextCoupon];
    } else {
      const lastCoupon = cand;
      const nextCoupon = makeClampedDate(settlementDate.getFullYear() + 1, matMonth, matDay);
      return [lastCoupon, nextCoupon];
    }
  } else if (frequency === 2) {
    const m1 = matMonth;
    const m2 = (matMonth - 6 + 12) % 12;
    const months = [m1, m2].sort((a, b) => a - b);

    const allDates = [];
    for (const yr of [settlementDate.getFullYear() - 1, settlementDate.getFullYear(), settlementDate.getFullYear() + 1]) {
      for (const m of months) {
        allDates.push(makeClampedDate(yr, m, matDay));
      }
    }
    allDates.sort((a, b) => a - b);

    const pastDates = allDates.filter(d => d <= settlementDate);
    const futureDates = allDates.filter(d => d > settlementDate);

    const lastCoupon = pastDates[pastDates.length - 1];
    const nextCoupon = futureDates[0];
    return [lastCoupon, nextCoupon];
  } else {
    throw new Error('Unsupported payment frequency. Use Annual (1) or Semi-Annual (2).');
  }
}

/**
 * Counts total remaining coupon payments from nextCoupon date to maturityDate.
 */
function countRemainingCoupons(nextCoupon, maturityDate, frequency = 1) {
  if (nextCoupon > maturityDate) return 0;
  if (nextCoupon.getTime() === maturityDate.getTime()) return 1;

  const monthDiff = (maturityDate.getFullYear() - nextCoupon.getFullYear()) * 12 + (maturityDate.getMonth() - nextCoupon.getMonth());
  const periodMonths = 12 / frequency;
  return 1 + Math.round(monthDiff / periodMonths);
}

/**
 * Main Bond Financial Engine: Calculates YTM, Accrued Interest, Dirty Price, Years to Maturity.
 */
function calculateBondMetrics(faceValue, cleanPricePct, couponRate, settlementDate, maturityDate, frequency = 1) {
  if (isNaN(faceValue) || faceValue <= 0) {
    throw new Error('Face Value must be a positive number.');
  }
  if (isNaN(cleanPricePct) || cleanPricePct <= 0) {
    throw new Error('Clean Price must be a positive percentage.');
  }
  if (isNaN(couponRate) || couponRate < 0) {
    throw new Error('Coupon Rate cannot be negative.');
  }
  if (!settlementDate || isNaN(settlementDate.getTime())) {
    throw new Error('Valid Settlement Date is required.');
  }
  if (!maturityDate || isNaN(maturityDate.getTime())) {
    throw new Error('Valid Maturity Date is required.');
  }
  if (settlementDate >= maturityDate) {
    throw new Error('Maturity Date must be strictly after Settlement Date.');
  }

  const [lastCoupon, nextCoupon] = getCouponDates(settlementDate, maturityDate, frequency);
  const daysInPeriod = dateDiffInDays(lastCoupon, nextCoupon);
  const accruedDays = dateDiffInDays(lastCoupon, settlementDate);
  const daysToNext = dateDiffInDays(settlementDate, nextCoupon);

  const annualCouponVal = (couponRate / 100) * faceValue;
  const periodCouponVal = annualCouponVal / frequency;

  const accruedFraction = accruedDays / daysInPeriod;
  const accruedInterest = periodCouponVal * accruedFraction;

  const cleanPriceVal = (cleanPricePct / 100) * faceValue;
  const dirtyPriceVal = cleanPriceVal + accruedInterest;

  const totalDays = dateDiffInDays(settlementDate, maturityDate);
  const yearsRemaining = totalDays / 365.25;

  const w = daysToNext / daysInPeriod;
  const N = countRemainingCoupons(nextCoupon, maturityDate, frequency);

  const C = periodCouponVal;
  const M = faceValue;

  function pv(y) {
    let total = 0;
    const r = 1 + y / frequency;
    if (r <= 1e-4) return Infinity;
    for (let k = 1; k <= N; k++) {
      const cf = (k === N) ? C + M : C;
      total += cf / Math.pow(r, k - 1 + w);
    }
    return total;
  }

  function pvPrime(y) {
    let total = 0;
    const r = 1 + y / frequency;
    if (r <= 1e-4) return -1e-9;
    for (let k = 1; k <= N; k++) {
      const cf = (k === N) ? C + M : C;
      const exp = k - 1 + w;
      total += -cf * exp * Math.pow(r, -(exp + 1)) / frequency;
    }
    return total;
  }

  let y = (couponRate > 0) ? couponRate / 100 : 0.05;
  const minY = -frequency + 1e-4;
  const maxY = 5.0;

  for (let i = 0; i < 100; i++) {
    const fVal = pv(y) - dirtyPriceVal;
    if (Math.abs(fVal) < 1e-7) break;
    const fp = pvPrime(y);
    if (Math.abs(fp) < 1e-12) break;
    const dy = fVal / fp;
    const yNext = y - dy;
    if (yNext <= minY || yNext >= maxY) {
      y = Math.max(minY, Math.min(maxY, y - 0.5 * dy));
    } else {
      y = yNext;
    }
  }

  const ytmPct = y * 100;

  return {
    accruedInterest,
    dirtyPrice: dirtyPriceVal,
    yearsRemaining,
    ytm: ytmPct,
    lastCoupon,
    nextCoupon,
    remainingCoupons: N
  };
}

// DOM Controller for Chrome Extension Side Panel / Popup UI
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const isinInput = document.getElementById('isinInput');
    const isinLookupBtn = document.getElementById('isinLookupBtn');
    const isinStatus = document.getElementById('isinStatus');

    const faceValueInput = document.getElementById('faceValue');
    const cleanPriceInput = document.getElementById('cleanPrice');
    const couponRateInput = document.getElementById('couponRate');
    const frequencySelect = document.getElementById('frequency');
    const settlementDateInput = document.getElementById('settlementDate');
    const maturityDateInput = document.getElementById('maturityDate');

    const calcBtn = document.getElementById('calcBtn');
    const resultsArea = document.getElementById('resultsArea');
    const errorMessage = document.getElementById('errorMessage');
    const accruedInterestEl = document.getElementById('accruedInterest');
    const dirtyPriceEl = document.getElementById('dirtyPrice');
    const yearsToMaturityEl = document.getElementById('yearsToMaturity');
    const ytmValueEl = document.getElementById('ytmValue');

    function initDefaultDates() {
      const now = new Date();
      if (!settlementDateInput.value) {
        settlementDateInput.value = now.toISOString().split('T')[0];
      }
      if (!maturityDateInput.value) {
        const tenYearsLater = new Date(now);
        tenYearsLater.setFullYear(now.getFullYear() + 10);
        maturityDateInput.value = tenYearsLater.toISOString().split('T')[0];
      }
    }

    function showISINStatus(msg, type = 'info') {
      isinStatus.classList.remove('hidden', 'text-emerald-400', 'text-red-400', 'text-cyan-400', 'text-emerald-600', 'text-red-600', 'text-blue-600', 'text-amber-600');
      if (type === 'success') {
        isinStatus.classList.add('text-emerald-600');
      } else if (type === 'error') {
        isinStatus.classList.add('text-red-600');
      } else if (type === 'warning') {
        isinStatus.classList.add('text-amber-600');
      } else {
        isinStatus.classList.add('text-blue-600');
      }
      isinStatus.textContent = msg;
    }

    // Helper to flash an element light green (auto-loaded) or amber (requires manual input)
    function flashElement(el, type) {
      if (!el) return;
      el.classList.remove('flash-green', 'flash-amber');
      void el.offsetWidth; // Force DOM reflow
      el.classList.add(type === 'green' ? 'flash-green' : 'flash-amber');
      setTimeout(() => {
        el.classList.remove('flash-green', 'flash-amber');
      }, 700);
    }

    async function handleISINLookup() {
      const isinCode = isinInput.value.trim().toUpperCase();
      if (!isinCode) return;

      showISINStatus('Searching global bond databases & exchanges...', 'info');

      try {
        const data = await lookupISIN(isinCode);
        const fieldsSet = data.fieldsSet || [];

        // 1. Update Face Value
        if (data.faceValue !== null && data.faceValue !== undefined) {
          faceValueInput.value = data.faceValue.toFixed(2);
          flashElement(faceValueInput, 'green');
        } else {
          flashElement(faceValueInput, 'amber');
        }

        // 2. Update Clean Price
        if (data.cleanPrice !== null && data.cleanPrice !== undefined) {
          cleanPriceInput.value = data.cleanPrice.toFixed(2);
          flashElement(cleanPriceInput, 'green');
        } else {
          flashElement(cleanPriceInput, 'amber');
        }

        // 3. Update Coupon Rate
        if (data.couponRate !== null && data.couponRate !== undefined) {
          couponRateInput.value = data.couponRate.toFixed(2);
          flashElement(couponRateInput, 'green');
        } else {
          flashElement(couponRateInput, 'amber');
        }

        // 4. Update Frequency
        if (data.frequency !== null && data.frequency !== undefined) {
          frequencySelect.value = data.frequency.toString();
          flashElement(frequencySelect, 'green');
        } else {
          flashElement(frequencySelect, 'amber');
        }

        // 5. Update Settlement Date
        if (data.settlementDate) {
          settlementDateInput.value = data.settlementDate;
          flashElement(settlementDateInput, 'green');
        }

        // 6. Update Maturity Date
        if (data.maturityDate) {
          maturityDateInput.value = data.maturityDate;
          flashElement(maturityDateInput, 'green');
        } else {
          flashElement(maturityDateInput, 'amber');
        }

        // Status banner feedback
        const missingFields = [];
        if (data.cleanPrice === null || data.cleanPrice === undefined) missingFields.push('Clean Price');
        if (data.couponRate === null || data.couponRate === undefined) missingFields.push('Coupon Rate');
        if (!data.maturityDate) missingFields.push('Maturity Date');

        if (missingFields.length === 0) {
          showISINStatus(`✓ Auto-Loaded: ${data.title} (${data.source})`, 'success');
          performCalculation();
        } else {
          showISINStatus(`✓ Loaded: ${data.title}. Missing ${missingFields.join(', ')} highlighted in amber.`, 'warning');
        }
      } catch (err) {
        showISINStatus(`❌ ${err.message}`, 'error');
      }
    }

    function loadSavedState() {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['bondInputs', 'lastISIN'], (res) => {
          if (res.lastISIN && isinInput) {
            isinInput.value = res.lastISIN;
            handleISINLookup();
          } else if (res.bondInputs) {
            const data = res.bondInputs;
            if (data.faceValue) faceValueInput.value = data.faceValue;
            if (data.cleanPrice) cleanPriceInput.value = data.cleanPrice;
            if (data.couponRate) couponRateInput.value = data.couponRate;
            if (data.frequency) frequencySelect.value = data.frequency;
            if (data.settlementDate) settlementDateInput.value = data.settlementDate;
            if (data.maturityDate) maturityDateInput.value = data.maturityDate;
            performCalculation();
          } else {
            performCalculation();
          }
        });
      } else {
        performCalculation();
      }
    }

    function saveState() {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const bondInputs = {
          faceValue: faceValueInput.value,
          cleanPrice: cleanPriceInput.value,
          couponRate: couponRateInput.value,
          frequency: frequencySelect.value,
          settlementDate: settlementDateInput.value,
          maturityDate: maturityDateInput.value
        };
        const lastISIN = isinInput ? isinInput.value.trim().toUpperCase() : '';
        chrome.storage.local.set({ bondInputs, lastISIN });
      }
    }

    function performCalculation() {
      errorMessage.classList.add('hidden');
      resultsArea.style.opacity = '0.6';

      try {
        const faceValue = parseFloat(faceValueInput.value);
        const cleanPricePct = parseFloat(cleanPriceInput.value);
        const couponRate = parseFloat(couponRateInput.value);
        const frequency = parseInt(frequencySelect.value, 10);
        const settlementStr = settlementDateInput.value;
        const maturityStr = maturityDateInput.value;

        if (isNaN(faceValue) || isNaN(cleanPricePct) || isNaN(couponRate) || !settlementStr || !maturityStr) {
          throw new Error('All fields are required.');
        }

        const settlementDate = new Date(settlementStr + 'T00:00:00');
        const maturityDate = new Date(maturityStr + 'T00:00:00');

        const metrics = calculateBondMetrics(
          faceValue,
          cleanPricePct,
          couponRate,
          settlementDate,
          maturityDate,
          frequency
        );

        accruedInterestEl.textContent = metrics.accruedInterest.toFixed(4);
        dirtyPriceEl.textContent = metrics.dirtyPrice.toFixed(4);
        yearsToMaturityEl.textContent = metrics.yearsRemaining.toFixed(3);
        ytmValueEl.innerHTML = `${metrics.ytm.toFixed(3)}<span class="text-xl">%</span>`;

        resultsArea.style.opacity = '1';
        saveState();
      } catch (err) {
        errorMessage.textContent = err.message;
        errorMessage.classList.remove('hidden');
        resultsArea.style.opacity = '0.6';
      }
    }

    initDefaultDates();
    loadSavedState();

    if (isinLookupBtn) {
      isinLookupBtn.addEventListener('click', handleISINLookup);
    }

    if (isinInput) {
      isinInput.addEventListener('input', () => {
        const val = isinInput.value.trim();
        if (val.length === 12) {
          handleISINLookup();
        }
      });

      isinInput.addEventListener('paste', () => {
        setTimeout(handleISINLookup, 50);
      });

      isinInput.addEventListener('change', () => {
        if (isinInput.value.trim().length === 12) {
          handleISINLookup();
        }
      });

      isinInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleISINLookup();
      });
    }

    if (calcBtn) {
      calcBtn.addEventListener('click', performCalculation);
    }

    [faceValueInput, cleanPriceInput, couponRateInput, frequencySelect, settlementDateInput, maturityDateInput].forEach(el => {
      if (el) {
        el.addEventListener('change', performCalculation);
      }
    });
  });
}

// Export for module unit testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    dateDiffInDays,
    makeClampedDate,
    isValidISIN,
    parseFIGITicker,
    fetchOpenFIGI,
    fetchBoerseFrankfurtPrice,
    lookupISIN,
    getCouponDates,
    countRemainingCoupons,
    calculateBondMetrics,
    ISIN_REFERENCE_DB
  };
}