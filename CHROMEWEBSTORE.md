# Chrome Web Store Metadata & Publishing Guide

**Extension Name**: Bond YTM & Pricing Calculator  
**Version**: 1.5.0  
**Manifest Version**: 3  
**Category**: Productivity / Financial Tools  
**Last Updated**: October 13, 2026  

---

## 1. Store Listing Copy

### Summary (Short Description - max 132 chars)
Calculates Yield to Maturity (YTM), Accrued Interest, and Dirty Price for fixed income bonds using Actual/Actual ICMA standards.

### Detailed Description
Bond YTM & Pricing Calculator is a lightweight tool for fixed income investors, financial analysts, and students to quickly compute bond yields and settlement pricing.

**Key Features:**
- **Persistent Side Panel Interface**: Opens in Chrome's Side Panel so it stays open on top while you browse, click, and inspect web pages.
- **ISIN Auto-Lookup & Live Pricing**: Enter any 12-character ISIN code (`DE0001135275`, `XS2200244072`, `IT0001086567`, `US9128286T00`) to auto-fill Face Value, Clean Price %, Coupon %, Frequency, Settlement Date, and Maturity Date via OpenFIGI and exchange quotes.
- **Visual Parameter Feedback**: Fields automatically flash light green when resolved or amber if manual entry is needed.
- **Yield to Maturity (YTM)**: Computes exact annualized yield using Newton-Raphson numerical solver.
- **Accrued Interest & Dirty Price**: Supports Actual/Actual ICMA day-count convention.
- **Annual & Semi-Annual Support**: Works for European sovereign bonds (OATs, Bunds) and semi-annual coupon bonds (US Treasuries, Gilts, Corporate Debt, Eurobonds).
- **Auto-Persistence**: Remembers your last inputs and settings securely in local extension storage.
- **Privacy-First**: No tracking or personal data collection.

**Legal Disclaimer & Limitation of Liability:**
All calculations, yield values, prices, and automated lookups are strictly for informational and educational purposes and do not constitute financial, investment, tax, or legal advice. Lookups and calculations may contain inaccuracies, delays, or errors. The user is solely responsible for verifying ground truth data against official issuer documentation and regulated market records before making any investment decisions. The developer(s) cannot and shall not be held liable for any investment decisions or financial losses resulting from the use of this software.

---

## 2. Permissions Justification

| Permission | Scope / Domain | Justification |
| :--- | :--- | :--- |
| `sidePanel` | Chrome Side Panel API | Enables the calculator to open in a persistent side drawer alongside the webpage so it remains open on top when clicking on the web page. |
| `storage` | Local extension storage | Used strictly to persist user-entered bond input parameters and last queried ISIN across sessions. |
| `host_permissions` (`https://api.openfigi.com/*`) | OpenFIGI v3 Mapping API | Queries bond security reference metadata (security title, coupon rate, and maturity date) by ISIN. |
| `host_permissions` (`https://api.boerse-frankfurt.de/*`) | Börse Frankfurt Quote Feed | Queries real-time clean price percentages for European and international bonds. |

---

## 3. Privacy & Data Use Disclosure

- **Data Collection**: The extension collects **NO** personal data, browsing history, or analytics.
- **Network Requests**: Only outbound API calls are made to OpenFIGI and Börse Frankfurt when a user enters an ISIN for auto-lookup. All financial calculations run locally.
- **Remote Code**: No remote scripts loaded. Uses local minified CSS and JavaScript assets.

---

## 4. Legal Disclaimer & Limitation of Liability

1. **Not Financial or Investment Advice**: The software, its code, outputs, and any data retrieved or displayed do not constitute financial, investment, legal, tax, or accounting advice, nor an offer, solicitation, or recommendation to buy or sell any security.
2. **No Warranties / Ground Truth Verification**: The software is provided "as is", without warranty of any kind. Automated lookups, market quotes, dates, and mathematical formulas may be delayed, inaccurate, or subject to rounding and model limitations. Users are solely responsible for independently verifying all data against ground truth (official bond prospectuses, issuer filings, and regulated exchange publications).
3. **Limitation of Liability**: To the maximum extent permitted by applicable law, the developer(s), authors, and contributors shall have no liability whatsoever for any direct, indirect, incidental, consequential, special, punitive, or capital losses or damages arising out of the use of, or inability to use, this application or reliance on any calculations or data presented herein.
4. **AI / LLM-Assisted Development Disclosure**: This software, including its source code, logic, and interface, was created with the assistance of artificial intelligence and Large Language Models (LLMs). While tested with comprehensive test suites, automated code may contain unforeseen bugs or calculation edge cases. Users must independently verify all figures against ground truth sources.

---

## 5. Extension Assets

- **Icons**:
  - `icons/icon-16.png` (16x16 px PNG)
  - `icons/icon-48.png` (48x48 px PNG)
  - `icons/icon-128.png` (128x128 px PNG)

---

## 6. Version History

- **v1.5.0**: Integrated live OpenFIGI and Börse Frankfurt APIs for automated global bond lookup (tested on `DE0001135275`, `XS2200244072`, `IT0001086567`), added field-by-field green flash (auto-set) and amber flash (manual requirement) animations, and added prominent legal disclaimer and limitation of liability disclosures.
- **v1.4.0**: Added persistent Chrome Side Panel support (`chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`) so the calculator stays open on top while interacting with web pages.
- **v1.3.0**: Fixed Manifest V3 service worker crashing issue, corrected bond date discounting formula for ICMA Actual/Actual compliance, added ISIN auto-lookup engine, added semi-annual frequency support, added UI input persistence via `chrome.storage.local`, optimized PNG icons, and added unit test coverage.
