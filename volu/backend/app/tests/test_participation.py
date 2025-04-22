import pytest
from app.routes.participation import participation_bp
from flask import Flask
from mongomock import MongoClient
from datetime import datetime

# Setup Flask app and test client
@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(participation_bp, url_prefix="/api/participation")
    return app

@pytest.fixture
def client(app):
    return app.test_client()

# Mock MongoDB
@pytest.fixture(autouse=True)
def mock_db(monkeypatch):
    client = MongoClient()
    db = client.testdb
    monkeypatch.setattr("app.database.participation_collection", db.participation)
    monkeypatch.setattr("app.database.event_collection", db.event)
    return db

def test_get_all_participation(client, mock_db):
    mock_db.participation.insert_many([
        {"userId": "123", "eventId": "abc", "status": "Confirmed"},
        {"userId": "456", "eventId": "def", "status": "Attended"}
    ])
    res = client.get("/api/participation/all")
    assert res.status_code == 200
    assert "history" in res.json
    assert len(res.json["history"]) == 2

def test_get_my_participation(client, mock_db):
    mock_db.participation.insert_one({"userId": "user123", "eventId": "e1", "status": "Confirmed"})
    res = client.get("/api/participation/my?userId=user123")
    assert res.status_code == 200
    assert res.json["totalCount"] == 1

def test_record_participation_insert(client, mock_db):
    payload = {
        "userId": "user1",
        "eventId": "event1",
        "status": "Confirmed"
    }
    res = client.post("/api/participation/record", json=payload)
    assert res.status_code == 200
    assert mock_db.participation.count_documents({}) == 1

def test_record_participation_update(client, mock_db):
    mock_db.participation.insert_one({
        "userId": "user1",
        "eventId": "event1",
        "status": "Registered"
    })
    payload = {
        "userId": "user1",
        "eventId": "event1",
        "status": "Cancelled"
    }
    res = client.post("/api/participation/record", json=payload)
    assert res.status_code == 200
    updated = mock_db.participation.find_one({"userId": "user1"})
    assert updated["status"] == "Cancelled"

def test_log_feedback_success(client, mock_db):
    mock_db.participation.insert_one({"userId": "user1", "eventId": "event1", "status": "Attended"})
    res = client.post("/api/participation/log-feedback", json={
        "userId": "user1", "eventId": "event1", "feedback": "Great!"
    })
    assert res.status_code == 200
    updated = mock_db.participation.find_one({"userId": "user1"})
    assert updated["feedback"] == "Great!"

def test_statistics(client, mock_db):
    mock_db.participation.insert_many([
        {
            "userId": "u1",
            "status": "Attended",
            "hoursLogged": 4,
            "event": {"startDate": "2025-03-01"}
        },
        {
            "userId": "u1",
            "status": "Confirmed",
            "event": {"startDate": "2025-03-10"}
        }
    ])
    res = client.get("/api/participation/statistics?userId=u1")
    assert res.status_code == 200
    assert res.json["totalHours"] == 4
    assert res.json["eventsAttended"] == 1
    assert res.json["upcomingEvents"] == 1
