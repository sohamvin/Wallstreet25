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

# @app.post("/generate_news")
# def generate_news_endpoint():
#     news_data = generate_news()
#     print("News generated:", news_data)
    
#     # Store news in MongoDB
#     news_id = news_collection.insert_one({"news": news_data, "time": datetime.now()}).inserted_id
#     print(f"News stored with ID: {news_id}")
    
#     # Get stock prediction
#     stock_predictions = get_stock_prediction_endpoint(news_data)
    
#     # Extract actual predictions dictionary
#     predictions_dict = stock_predictions.get("predictions", {})  # Extract only the 'predictions' key

#     # Convert predictions to Redis message format
#     for company, score in predictions_dict.items():
#         message = {
#             "sector": [company.replace("_", " ").title()],  # Convert to readable company name
#             "sentiment": "positive" if score >= 0 else "negative",
#             "severity": abs(score)  # Keep score absolute for severity
#         }

#         # Publish to Redis channel
#         redis_client.publish("news_channel", json.dumps(message))
#         print(f"📡 Published to Redis: {message}")
    
#     return {"news": news_data, "predictions": stock_predictions}

# @app.post("/predict")
# def get_stock_prediction_endpoint(news_data: dict):
#     companies = search_companies(news_data["news"]) 
#     print("Companies found:", companies)
#     stock_predictions = predict_stock_movement(companies, news_data)
#     return { "predictions": stock_predictions }

@app.get("/news_feed")
def get_news_feed():
    news_feed = list(news_collection.find({}, {"_id": 0}))  # Exclude ObjectId
    return {"news_feed": news_feed}
