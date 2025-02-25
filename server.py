from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from stock_prediction import predict_stock_movement
from typing import List
from search_pinecone import search_companies
from generate_news import generate_news
from pymongo import MongoClient
import os
from datetime import datetime
import redis
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
client = None

def connect_to_mongo():
    global client
    try:
        client = MongoClient(MONGO_URI)
        db = client["news"]  # ✅ Updated database name
        global news_collection
        news_collection = db["news-articles"]  # ✅ Updated collection name
        print("✅ MongoDB connected successfully!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        exit(1)

def connect_to_redis():
    global redis_client
    try:
        redis_client = redis.Redis(host='localhost', port=6379, db=0)
        print("✅ Redis connected successfully!")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        exit(1)

# Connect to MongoDB and Redis before starting the FastAPI app
connect_to_mongo()
connect_to_redis()

app = FastAPI()

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/news_feed")
def get_news_feed():
    news_feed = list(news_collection.find({}, {"_id": 0}))  # Exclude ObjectId
    return {"news_feed": news_feed}
