from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get MongoDB URI from environment
MONGO_URI = os.getenv("DATABASE_URL")
if not MONGO_URI:
    raise Exception("DATABASE_URL not found in .env")

# Initialize MongoDB client
client = MongoClient(MONGO_URI)

# Access your MongoDB database
db = client["volu"]

# Define and export collections
participation_collection = db["participation"]
event_collection = db["events"]
user_collection = db["users"]
notifications_collection = db["notifications"]




