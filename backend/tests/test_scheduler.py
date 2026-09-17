from datetime import time
from app.services.scheduler_service import AdaptiveSchedulerService

def test_time_conversions():
    service = AdaptiveSchedulerService()
    t = service.parse_time_str("14:30")
    assert t.hour == 14
    assert t.minute == 30
    mins = service.time_to_minutes(t)
    assert mins == 14 * 60 + 30
    s = service.minutes_to_time_str(mins)
    assert s == "14:30"
