from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from app.database import event_collection

events_bp = Blueprint("events", __name__, url_prefix="/api/events")

# Helper to convert MongoDB ObjectId to string
def serialize_event(event):
    event["_id"] = str(event["_id"])
    return event

@events_bp.route("/", methods=["GET"])
def get_all_events():
    events = list(event_collection.find())
    return jsonify([serialize_event(e) for e in events]), 200

@events_bp.route("/<string:event_id>", methods=["GET"])
def get_event_by_id(event_id):
    try:
        event = event_collection.find_one({"_id": ObjectId(event_id)})
        if not event:
            return jsonify({"error": "Event not found"}), 404

        event["_id"] = str(event["_id"])
        return jsonify(event), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@events_bp.route("/", methods=["POST"])
def create_event():
    data = request.json
    event = {
        "createdBy": data.get("createdBy", "admin"),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "currentVolunteers": 0,
        **data
    }
    result = event_collection.insert_one(event)
    event["_id"] = str(result.inserted_id)
    return jsonify(event), 201

@events_bp.route("/<event_id>", methods=["PUT"])
def update_event(event_id):
    data = request.json
    update_data = {
        **data,
        "updatedAt": datetime.utcnow()
    }
    result = event_collection.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": update_data}
    )
    if result.matched_count:
        updated_event = event_collection.find_one({"_id": ObjectId(event_id)})
        return jsonify(serialize_event(updated_event)), 200
    return jsonify({"error": "Event not found"}), 404

@events_bp.route("/<event_id>", methods=["DELETE"])
def delete_event(event_id):
    result = event_collection.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count:
        return jsonify({"message": "Event deleted"}), 200
    return jsonify({"error": "Event not found"}), 404

@events_bp.route("/<event_id>/register", methods=["POST"])
def register_for_event(event_id):
    result = event_collection.update_one(
        {"_id": ObjectId(event_id)},
        {"$inc": {"currentVolunteers": 1}}
    )
    if result.matched_count:
        updated_event = event_collection.find_one({"_id": ObjectId(event_id)})
        return jsonify(serialize_event(updated_event)), 200
    return jsonify({"error": "Event not found"}), 404

@events_bp.route("/<event_id>/unregister", methods=["POST"])
def unregister_from_event(event_id):
    event = event_collection.find_one({"_id": ObjectId(event_id)})
    if event and event.get("currentVolunteers", 0) > 0:
        event_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$inc": {"currentVolunteers": -1}}
        )
        updated_event = event_collection.find_one({"_id": ObjectId(event_id)})
        return jsonify(serialize_event(updated_event)), 200
    return jsonify({"error": "Event not found or no volunteers to remove"}), 404

@events_bp.route("/created-by/<user_id>", methods=["GET"])
def get_events_created_by_user(user_id):
    events = list(event_collection.find({"createdBy": user_id}))
    return jsonify([serialize_event(e) for e in events]), 200
