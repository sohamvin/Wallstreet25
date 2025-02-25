import random
import os
import json
import redis
from datetime import datetime
from pymongo import MongoClient
from stock_prediction import predict_stock_movement
from search_pinecone import search_companies
from generate_news import generate_news
from dotenv import load_dotenv
import time
import pytz
from dotenv import load_dotenv
import os
ist = pytz.timezone('Asia/Kolkata')
current_time = datetime.now(ist) 

# Load environment variables from .env file
load_dotenv()


companies = [
    "Titanium Consultancy Services",
    "NextGen Tech Solutions",
    "HCL Systems",
    "W-Tech Limited",
    "BHLIMindtree Limited",
    "Clipla Limited",
    "BondIt Industries Limited",
    "Helio Pharma Industries Limited",
    "Alpha Corporation Limited",
    "SR Chemicals and Fibers Limited",
    "Avani Power Limited",
    "AshLey Motors Limited",
    "Legacy Finance Limited",
    "Legacy Finserv Limited",
    "Legacy Holdings and Investment Limited",
    "Chola Capital Limited",
    "GZ Industries Limited",
    "RailConnect India Corporation Limited",
    "JFS Capital Limited",
    "JFW Steel Limited",
    "LarTex and Turbo Limited",
    "HPCI Limited",
    "TPCI Limited",
    "PowerFund Corporation Limited",
    "Bharat Steel Works Limited",
    "SG Capital Limited",
    "Shriram Money Limited",
    "Titanium Motors Limited",
    "Titan Tubes Investments Limited",
    "Titanium Steel Limited"
]



def spaces_to_underscores(text: str) -> str:
    return text.replace(" ", "_")

comps = [spaces_to_underscores(company) for company in companies]

companies = comps

companyToLower = {
    
}

for company in companies:
    companyToLower[company.lower()] = company
    

def normalize_company_name(name):
    """
    Normalize the company name by:
      - Converting to lower case.
      - Replacing '&' with 'and'.
      - Replacing 'ltd.' or 'ltd' with 'limited'.
    """
    norm = name.lower()
    norm = norm.replace("&", "and")
    norm = norm.replace("ltd.", "limited")
    norm = norm.replace("ltd", "limited")
    return norm

# Example usage
MONGO_URI = os.getenv("MONGO_URI")

ist = pytz.timezone('Asia/Kolkata')

client = None

def connect_to_mongo():
    global client
    try:
        client = MongoClient(MONGO_URI)
        db = client["news"]
        global news_collection
        news_collection = db["news-articles"]
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

# Connect to MongoDB and Redis
connect_to_mongo()
connect_to_redis()

# List of companies
list_of_companies = [
    "Google", "Facebook", "Instagram", "Spotify", "Dropbox",
    "Reddit", "Netflix", "Pinterest", "Quora", "YouTube",
    "Lyft", "Uber", "LinkedIn", "Slack", "Etsy",
    "Mozilla", "NASA", "IBM", "Intel", "Microsoft"
]

def generate_news_task():
    news_data = generate_news()
    print("📰 News generated:", news_data)
    
    # Store news in MongoDB
    news_id = news_collection.insert_one({"news": news_data, "time": current_time.strftime("%Y-%m-%d %H:%M:%S"),}).inserted_id
    # print(f"📌 News stored with ID: {news_id}")
    
    # Get stock predictions
    stock_predictions = get_stock_prediction(news_data)
    
    # Extract actual predictions dictionary
    predictions = stock_predictions["predictions"]
    # print("📊 Stock Predictions:", predictions)
    
    # Map each company in predictions to a random company from list_of_companies
    mapped_companies = dict(zip(predictions.keys(), random.sample(list_of_companies, len(predictions))))

    
    
    # Convert predictions to Redis message format
    for original_company, mapped_company in mapped_companies.items():
        score = predictions[original_company]  # Use the actual prediction score
        sentiment = "positive" if score >= 0 else "negative"
        
        original_company = normalize_company_name(original_company)
        
        if original_company in companyToLower:
            print("🔍 Company found:", original_company, f" and {companyToLower[original_company]}")
  
# "{\"sector\": [\"Google\"], \"sentiment\": \"positive\", \"severity\": 8}"

# "{\"original_company\": \"titanium_steel_limited\", \"sector\": \"IBM\", \"sentiment\": \"positive\", \"severity\": 5.25}"
# "{\"original_company\": \"railconnect_india_corporation_ltd.\", \"sector\": [\"Etsy\"], \"sentiment\": \"positive\", \"severity\": 5.25}"

        company_list = [companyToLower[original_company]]
        
        message = {
            "original_company": [original_company],  # The actual company from predictions
            "sector": company_list,  # The randomly assigned company
            "sentiment": sentiment,
            "severity": abs(score) if abs(score) > 5 else 5  # Keep score absolute for severity
        }

        # Publish to Redis channel
        redis_client.publish("news_channel", json.dumps(message))
        print(f"📡 Published to Redis: {message}")
        time.sleep(3)

def get_stock_prediction(news_data: dict):
    companies = search_companies(news_data["news"]) 
    # print("🔍 Companies found:", companies)
    stock_predictions = predict_stock_movement(companies, news_data)
    return {"predictions": stock_predictions}

# Run the function
if __name__ == "__main__":
    generate_news_task()
