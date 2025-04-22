import pytest
from flask import Flask
from datetime import datetime
import uuid

from app.routes.notifications import notifications_bp
from app.database import notifications_collection

@pytest.fixture
def client():
    app = Flask(__name__)
    app.register_blueprint(notifications_bp)
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client

def test_get_notifications(client):
    notifications_collection.insert_one({
        "_id": uuid.uuid4(),
        "message": "Test Notification",
        "isRead": False,
        "createdAt": datetime.utcnow()
    })
    res = client.get("/api/notifications/")
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_get_unread_count(client):
    res = client.get("/api/notifications/unread-count")
    assert res.status_code == 200
    assert isinstance(res.get_json(), int)

def test_mark_all_as_read(client):
    res = client.post("/api/notifications/mark-all-as-read")
    assert res.status_code == 200
    assert res.get_json()["message"] == "All notifications marked as read"

def test_mark_as_read_and_delete(client):
    notif_id = uuid.uuid4()
    notifications_collection.insert_one({
        "_id": notif_id,
        "message": "To be read and deleted",
        "isRead": False,
        "createdAt": datetime.utcnow()
    })

    res_mark = client.post(f"/api/notifications/mark-as-read/{notif_id}")
    assert res_mark.status_code == 200
    assert "Notification marked as read" in res_mark.get_json()["message"]

    res_delete = client.delete(f"/api/notifications/delete/{notif_id}")
    assert res_delete.status_code == 200
    assert "Notification deleted" in res_delete.get_json()["message"]
