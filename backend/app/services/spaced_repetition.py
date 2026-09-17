from datetime import date, timedelta
from typing import Tuple

def calculate_sm2(
    rating: int,
    interval_days: int,
    repetition_count: int,
    ease_factor: float
) -> Tuple[int, int, float, date]:
    """
    Implements the SuperMemo-2 (SM-2) Spaced Repetition Algorithm.
    
    Parameters:
      rating: Quality of response from 0 to 5:
        5 - perfect response
        4 - correct response after a hesitation
        3 - correct response recalled with serious difficulty
        2 - incorrect response; where the correct one seemed easy to recall
        1 - incorrect response; the correct one remembered
        0 - complete blackout.
      interval_days: Current inter-repetition interval in days.
      repetition_count: Number of consecutive successful repetitions.
      ease_factor: Current easiness factor (minimum 1.3).
      
    Returns:
      (new_interval_days, new_repetition_count, new_ease_factor, next_review_date)
    """
    rating = max(0, min(5, rating))

    # Calculate new ease factor
    # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
    if new_ease_factor < 1.3:
        new_ease_factor = 1.3

    if rating >= 3:
        # Successful recall
        if repetition_count == 0:
            new_interval = 1
        elif repetition_count == 1:
            new_interval = 6
        else:
            new_interval = int(round(interval_days * new_ease_factor))
        
        new_repetition_count = repetition_count + 1
    else:
        # Failed recall: reset repetitions back to 0 and interval to 1 day
        new_repetition_count = 0
        new_interval = 1

    next_review_date = date.today() + timedelta(days=new_interval)
    return new_interval, new_repetition_count, round(new_ease_factor, 2), next_review_date
