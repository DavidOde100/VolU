from flask import Blueprint, jsonify
from app.database import users_collection

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("lib/api/volunteers", methods=["GET"])
def get_all_volunteers():
    volunteers = users_collection.find({"role": "volunteer"})
    result = []
    for v in volunteers:
        result.append({
            "id": str(v["_id"]),
            "fullName": f'{v.get("firstName", "")} {v.get("lastName", "")}',
            "email": v.get("email"),
            "role": v.get("role"),
            "joined": v.get("createdAt", ""),
        })
    return jsonify(result), 200