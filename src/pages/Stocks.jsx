import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThreeDots } from "react-loader-spinner";
import "./Stocks.css";
import { stockService } from "../services/apis.js";
import socketService from "../services/socket.js";
// import { FaBull, FaBear } from 'react-icons/fa';



const Stocks = () => {
  // Set stocks initial state to an empty array to simplify filtering.
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  // Live prices keyed by company name
  const [livePrices, setLivePrices] = useState({});

  // Always use dark mode (no toggle)
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Fetch initial stocks data from backend
  useEffect(() => {
    stockService
      .getStocks()
      .then((res) => {
        // Ensure each stock has a unique id
        const data = res.map((stock, index) => ({
          ...stock,
          id: stock.id || index + 1,
        }));
        // console.log(data);
        setStocks(data);
      })
      // .catch(() => console.log("Error fetching stocks"));
  }, []);

  // Setup socket connection for live price updates once stocks are loaded
  useEffect(() => {
    if (stocks.length === 0) return;

    // Connect to the socket server
    socketService.connect();

    // Subscribe to updates for each stock (using stock name as identifier)
    stocks.forEach((stock) => {
      socketService.subscribeToCompany(stock.name);
    });

    // Market update handler that updates livePrices state
    const handleMarketUpdate = (data) => {
      let payload = data;
      //  console.log("jel");
      // If payload is a string, attempt to parse it
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch (err) {
          // console.error("Error parsing payload:", err);
          return;
        }
      }
      // console.log("Market update:", payload);
      // Update state with the new price.
      // We assume payload.company matches stock.name and payload.price is a number.
      setLivePrices((prev) => ({
        ...prev,
        [payload.company]: Number(payload.price).toFixed(2),
      }));
    };

    socketService.onMarketUpdate(handleMarketUpdate);

    // Cleanup on unmount: remove listeners and disconnect
    return () => {
      socketService.removeListeners();
      socketService.disconnect();
    };
  }, [stocks]);

  // Debug: log the search query whenever it changes
  useEffect(() => {
    // console.log("Current search query:", searchQuery);
  }, [searchQuery]);

  // Improved search filtering
  const filteredStocks = stocks.filter((stock) => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    return (
      stock.name?.toLowerCase().includes(lowerQuery) ||
      stock.ticker?.toLowerCase().includes(lowerQuery)
    );
  });

  return (
    <div className="stocks-container">
      <h2 className="stocks-heading">Browse the Market</h2>
      <p className="stocks-subheading">
        Explore our selection of the biggest names in the industry.
      </p>

      {/* Search Input */}
      <input
        type="text"
        className="search-bar"
        placeholder="Search by ticker or Company name"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Loader */}
      {stocks.length === 0 ? (
        <div className="loader">
          <ThreeDots height="55" width="55" color="#5eb5f8" />
        </div>
      ) : (
        <div className="stock-grid">
          {filteredStocks.map((stock, index) => {
            // Opening price is stock.price.
            // Live price is taken from the socket if available, otherwise fallback to the opening price.
            const currentPrice =
              livePrices[stock.name] !== undefined
                ? livePrices[stock.name]
                : stock.price;
            const displayPrice =
              currentPrice !== undefined ? `${currentPrice}` : "N/A";

            // Calculate the percentage change from the opening price (stock.price)
            let changePercentage = 0;
            
            if (stock.price && currentPrice !== undefined) {
              changePercentage =
                ((currentPrice - stock.price) / stock.price) * 100;
            }
            const isPositive = changePercentage >= 0;
            const formattedChange = changePercentage.toFixed(2);

            return (
              <Link
                to={`/stocksdetail/${stock.name}`}
                key={stock.name}
                state={{stock}}
                className="stock-card"
              >
                <div className="stock-card-header">
                  
                  {/* {isPositive ? <FaBull className="bull-icon" /> : <FaBear className="bear"></FaBear> } */}
                  <div >{stock.ticker}</div>
                </div>
                <div className="stock-info">
                  <h3>{stock.name}</h3>
                  <div className="stock-price-wrapper">
                    <div className="stock-price">{displayPrice}</div>
                    <div
                      className={`stock-change ${isPositive ? "green" : "red"}`}
                    >
                      {isPositive
                        ? `+${formattedChange}%`
                        : `${formattedChange}%`}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Stocks;
