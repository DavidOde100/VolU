from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    start_time = db.Column(db.String, nullable=True)
    end_time = db.Column(db.String, nullable=True)
    created_by = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    participations = db.relationship("Participation", backref="event", lazy=True)

class Participation(db.Model):
    __tablename__ = "participation"

    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String, nullable=False)
    event_id = db.Column(db.String, db.ForeignKey("events.id"), nullable=False)
    role = db.Column(db.String, nullable=True)
    status = db.Column(db.String, nullable=False, default="Registered")
    feedback = db.Column(db.Text, nullable=True)
    hours_logged = db.Column(db.Float, default=0.0)
    hours_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    event = db.relationship("Event", backref=db.backref("participation_records", lazy=True))
