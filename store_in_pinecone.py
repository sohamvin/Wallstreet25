import json
from pinecone import Pinecone, ServerlessSpec
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

PINECONE_API_KEY=os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME=os.getenv("PINECONE_INDEX_NAME")

# Initialize pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index_name = PINECONE_INDEX_NAME

index = pc.Index(index_name)

# Load company metadata from file
with open("backend/txt_files/companies_final_data.txt", "r", encoding="utf-8") as file:
    companies = json.load(file)

# Function to preprocess metadata into text format
def preprocess_metadata(company):
    
    metadata_text = f"Company: {company['Company']}. "
    metadata_text += f"Sector: {company['Sector']}, Subsector: {company['Subsector']}. "
    metadata_text += f"Group: {company.get('Group', 'Not mentioned')}. "
    metadata_text += f"Locations: {', '.join(company.get('Locations', []))}. "
    metadata_text += f"CEO: {company.get('CEO', 'Not mentioned')}. "
    metadata_text += f"MarketCap: {company.get('MarketCap', 'Not mentioned')}. "
    metadata_text += f"Revenue: {company.get('Revenue', 'Not mentioned')}. "
    metadata_text += f"Net Profit: {company.get('Net_Profit', 'Not mentioned')}. "
    metadata_text += f"Debt Exposure: {company.get('Debt_Exposure', 'Not mentioned')}. "
    metadata_text += f"Foreign Investment: {company.get('Foreign_Investment', 'Not mentioned')}. "
    
    # Foreign Trade Exposure
    foreign_exposure = ", ".join([f"{trade['Country']} ({trade['Percentage']})" for trade in company.get("Foreign_Trade_Exposure", [])])
    metadata_text += f"Foreign Trade Exposure: {foreign_exposure if foreign_exposure else 'Not mentioned'}. "
    
    metadata_text += f"Sector Risks: {', '.join(company.get('Sector_Risks', []))}. "
    metadata_text += f"Inflation Risk: {company.get('Inflation_Risk', 'Not mentioned')}. "
    metadata_text += f"Interest Rate Sensitivity: {company.get('Interest_Rate_Sensitivity', 'Not mentioned')}. "
    metadata_text += f"Green Energy Focus: {company.get('Green_Energy_Focus', 'Not mentioned')}. "
    
    # Government Schemes
    schemes = ", ".join(company.get("Government_Schemes_Involvement", []))
    metadata_text += f"Government Schemes: {schemes if schemes else 'Not mentioned'}. "
    
    metadata_text += f"Loan Book Size: {company.get('Loan_Book_Size', 'Not mentioned')}. "
    
    # Major Funding Sources
    funding_sources = ", ".join(company.get("Major_Funding_Sources", []))
    metadata_text += f"Major Funding Sources: {funding_sources if funding_sources else 'Not mentioned'}. "
    
    # Geopolitical Exposure
    geo_exposure = ", ".join(company.get("Geopolitical_Exposure", []))
    metadata_text += f"Geopolitical Exposure: {geo_exposure if geo_exposure else 'Not mentioned'}. "
    
    metadata_text += f"ESG Rating: {company.get('ESG_Rating', 'Not mentioned')}. "
    
    # Expansion Plans
    expansion = ", ".join(company.get("Expansion_Plans", []))
    metadata_text += f"Expansion Plans: {expansion if expansion else 'Not mentioned'}. "
    
    # Public Sector
    metadata_text += f"Company: {company['Public_Sector']}. "

    # Recent Financial Performance
    if 'Recent_Financial_Performance' in company:
        for quarter, details in company['Recent_Financial_Performance'].items():
            metadata_text += f"{quarter}: Net Sales: {details.get('Net_Sales', 'Not mentioned')}, "
            metadata_text += f"Year-over-Year Growth: {details.get('Year_over_Year_Growth', 'Not mentioned')}, "
            metadata_text += f"Net Profit: {details.get('Net_Profit', 'Not mentioned')}, "
            metadata_text += f"Profit Growth: {details.get('Profit_Growth', 'Not mentioned')}. "

    if 'fundamentals' in company:
        fundamentals_text = ", ".join([f"{key}: {value}" for key, value in company['fundamentals'].items()])
        metadata_text += f"Fundamentals: {fundamentals_text}. "

    return metadata_text

# Store metadata in Pinecone
def store_companies_in_pinecone(companies):

    for company in companies:
        metadata_text = preprocess_metadata(company)
        
        embedding = pc.inference.embed(
            model="multilingual-e5-large",
            inputs=[metadata_text],
            parameters={"input_type": "passage", "truncate": "END"}
        )
        
        # Generate Embedding (Text-Only Storage)
        vectors = [{
            "id": company["Company"].replace(" ", "_").lower(),
            "values": embedding.data[0]['values'],  # Pinecone expects numerical values, but storing text only
            "metadata": {'text': metadata_text}
        }]
        
        index.upsert(
            vectors=vectors,
            namespace="ns1"
        )

store_companies_in_pinecone(companies)
print("Extended company metadata stored successfully!")
