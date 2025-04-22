import pytest
from flask import Flask
from app.routes.user_profile import user_profile_bp
from app.database import user_collection

@pytest.fixture
def client():
    app = Flask(__name__)
    app.config["TESTING"] = True
    app.register_blueprint(user_profile_bp)

    with app.test_client() as client:
        yield client

def test_get_user_profile(client):
    user_id = "test_user_123"
    user_collection.insert_one({"userId": user_id, "name": "John Doe"})
    response = client.get(f"/api/user-profile/{user_id}")
    assert response.status_code == 200
    assert response.get_json()["userId"] == user_id

def test_update_personal_info(client):
    user_id = "test_user_123"
    response = client.put(f"/api/user-profile/{user_id}/personal-info", json={"fullName": "John Test"})
    assert response.status_code == 200

def test_update_skills(client):
    user_id = "test_user_123"
    response = client.put(f"/api/user-profile/{user_id}/skills", json=["Python", "React"])
    assert response.status_code == 200

def test_update_preferences(client):
    user_id = "test_user_123"
    response = client.put(f"/api/user-profile/{user_id}/preferences", json={"preferredLocation": "Remote"})
    assert response.status_code == 200

def test_update_availability(client):
    user_id = "test_user_123"
    response = client.put(f"/api/user-profile/{user_id}/availability", json={"availableDays": ["Monday"]})
    assert response.status_code == 200

def test_update_account_settings(client):
    user_id = "test_user_123"
    response = client.put(f"/api/user-profile/{user_id}/account-settings", json={"emailNotifications": True})
    assert response.status_code == 200

def test_delete_user_account(client):
    user_id = "test_user_123"
    user_collection.insert_one({"userId": user_id})
    response = client.delete(f"/api/user-profile/{user_id}")
    assert response.status_code == 200
