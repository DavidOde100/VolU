import pytest
from datetime import datetime
from bson import ObjectId
from app.routes.events import events_bp
from flask import Flask, json
from app.database import event_collection

@pytest.fixture
def client():
    app = Flask(__name__)
    app.register_blueprint(events_bp, url_prefix="/api/events")
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_create_event(client):
    response = client.post("/api/events/", json={
        "name": "Beach Cleanup",
        "location": "Galveston",
        "startDate": "2025-04-01",
        "endDate": "2025-04-01"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "name" in data and data["name"] == "Beach Cleanup"

def test_get_all_events(client):
    # Setup
    event_collection.insert_one({
        "name": "Test Event",
        "location": "Houston",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })

    response = client.get("/api/events/")
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)

def test_get_event_by_id(client):
    inserted = event_collection.insert_one({
        "name": "Event A",
        "location": "Library",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    response = client.get(f"/api/events/{inserted.inserted_id}")
    assert response.status_code == 200
    assert response.get_json()["name"] == "Event A"

def test_get_event_not_found(client):
    random_id = str(ObjectId())
    response = client.get(f"/api/events/{random_id}")
    assert response.status_code == 404

def test_update_event(client):
    inserted = event_collection.insert_one({
        "name": "Old Event",
        "location": "Park",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })

    response = client.put(f"/api/events/{inserted.inserted_id}", json={"name": "Updated Event"})
    assert response.status_code == 200
    updated = response.get_json()
    assert updated["name"] == "Updated Event"

def test_delete_event(client):
    inserted = event_collection.insert_one({
        "name": "To Delete",
        "location": "Somewhere",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    response = client.delete(f"/api/events/{inserted.inserted_id}")
    assert response.status_code == 200

def test_register_for_event(client):
    inserted = event_collection.insert_one({
        "name": "Register Me",
        "location": "Gym",
        "currentVolunteers": 0,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    response = client.post(f"/api/events/{inserted.inserted_id}/register")
    assert response.status_code == 200
    assert response.get_json()["currentVolunteers"] == 1

def test_unregister_from_event(client):
    inserted = event_collection.insert_one({
        "name": "Unregister Me",
        "location": "Hall",
        "currentVolunteers": 1,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    response = client.post(f"/api/events/{inserted.inserted_id}/unregister")
    assert response.status_code == 200
    assert response.get_json()["currentVolunteers"] == 0

def test_get_events_created_by_user(client):
    event_collection.insert_one({
        "name": "User Created",
        "location": "Online",
        "createdBy": "user123",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    response = client.get("/api/events/created-by/user123")
    assert response.status_code == 200
    events = response.get_json()
    assert any(e["createdBy"] == "user123" for e in events)
