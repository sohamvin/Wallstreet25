import os
import json
import redis

# Get the list of companies from an environment variable or use a default list.
companies = {
    "Titanium_Consultancy_Services": 450,
    "NextGen_Tech_Solutions": 201,
    "HCL_Systems": 177,
    "W-Tech_Limited": 109,
    "BHLIMindtree_Limited": 423,
    "Clipla_Limited": 101,
    "BondIt_Industries_Limited": 119,
    "Helio_Pharma_Industries_Limited": 121,
    "Alpha_Corporation_Limited": 203,
    "SR_Chemicals_and_Fibers_Limited": 370,
    "Avani_Power_Limited": 202,
    "AshLey_Motors_Limited": 42,
    "Legacy_Finance_Limited": 1225,
    "Legacy_Finserv_Limited": 1456,
    "Legacy_Holdings_and_Investment_Limited": 1500,
    "Chola_Capital_Limited": 379,
    "GZ_Industries_Limited": 215,
    "RailConnect_India_Corporation_Limited": 156,
    "JFS_Capital_Limited": 215,
    "JFW_Steel_Limited": 568,
    "LarTex_and_Turbo_Limited": 456,
    "HPCI_Limited": 34,
    "TPCI_Limited": 125,
    "PowerFund_Corporation_Limited": 288,
    "Bharat_Steel_Works_Limited": 99,
    "SG_Capital_Limited": 157,
    "Shriram_Money_Limited": 456,
    "Titanium_Motors_Limited": 234,
    "Titan_Tubes_Investments_Limited": 345,
    "Titanium_Steel_Limited": 568
}

print(companies)



# Connect to Redis (adjust host/port as necessary)
r = redis.Redis(host='localhost', port=6379, db=0)

# Process each company
for company, priceof in companies.items():
    # Try to get the company's key from Redis
    value = r.get(company)
    
    # Default price value
    price = priceof
    if value:
        try:
            # Decode bytes to string if necessary and load the JSON data
            data = json.loads(value.decode('utf-8'))
            # Extract price from the data (defaulting to 100 if not present)
            price = data.get('price', priceof)
        except Exception as e:
            print(f"Error processing data for {company}: {e}")
            # If there's an error parsing, keep the default price
    
    # Set the <company>:open key to the determined price
    r.set(f"{company}:open", price)
    print(f"Set {company}:open to {price}")
