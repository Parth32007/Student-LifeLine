import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Demo token configured to authenticate as Alex Rivera
AUTH_HEADERS = {"Authorization": "Bearer demo-bearer-token-lifeos-test"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "LifeOS" in data["app"]

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data

def test_get_profile():
    response = client.get("/api/v1/profile/", headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data

def test_list_subjects():
    response = client.get("/api/v1/subjects/", headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    # Verify DBMS subject exists
    dbms = next((s for s in data if "DBMS" in s["name"] or "Database" in s["name"]), None)
    assert dbms is not None
    assert "units" in dbms


def test_todays_tasks():
    response = client.get("/api/v1/tasks/today", headers=AUTH_HEADERS)
    assert response.status_code == 200
    tasks = response.json()
    assert isinstance(tasks, list)
    assert len(tasks) > 0
    assert any("DBMS" in t["title"] or "DSA" in t["title"] for t in tasks)

def test_what_to_study_now():
    response = client.get("/api/v1/tasks/what-to-study-now", headers=AUTH_HEADERS)
    assert response.status_code == 200
    rec = response.json()
    assert "title" in rec
    assert "recommended_duration_minutes" in rec

def test_tutor_chat_message():
    payload = {
        "content": "Explain binary search algorithm simply",
        "mode": "general"
    }
    response = client.post("/api/v1/tutor/chat", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "assistant"
    assert len(data["content"]) > 0

def test_tutor_conversations():
    response = client.get("/api/v1/tutor/conversations", headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_list_flashcards():
    response = client.get("/api/v1/flashcards/due", headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_coding_problems():
    response = client.get("/api/v1/coding/problems", headers=AUTH_HEADERS)
    assert response.status_code == 200
    problems = response.json()
    assert isinstance(problems, list)
    assert len(problems) > 0

def test_coding_explain():
    payload = {
        "code": "def binary_search(arr, target):\n    l, r = 0, len(arr) - 1\n    while l <= r:\n        m = (l + r) // 2\n        if arr[m] == target: return m\n        elif arr[m] < target: l = m + 1\n        else: r = m - 1\n    return -1",
        "language": "python"
    }
    response = client.post("/api/v1/coding/explain", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    res = response.json()
    assert "explanation" in res

def test_analytics_overview():
    response = client.get("/api/v1/analytics/overview", headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "total_study_hours" in data
    assert "study_streak_days" in data
    assert "subject_progress" in data

def test_exam_readiness():
    response = client.get("/api/v1/analytics/exam-readiness", headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "readiness_percentage" in data

def test_command_palette_execution():
    payload = {"command": "Schedule 45m DSA practice tonight"}
    response = client.post("/api/v1/commands/execute", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "action_taken" in data or "intent" in data
    assert "message" in data
