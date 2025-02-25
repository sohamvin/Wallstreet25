import random

def predict_stock_movement(companies, news_data):
    predictions = {}

    for company_id, metadata in companies:
        market_cap = metadata.get("MarketCap", "Not mentioned").lower()
        if "lakh crore" in market_cap or "trillion" in market_cap:
            volatility_factor = 0.8
        elif "billion" in market_cap or "crore" in market_cap:
            volatility_factor = 1.2
        else:
            volatility_factor = 1.5

        geopolitical_exposure = metadata.get("Geopolitical Exposure", "").lower()
        geopolitical_risk = any(
            geo.lower() in geopolitical_exposure for geo in (news_data.get("geopolitics") or [])
        )
        geo_factor = -3 if geopolitical_risk else 0

        location_match = any(
            loc.lower() in metadata.get("Locations", "").lower() for loc in (news_data.get("locations") or [])
        )
        location_factor = 2 if location_match else 0

        government_schemes = metadata.get("Government Schemes", "").lower()
        gov_scheme_match = any(
            scheme.lower() in government_schemes for scheme in (news_data.get("government_scheme") or [])
        )
        gov_scheme_factor = 2 if gov_scheme_match else -2

        trade_exposure = metadata.get("Foreign Trade Exposure", "").lower()
        trade_factor = 0
        if news_data.get("trade"):
            for trade_entry in trade_exposure.split(","):
                parts = trade_entry.strip().split(" ")
                if len(parts) > 1 and parts[0] in news_data.get("trade", "").lower():
                    try:
                        percentage = int(parts[1].replace("%", ""))
                        trade_factor -= percentage / 10  # Scale the impact
                    except ValueError:
                        pass

        sector_risks = metadata.get("Sector Risks", "").lower().split(", ")
        risk_factors = len(sector_risks)

        # 🔹 NEW: Conglomerate & Investment Holding Adjustment
        is_conglomerate = "conglomerate" in metadata.get("Sector", "").lower()
        is_investment_holding = "investment" in metadata.get("Subsector", "").lower()

        sentiment = news_data.get("sentiment", "").lower()
        sentiment_factor = -2 if sentiment == "negative" else (2 if sentiment == "positive" else 0)

        # Apply corrections for conglomerates & investment holdings
        conglomerate_factor = -3 if is_conglomerate and location_match else 0
        investment_factor = -3 if is_investment_holding and "financial" in news_data.get("industries", []) else 0

        base_prediction = (
            random.randint(1, 10) - (risk_factors * 1.5) + geo_factor + gov_scheme_factor
            + location_factor + trade_factor + sentiment_factor + conglomerate_factor + investment_factor
        )
        final_prediction = max(-10, min(10, base_prediction * volatility_factor))
        predictions[company_id] = final_prediction

    return predictions
