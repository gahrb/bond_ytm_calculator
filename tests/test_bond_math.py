# test_bond_math.py
import datetime
import math
import pytest

def date_diff_days(a: datetime.date, b: datetime.date) -> int:
    return (b - a).days

def make_clamped_date(yr: int, m: int, d: int) -> datetime.date:
    import calendar
    _, last_d = calendar.monthrange(yr, m)
    return datetime.date(yr, m, min(d, last_d))

def get_coupon_dates(settlement_date: datetime.date, maturity_date: datetime.date, frequency: int = 1):
    if settlement_date >= maturity_date:
        raise ValueError("Maturity Date must be after Settlement Date.")

    mat_month = maturity_date.month
    mat_day = maturity_date.day

    if frequency == 1:
        cand = make_clamped_date(settlement_date.year, mat_month, mat_day)
        if cand > settlement_date:
            next_coupon = cand
            last_coupon = make_clamped_date(settlement_date.year - 1, mat_month, mat_day)
        else:
            last_coupon = cand
            next_coupon = make_clamped_date(settlement_date.year + 1, mat_month, mat_day)
    elif frequency == 2:
        m1 = mat_month
        m2 = (mat_month - 6 - 1) % 12 + 1
        months = sorted([m1, m2])
        
        all_dates = []
        for yr in [settlement_date.year - 1, settlement_date.year, settlement_date.year + 1]:
            for m in months:
                all_dates.append(make_clamped_date(yr, m, mat_day))
        all_dates.sort()

        last_coupon = [d for d in all_dates if d <= settlement_date][-1]
        next_coupon = [d for d in all_dates if d > settlement_date][0]
    else:
        raise ValueError("Unsupported frequency.")

    return last_coupon, next_coupon

def count_remaining_coupons(next_coupon: datetime.date, maturity_date: datetime.date, frequency: int = 1) -> int:
    if next_coupon > maturity_date:
        return 0
    if next_coupon == maturity_date:
        return 1

    months = (maturity_date.year - next_coupon.year) * 12 + (maturity_date.month - next_coupon.month)
    period_months = 12 // frequency
    return 1 + int(round(months / period_months))

def calculate_bond_metrics(face_value, clean_price_pct, coupon_rate, settlement_date, maturity_date, frequency=1):
    if face_value <= 0:
        raise ValueError("Face Value must be positive.")
    if clean_price_pct <= 0:
        raise ValueError("Clean Price must be positive.")
    if coupon_rate < 0:
        raise ValueError("Coupon Rate cannot be negative.")
    if settlement_date >= maturity_date:
        raise ValueError("Maturity Date must be strictly after Settlement Date.")

    last_coupon, next_coupon = get_coupon_dates(settlement_date, maturity_date, frequency)
    days_in_period = date_diff_days(last_coupon, next_coupon)
    accrued_days = date_diff_days(last_coupon, settlement_date)
    days_to_next = date_diff_days(settlement_date, next_coupon)

    annual_coupon_val = (coupon_rate / 100.0) * face_value
    period_coupon_val = annual_coupon_val / frequency

    accrued_fraction = accrued_days / days_in_period
    accrued_interest = period_coupon_val * accrued_fraction

    clean_price_val = (clean_price_pct / 100.0) * face_value
    dirty_price_val = clean_price_val + accrued_interest

    total_days = date_diff_days(settlement_date, maturity_date)
    years_remaining = total_days / 365.25

    w = days_to_next / days_in_period
    N = count_remaining_coupons(next_coupon, maturity_date, frequency)

    C = period_coupon_val
    M = face_value

    def pv(y):
        total = 0.0
        r = 1.0 + y / frequency
        if r <= 1e-4:
            return float('inf')
        for k in range(1, N + 1):
            cf = C + M if k == N else C
            total += cf / (r ** (k - 1 + w))
        return total

    def pv_prime(y):
        total = 0.0
        r = 1.0 + y / frequency
        if r <= 1e-4:
            return -1e-9
        for k in range(1, N + 1):
            cf = C + M if k == N else C
            exp = k - 1 + w
            total += -cf * exp * (r ** (-(exp + 1))) / frequency
        return total

    y = coupon_rate / 100.0 if coupon_rate > 0 else 0.05
    min_y = -frequency + 1e-4
    max_y = 5.0

    for _ in range(100):
        f_val = pv(y) - dirty_price_val
        if abs(f_val) < 1e-7:
            break
        fp = pv_prime(y)
        if abs(fp) < 1e-12:
            break
        dy = f_val / fp
        y_next = y - dy
        if y_next <= min_y or y_next >= max_y:
            y = max(min_y, min(max_y, y - 0.5 * dy))
        else:
            y = y_next

    ytm_pct = y * 100.0

    return {
        "accruedInterest": accrued_interest,
        "dirtyPrice": dirty_price_val,
        "yearsRemaining": years_remaining,
        "ytm": ytm_pct,
        "lastCoupon": last_coupon,
        "nextCoupon": next_coupon,
        "remainingCoupons": N
    }

# Unit tests
def test_par_bond():
    settlement = datetime.date(2026, 5, 25)
    maturity = datetime.date(2036, 5, 25)
    res = calculate_bond_metrics(100.0, 100.0, 4.0, settlement, maturity, 1)
    assert abs(res["accruedInterest"]) < 1e-6
    assert abs(res["dirtyPrice"] - 100.0) < 1e-6
    assert abs(res["ytm"] - 4.0) < 1e-4

def test_oat_example():
    # French OAT 1.25% 2034, Clean price = 73.39%
    settlement = datetime.date(2024, 10, 1)
    maturity = datetime.date(2034, 5, 25)
    res = calculate_bond_metrics(100.0, 73.39, 1.25, settlement, maturity, 1)
    # Accrued interest between May 25 2024 and Oct 1 2024 (129 days out of 365)
    assert 0.4 < res["accruedInterest"] < 0.5
    # YTM should be approx 4.8% - 5.2%
    assert 4.0 < res["ytm"] < 6.0

def test_zero_coupon_bond():
    settlement = datetime.date(2025, 1, 1)
    maturity = datetime.date(2030, 1, 1)
    res = calculate_bond_metrics(100.0, 80.0, 0.0, settlement, maturity, 1)
    assert res["accruedInterest"] == 0.0
    # (100/80)^(1/5) - 1 = 4.564%
    assert abs(res["ytm"] - 4.564) < 0.1

def test_semiannual_bond():
    settlement = datetime.date(2025, 1, 15)
    maturity = datetime.date(2030, 7, 15)
    res = calculate_bond_metrics(100.0, 95.0, 3.0, settlement, maturity, 2)
    assert res["remainingCoupons"] == 11
    assert res["ytm"] > 3.0

def test_invalid_dates():
    settlement = datetime.date(2030, 1, 1)
    maturity = datetime.date(2025, 1, 1)
    with pytest.raises(ValueError, match="Maturity Date must be strictly after Settlement Date"):
        calculate_bond_metrics(100.0, 95.0, 3.0, settlement, maturity, 1)
