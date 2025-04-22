from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from app.database import participation_collection, event_collection

participation_bp = Blueprint("participation", __name__)

# Convert MongoDB document to JSON-friendly format
def serialize_participation(p):
    p["_id"] = str(p["_id"])
    if "eventId" in p:
        p["eventId"] = str(p["eventId"])
    if "userId" in p:
        p["userId"] = str(p["userId"])
    return p

@participation_bp.route("/all", methods=["GET"])
def get_all_participation():
    try:
        limit = int(request.args.get("limit", 20))
        offset = int(request.args.get("offset", 0))
        status = request.args.get("status")

        query = {}
        if status:
            query["status"] = status

        cursor = participation_collection.find(query).skip(offset).limit(limit)
        history = [serialize_participation(doc) for doc in cursor]
        total = participation_collection.count_documents(query)

        return jsonify({"history": history, "totalCount": total, "limit": limit, "offset": offset}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@participation_bp.route("/my", methods=["GET"])
def get_my_participation():
    try:
        user_id = request.args.get("userId")
        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        status = request.args.get("status")
        limit = int(request.args.get("limit", 20))
        offset = int(request.args.get("offset", 0))

        query = { "userId": user_id }
        if status:
            query["status"] = status

        cursor = participation_collection.find(query).skip(offset).limit(limit)
        history = [serialize_participation(doc) for doc in cursor]
        total = participation_collection.count_documents(query)

        return jsonify({"history": history, "totalCount": total, "limit": limit, "offset": offset}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@participation_bp.route("/record", methods=["POST"])
def record_participation():
    try:
        data = request.json
        user_id = data.get("userId")
        event_id = data.get("eventId")
        status = data.get("status")

        if not user_id or not event_id or not status:
            return jsonify({"error": "Missing required fields"}), 400

        existing = participation_collection.find_one({
            "userId": user_id,
            "eventId": event_id
        })

        if existing:
            participation_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "status": status,
                    "updatedAt": datetime.utcnow()
                }}
            )
        else:
            participation_collection.insert_one({
                "userId": user_id,
                "eventId": event_id,
                "status": status,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            })

        return jsonify({"message": "Participation recorded"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@participation_bp.route("/log-feedback", methods=["POST"])
def log_feedback():
    try:
        data = request.json
        user_id = data.get("userId")
        event_id = data.get("eventId")
        feedback = data.get("feedback")

        if not user_id or not event_id:
            return jsonify({"error": "Missing userId or eventId"}), 400

        result = participation_collection.update_one(
            {"userId": user_id, "eventId": event_id},
            {"$set": {"feedback": feedback, "updatedAt": datetime.utcnow()}}
        )

        if result.modified_count == 0:
            return jsonify({"error": "Participation record not found"}), 404

        return jsonify({"message": "Feedback logged"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@participation_bp.route("/statistics", methods=["GET"])
def get_statistics():
    try:
        user_id = request.args.get("userId")
        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        total_hours = 0
        attended_count = 0
        upcoming_count = 0
        status_counts = {}
        events_by_month = {}
        hours_by_month = {}

        now = datetime.utcnow()
        records = participation_collection.find({"userId": user_id})

        for rec in records:
            status = rec.get("status", "Unknown")
            status_counts[status] = status_counts.get(status, 0) + 1

            if status == "Attended":
                attended_count += 1
                total_hours += rec.get("hoursLogged", 0)
            elif status == "Confirmed":
                upcoming_count += 1

            event = rec.get("event", {})
            start_date_str = event.get("startDate")
            if start_date_str:
                try:
                    start_date = datetime.fromisoformat(start_date_str)
                except Exception:
                    try:
                        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
                    except:
                        continue  # skip if date parsing fails

                month_key = start_date.strftime("%b %Y")  # e.g., 'Mar 2025'
                events_by_month[month_key] = events_by_month.get(month_key, 0) + 1
                hours_by_month[month_key] = hours_by_month.get(month_key, 0) + rec.get("hoursLogged", 0)

        # Placeholder for new notifications until implemented
        new_notifications = 0

        return jsonify({
            "totalHours": total_hours,
            "eventsAttended": attended_count,
            "upcomingEvents": upcoming_count,
            "newNotifications": new_notifications,
            "statusCounts": status_counts,
            "eventsByMonth": events_by_month,
            "hoursByMonth": hours_by_month
        }), 200

    except Exception as e:
        print("Error in /statistics:", str(e))
        return jsonify({"error": str(e)}), 500

    
@participation_bp.route("/my-history", methods=["GET"])
def get_my_participation_history():
    return get_my_participation()