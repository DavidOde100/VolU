from flask import Blueprint, jsonify, request
from datetime import datetime
import uuid
from app.database import notifications_collection  # Import the collection

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@notifications_bp.route("/", methods=["GET"])
def get_notifications():
    unread_only = request.args.get("unreadOnly") == "true"
    query = {"isRead": False} if unread_only else {}
    notifications = list(notifications_collection.find(query).sort("createdAt", -1))

    for n in notifications:
        n["id"] = str(n["_id"])
        del n["_id"]

    return jsonify(notifications), 200

@notifications_bp.route("/unread-count", methods=["GET"])
def get_unread_count():
    count = notifications_collection.count_documents({"isRead": False})
    return jsonify(count), 200

@notifications_bp.route("/mark-as-read/<notification_id>", methods=["POST"])
def mark_as_read(notification_id):
    result = notifications_collection.update_one(
        {"_id": uuid.UUID(notification_id)},
        {"$set": {"isRead": True, "readAt": datetime.utcnow().isoformat()}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Notification not found"}), 404

    return jsonify({"message": "Notification marked as read"}), 200

@notifications_bp.route("/mark-all-as-read", methods=["POST"])
def mark_all_as_read():
    notifications_collection.update_many(
        {"isRead": False},
        {"$set": {"isRead": True, "readAt": datetime.utcnow().isoformat()}}
    )
    return jsonify({"message": "All notifications marked as read"}), 200

@notifications_bp.route("/delete/<notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    result = notifications_collection.delete_one({"_id": uuid.UUID(notification_id)})

    if result.deleted_count == 0:
        return jsonify({"error": "Notification not found"}), 404

    return jsonify({"message": "Notification deleted"}), 200

