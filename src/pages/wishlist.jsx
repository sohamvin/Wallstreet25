import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThreeDots } from "react-loader-spinner";
import { stockService, wishlistService } from "../services/apis.js";
import socketService from "../services/socket.js";
import "./Wishlist.css";
import { toast } from "react-toastify";

const MyWishlist = () => {
  const [wishlist, setWishlist] = useState([]); // Wishlist stocks (transformed)
  const [livePrices, setLivePrices] = useState({}); // Live price updates keyed by stock name
  const [notification, setNotification] = useState(""); // Notification state

  // Fetch wishlist data and transform each object to match Stocks.jsx structure.
  useEffect(() => {
    wishlistService
      .getWishlist() // Fetch user's wishlist stocks
      .then((res) => {
        if (res.length === 0) {
          setWishlist([]);
        } else {
          // Transform each stock: rename "companyName" to "name" while keeping "price" as raw numeric value.
          const transformedWishlist = res.map((stock) => ({
            ...stock,
            name: stock.companyName,
            
          }));
          // console.error(transformedWishlist);

          setWishlist(transformedWishlist);
        }
      })
      .catch((err) => {
        toast.error(err);
        setWishlist([]);
      });
  }, []);

  // Setup socket connection for live price updates.
  useEffect(() => {
    if (wishlist.length === 0) return;

    socketService.connect();

    // Subscribe to updates using the "name" field.
    wishlist.forEach((stock) => {
      socketService.subscribeToCompany(stock.name);
    });

    const handleMarketUpdate = (data) => {
      let payload = data;
      // console.log("Received live update:", payload);

      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch (err) {
          // console.error("Error parsing payload:", err);
          return;
        }
      }

      // Store the live price as a raw number.
      setLivePrices((prev) => ({
        ...prev,
        [payload.company]: Number(payload.price),
      }));
    };

    socketService.onMarketUpdate(handleMarketUpdate);

    return () => {
      socketService.removeListeners();
      socketService.disconnect();
    };
  }, [wishlist]);

  // Handle adding a stock to the wishlist.
  const handleAddStock = (stock) => {
    stockService
      .addToWishlist(stock)
      .then(() => {
        setWishlist((prev) => [...prev, stock]);
        setNotification("Stock added to wishlist!");
        setTimeout(() => setNotification(""), 3000);
      })
      .catch((err) => {
        // console.error("Error adding stock to wishlist", err);
      });
  };

  return (
    <div className="wishlist-container">
      <h2 className="wishlist-heading">My Watchlist</h2>
      <p className="wishlist-subheading">Stocks you are tracking</p>

      {/* Notification Message */}
      {notification && <div className="notification">{notification}</div>}

      {/* If no wishlist items, prompt user to add stocks */}
      {wishlist.length === 0 ? (
        <div>
          <div className="add-stock-message">
            <p>No stocks in your watchlist yet.</p>
            <Link to="/stocks" className="btn-add-stock">
              Add Stocks
            </Link>
          </div>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((stock, index) => {
            // Determine the current price using live updates if available, else use the raw stock.price.
            const currentPrice =
              livePrices[stock.name] !== undefined
                ? livePrices[stock.name]
                : Number(stock.price);
            // Format the price for display (only for UI).
            const displayPrice =
              !isNaN(currentPrice) ? `${currentPrice.toFixed(2)}` : "N/A";

            return (
              <Link
                to={`/stocksdetail/${stock.name}`}
                key={stock.name}
                // Pass the transformed stock object as state (matching Stocks.jsx expectations).
                state={{ stock }}
                className="stock-card"
              >
                <div className="wishlist-card-header">
                  
                  <div >{stock.ticker}</div>
                </div>
                <div className="wishlist-info">
                  <h3>{stock.name}</h3>
                  <div className="wishlist-price">{displayPrice}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyWishlist;
