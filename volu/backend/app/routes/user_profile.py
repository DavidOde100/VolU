from flask import Blueprint, request, jsonify
from bson import ObjectId
from app.database import user_collection

user_profile_bp = Blueprint("user_profile", __name__, url_prefix="/api/user-profile")

# Helper to serialize MongoDB document
def serialize_user(user_doc):
    if user_doc:
        user_doc["_id"] = str(user_doc["_id"])
    return user_doc

@user_profile_bp.route("/<user_id>", methods=["GET"])
def get_user_profile(user_id):
    user = user_collection.find_one({"userId": user_id})
    return jsonify(serialize_user(user) if user else {}), 200

@user_profile_bp.route("/<user_id>/personal-info", methods=["PUT"])
def update_personal_info(user_id):
    data = request.get_json()
    user_collection.update_one(
        {"userId": user_id},
        {"$set": {"personalInfo": data}},
        upsert=True
    )
    return jsonify({"message": "Personal info updated"}), 200

@user_profile_bp.route("/<user_id>/skills", methods=["PUT"])
def update_skills(user_id):
    data = request.get_json()
    user_collection.update_one(
        {"userId": user_id},
        {"$set": {"skills": data}},
        upsert=True
    )
    return jsonify({"message": "Skills updated"}), 200

@user_profile_bp.route("/<user_id>/preferences", methods=["PUT"])
def update_preferences(user_id):
    data = request.get_json()
    user_collection.update_one(
        {"userId": user_id},
        {"$set": {"preferences": data}},
        upsert=True
    )
    return jsonify({"message": "Preferences updated"}), 200

@user_profile_bp.route("/<user_id>/availability", methods=["PUT"])
def update_availability(user_id):
    data = request.get_json()
    user_collection.update_one(
        {"userId": user_id},
        {"$set": {"availability": data}},
        upsert=True
    )
    return jsonify({"message": "Availability updated"}), 200

@user_profile_bp.route("/<user_id>/account-settings", methods=["PUT"])
def update_account_settings(user_id):
    data = request.get_json()
    user_collection.update_one(
        {"userId": user_id},
        {"$set": {"accountSettings": data}},
        upsert=True
    )
    return jsonify({"message": "Account settings updated"}), 200

@user_profile_bp.route("/<user_id>", methods=["DELETE"])
def delete_user_account(user_id):
    user_collection.delete_one({"userId": user_id})
    return jsonify({"message": "User deleted"}), 200

