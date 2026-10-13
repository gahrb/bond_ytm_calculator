# Bond YTM & Pricing Calculator (Chrome Extension)

A lightweight, reliable Manifest V3 Chrome Extension that calculates **Yield to Maturity (YTM)**, **Accrued Interest**, and **Dirty Price** for fixed income bonds using international **Actual/Actual ICMA** standards.

Includes automated **ISIN Auto-Lookup** with live integration to **OpenFIGI** and **Börse Frankfurt** feeds.

---

## Features

- **ISIN Auto-Lookup**: Enter any 12-character ISIN (`DE0001135275`, `XS2200244072`, `IT0001086567`, `US9128286T00`) to automatically resolve:
  - Security Name & Title
  - Coupon Rate % (supporting decimal and fractional rates)
  - Payment Frequency (Annual / Semi-Annual)
  - Maturity Date
  - Real-time Clean Price % quote
- **Visual Feedback**:
  - Automatically resolved parameters flash **light green** for 0.6 seconds.
  - Parameters requiring manual entry flash **amber** with actionable guidance.
- **Persistent Side Panel Interface**: Runs in Chrome's Side Panel drawer (`chrome.sidePanel`), staying open alongside web pages so you can browse, copy ISINs, and calculate yields without popup auto-closing.
- **Accurate Financial Engine**: Newton-Raphson approximation adhering strictly to ICMA Actual/Actual conventions.
- **Input Persistence**: Saves your last entered parameters securely in `chrome.storage.local`.
- **Clean 2017 Kraken-Inspired UI**: Neutral, high-contrast, clutter-free financial card layout.

---

## Installation (Unpacked Extension)

1. Clone or download this repository:
   ```bash
   git clone git@github.com:gahrb/bond_ytm_calculator.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the upper right corner).
4. Click **Load unpacked** and select the cloned `bond_ytm_calculator` folder.
5. Click the extension icon in the toolbar or pin it to open the persistent side panel.

---

## Automated Tests

Run the test suite:
```bash
# Node.js Unit Tests (14 tests)
node --test tests/test_popup.test.js

# Python Bond Math Verification Suite (5 tests)
PYTHONDONTWRITEBYTECODE=1 pytest -o cache_dir=/tmp/.pytest_cache tests/test_bond_math.py
```

---

## Security & Privacy

- **No Credential Requirement**: 100% free public reference data feeds (OpenFIGI & Börse Frankfurt public feeds).
- **Zero Tracking**: No telemetry, analytics, tracking pixels, or third-party ad networks.
- **Local Calculation**: All yield and pricing math runs client-side in your browser.

---

## Legal Disclaimer

*See [DISCLAIMER.md](DISCLAIMER.md) for the full legal disclaimer.*  
All calculations and data lookups are strictly for informational and educational purposes. The user is solely responsible for verifying ground truth data before making any investment decisions. This software was developed with artificial intelligence (LLM) assistance.

---

## Support

If you find this extension useful, consider [buying a coffee](https://buymeacoffee.com/gahrb):
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Donate-orange?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/gahrb)
