from pinecone import Pinecone, ServerlessSpec
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

PINECONE_API_KEY=os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME=os.getenv("PINECONE_INDEX_NAME")

pc = Pinecone(api_key=PINECONE_API_KEY)
index_name = PINECONE_INDEX_NAME

index = pc.Index(index_name)

def search_companies(news_text, top_k=5):
    news_embedding = pc.inference.embed(
            model="multilingual-e5-large",
            inputs=[news_text],
            parameters={"input_type": "passage", "truncate": "END"}
        ).data[0]['values']
    
    #query_filter = {}
    #if group_filter:
    #    query_filter["Group"] = {"$eq": group_filter}  # Example: Filter by "Tata Group"
    
    results = index.query(
        vector=news_embedding, 
        top_k=top_k,
        include_metadata=True, 
        namespace="ns1"
    )

    return [(match["id"], match["metadata"]) for match in results["matches"]]


#related_companies = search_companies_with_filters("Real estate sector is booming in India", 5)
#print(related_companies)
