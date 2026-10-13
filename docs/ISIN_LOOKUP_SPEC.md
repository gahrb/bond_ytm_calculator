# ISIN Lookup Architecture & Datasources Specification

**Document Version**: 2.1.0  
**Status**: Implemented & Extensible  
**Target Component**: `js/popup.js` / `popup.html`  
**Author**: Antigravity AI Engineering Team  

---

## 1. Executive Summary & Architecture

The **ISIN Lookup Engine** enables automated security resolution for fixed income bond instruments via ISO 6166 12-character identification numbers.

The engine uses a tiered data resolution model:
1. **Tier 1 (Instant / Offline Cache)**: Local benchmark database (`ISIN_REFERENCE_DB`) for benchmark sovereign bonds.
2. **Tier 2 (Global Live APIs)**:
   - **OpenFIGI v3 Mapping Engine** (`https://api.openfigi.com/v3/mapping`): Retrieves security name, ticker, coupon rate, maturity date, and market sector.
   - **Börse Frankfurt Real-Time Stream** (`https://api.boerse-frankfurt.de/v1/data/price_information?isin={ISIN}`): Streams clean price quotes (`lastPrice` or `closingPricePrevTradingDay`).
3. **Tier 3 (Graceful Fallback)**: Automatically infers national default conventions (e.g., German/French bonds = Annual, Italian BTPs/US Treasuries/UK Gilts/Eurobonds = Semi-Annual) and settlement dates (today).

```
                          +-------------------+
                          |  User Enters ISIN |
                          +---------+---------+
                                    │
                        [ISO 6166 Validation]
                                    │
                 +------------------+------------------+
                 │ (Valid)                             │ (Invalid)
                 ▼                                     ▼
     +-----------------------+              +---------------------+
     |    lookupISIN()       |              | Display Error:      |
     +-----------+-----------+              | "Invalid ISIN code" |
                 │                          +---------------------+
                 ▼
     [Tier 1: Check Local Cache]
     (Found? Return immediately)
                 │ (Not cached)
                 ▼
     [Tier 2: Parallel Remote Fetch]
        ┌────────┴────────┐
        ▼                 ▼
   OpenFIGI API     Börse Frankfurt
   (Metadata/Terms)  (Clean Price Quote)
        └────────┬────────┘
                 │
                 ▼
     [Field-by-Field Population]
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
Auto-Loaded Fields       Missing Fields
(Flash Light Green)     (Flash Amber)
     │                       │
     ▼                       ▼
Run YTM Calculation     Prompt Manual Input
```

---

## 2. Verified Test ISINs

The following benchmark bonds are verified and covered in automated unit test suites:

| ISIN | Security Description | Coupon Rate | Maturity Date | Clean Price | Payment Freq | Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DE0001135275` | Bundesrepublik Deutschland (Bund) | 4.00% | 2037-01-04 | 104.72% | Annual (1) | OpenFIGI / Boerse Frankfurt |
| `XS2200244072` | Republic of Argentina | 0.50% | 2029-07-09 | 86.45% | Semi-Annual (2) | OpenFIGI / Boerse Frankfurt |
| `IT0001086567` | Italy Buoni Poliennali Del Tesoro (BTP) | 7.25% | 2026-11-01 | 99.71% | Semi-Annual (2) | OpenFIGI / Boerse Frankfurt |
| `DE0001102580` | Germany Bund 2.50% Feb 2035 | 2.50% | 2035-02-15 | 98.45% | Annual (1) | Bundesbank / Boerse Frankfurt |
| `US9128286T00` | US Treasury Note 4.00% Feb 2034 | 4.00% | 2034-02-15 | 97.80% | Semi-Annual (2) | US TreasuryDirect / FRED |
| `FR0013519048` | French Government OAT 1.25% May 2034 | 1.25% | 2034-05-25 | 73.39% | Annual (1) | Agence France Trésor |
| `GB00BNNGP668` | UK Government Gilt 4.25% Mar 2034 | 4.25% | 2034-03-07 | 99.10% | Semi-Annual (2) | UK Debt Management Office |
| `IT0005544082` | Italy BTP 4.35% Nov 2033 | 4.35% | 2033-11-01 | 101.20% | Semi-Annual (2) | MEF Tesoro Italiano |
| `ES00000128C6` | Spain Bonos 3.15% Oct 2033 | 3.15% | 2033-10-31 | 97.40% | Annual (1) | Tesoro Público España |
| `JP1103721N90` | Japan JGB 0.80% Sep 2033 | 0.80% | 2033-09-20 | 98.90% | Semi-Annual (2) | MOF Japan |
| `CA135087Q376` | Canada Bond 3.25% Jun 2034 | 3.25% | 2034-06-01 | 95.80% | Semi-Annual (2) | Bank of Canada |
| `AU0000286809` | Australian Treasury Bond 3.75% Apr 2034 | 3.75% | 2034-04-21 | 96.75% | Semi-Annual (2) | AOFM |
| `NL0015000B11` | Netherlands DSL 2.50% Jul 2033 | 2.50% | 2033-07-15 | 97.60% | Annual (1) | DSTA |

---

## 3. UI Visual Feedback Specification

- **Auto-Populated Parameters**: When an input field (`Face Value`, `Clean Price`, `Coupon Rate`, `Frequency`, `Settlement Date`, `Maturity Date`) is successfully resolved from a database or live API, the input flashes **light green** (`flash-green`: `#dcfce7`) for 0.6 seconds.
- **Missing / Manual Parameters**: If a valid ISIN is resolved but a specific parameter (e.g., Clean Price on an illiquid bond) could not be retrieved, that specific input flashes **amber** (`flash-amber`: `#fef3c7`), and the status banner alerts the user:
  `✓ Loaded: [Title]. Missing Clean Price highlighted in amber.`
- **Automatic YTM Computation**: Once all mandatory parameters are set, the calculator automatically runs the Newton-Raphson ICMA Actual/Actual engine and updates Yield to Maturity, Accrued Interest, and Dirty Price.

---

## 4. Verification & Testing

Run all unit tests:
```bash
PYTHONDONTWRITEBYTECODE=1 pytest -o cache_dir=/tmp/.pytest_cache tests/test_bond_math.py
node --test tests/test_popup.test.js
```
