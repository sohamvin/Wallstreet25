import random
import google.generativeai as genai
import os
from dotenv import load_dotenv
import os
import random
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


# Load environment variables from .env file
load_dotenv()

# Gemini API Keys
GEMINI_KEYS = [
    os.getenv("GEMINI_API_KEY1"),
    os.getenv("GEMINI_API_KEY2"),
    os.getenv("GEMINI_API_KEY3")
]

LAST_INDEX_FILE = "last_api_index.txt"

def get_next_api_key():
    """Retrieve the next API key using round-robin logic."""
    try:
        with open(LAST_INDEX_FILE, "r") as f:
            last_index = int(f.read().strip())
    except (FileNotFoundError, ValueError):
        last_index = -1  # Default to -1 so the first index starts at 0
    
    for _ in range(len(GEMINI_KEYS)):
        next_index = (last_index + 1) % len(GEMINI_KEYS)
        with open(LAST_INDEX_FILE, "w") as f:
            f.write(str(next_index))
        
        if GEMINI_KEYS[next_index]:
            return GEMINI_KEYS[next_index]
        
        last_index = next_index
    
    return None  # If all keys are invalid

def configure_genai():
    """Configure Gemini API with a valid key."""
    for _ in range(len(GEMINI_KEYS)):
        api_key = get_next_api_key()
        if api_key:
            try:
                genai.configure(api_key=api_key)
                return True
            except Exception:
                continue
    return False

if not configure_genai():
    print("All API keys failed. No request will be made.")

# GEMINI_API_KEY1 = os.getenv("GEMINI_API_KEY1")
# # GEMINI_API_KEY2 = os.getenv("GEMINI_API_KEY2")
# # GEMINI_API_KEY3 = os.getenv("GEMINI_API_KEY3")

# # Configure Gemini API
# genai.configure(api_key=GEMINI_API_KEY1)

# News Categories
industries = ["Energy", "Automobile", "Financial Services", "Metals & Mining", "Infrastructure & Construction", "Manufacturing", "Transport & Hospitality"]
locations = ["New Delhi", "Mumbai", "Chennai", "Bangalore", "Kolkata", "Hyderabad", "Gujarat", "Rajasthan"]
natural_events = ["Earthquake", "Hurricane", "Economic Recession", "Geopolitical Conflict", "Pandemic"]
government_schemes = [
    "PM Surya Ghar Muft Bijli Yojana",
    "Pradhan Mantri Sahaj Bijli Har Ghar Yojana (SAUBHAGYA)",
    "Deen Dayal Upadhyaya Gram Jyoti Yojana (DDUGJY)",
    "National Solar Mission",
    "Renewable Energy Integration",
    "Production Linked Incentive (PLI) Scheme",
    "Faster Adoption and Manufacturing of Hybrid and Electric Vehicles (FAME)",
    "One India, One Ticket Initiative"
]
trade_news = ["New Free Trade Agreement", "Rising Export Tariffs", "Foreign Direct Investment Surge", "Supply Chain Disruptions"]
geopolitical_issues = ["US-China Trade War", "Middle East Energy Crisis", "European Union Market Shifts", "Sanctions on Emerging Markets"]
sentiments = ["Positive", "Negative", "Neutral"]

def generate_news():
    # Select industries, locations & geopolitical factors
    industry_news = random.sample(industries, 2)
    location_news = random.sample(locations, 2)
    event_news = random.choice(natural_events) if random.random() < 0.3 else None
    gov_scheme = random.choice(government_schemes) if random.random() < 0.4 else None
    trade_news_event = random.choice(trade_news) if random.random() < 0.5 else None
    geopolitical_news = random.choice(geopolitical_issues) if random.random() < 0.35 else None
    chosen_sentiment = random.choice(sentiments)

    # Construct refined news prompt
    news_prompt = f"""
    Generate a {chosen_sentiment.lower()} news article covering:
    
    1. Major developments in the {industry_news[0]} and {industry_news[1]} sectors.
    2. Include specific locations: {location_news[0]} and {location_news[1]}.
    3. If applicable, mention how a {event_news} has impacted these industries.
    4. Discuss how the government scheme "{gov_scheme}" is affecting these sectors and what changes it brings.
    5. Include trade-related updates, if relevant, covering "{trade_news_event}".
    6. Analyze the geopolitical situation "{geopolitical_news}" and its influence on industries.
    7. Makes sure to not use names of any real companies or CEOS or personalities of any companies.
    8. You can use use locations or industries or goverment schemes or public leaders , presidents etc. 
    9. you can use names of companies in {companies}, which are fake, but not the names of real companies.
    
    **Response format must include:**
    - A specific **news headline** (not generic)
    - A detailed **news article (150-200 words)** 
    - **Mention real locations**, industries, and projects but not companies or personalities
    - **Connect the government scheme to a real-world industry impact**
    - Ensure the sentiment is clearly reflected as {chosen_sentiment.lower()}.
    
    **Tips:**
    - Ensure the headline and article are separated by exactly one instance of "\n\n" and no extra markers are included.
-   - The remainder of the text should be a continuous news article without any additional labels or extra newline separators (do not include phrases like "**News Article:**")
    
    """

    # Generate content with Gemini AI
    model = genai.GenerativeModel("gemini-1.5-flash")
    try:
        news_response = model.generate_content(news_prompt)
        news_text = news_response.text
    except Exception:
        print("Failed to generate news content.")
        return None

    return {
        "industries": industry_news,
        "locations": location_news,
        "event": event_news,
        "government_scheme": gov_scheme,
        "trade": trade_news_event,
        "geopolitics": geopolitical_news,
        "sentiment": chosen_sentiment,
        "news": news_text
    }

# Example Usage
news_data = generate_news()
