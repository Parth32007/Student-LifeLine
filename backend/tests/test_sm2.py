from datetime import date, timedelta
from app.services.spaced_repetition import calculate_sm2

def test_sm2_perfect_first_recall():
    interval, reps, ease, next_date = calculate_sm2(
        rating=5,
        interval_days=1,
        repetition_count=0,
        ease_factor=2.5
    )
    assert reps == 1
    assert interval == 1
    assert ease >= 2.5
    assert next_date == date.today() + timedelta(days=1)

def test_sm2_second_recall():
    interval, reps, ease, next_date = calculate_sm2(
        rating=4,
        interval_days=1,
        repetition_count=1,
        ease_factor=2.6
    )
    assert reps == 2
    assert interval == 6
    assert next_date == date.today() + timedelta(days=6)

def test_sm2_failed_recall_resets():
    interval, reps, ease, next_date = calculate_sm2(
        rating=1,
        interval_days=15,
        repetition_count=4,
        ease_factor=2.5
    )
    assert reps == 0
    assert interval == 1
    assert next_date == date.today() + timedelta(days=1)
