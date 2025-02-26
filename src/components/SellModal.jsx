import React, { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, PieChart, X, AlertTriangle } from "lucide-react";
import { stockService } from "../services/apis"; // API service for placing sell orders
import { toast } from "react-toastify";
import socketService from "../services/socket.js"; // WebSocket service for live market updates
import "./SellModal.css";

const SellModal = ({ id, name, price, price_change, shares, onClose }) => {
  // Log initial props
  useEffect(() => {
    // console.log("ID:", id);
    // console.log("Name:", name);
    // console.log("Current Price:", price);
    // console.log("Price Change:", price_change);
    // console.log("Shares:", shares);
    // console.log("OnClose Function:", onClose);
  }, [id, name, price, price_change, shares, onClose]);

  const [sellPrice, setSellPrice] = useState(price);
  // Store sp as a string to allow free editing and empty value
  const [sp, setsp] = useState(String(price));
  const [qty, setQty] = useState(0); // Quantity of shares user wants to sell
  const [holds, setholds] = useState(0); // Holds fetched current holdings

  const [showCircuitWarning, setShowCircuitWarning] = useState(false);
  // Track focus state for sp input so we can format only when not editing
  const [isSpFocused, setIsSpFocused] = useState(false);

  // Calculate dynamic price change and other metrics
  const dynamicPriceChange = ((sellPrice - price) / price) * 100;
  const isPositive = dynamicPriceChange >= 0;
  const totalValue = (parseFloat(sp) || 0) * qty;

  // Handle WebSocket connection for live market updates
  useEffect(() => {
    socketService.connect();
    socketService.subscribeToCompany(name);

    const handleMarketUpdate = (data) => {
      setSellPrice(Number(data.price));
    };

    socketService.onMarketUpdate(handleMarketUpdate);

    return () => {
      socketService.removeListeners();
      socketService.disconnect();
    };
  }, [name]);

  // Fetch the current holdings from the API
  useEffect(() => {
    stockService.getQuantity(name)
      .then((res) => {
        // console.log("Quantity from API:", res.quantity);
        setholds(res.quantity);
      })
      .catch((err) => {
        toast.error("Please login again");
      });
  }, [name]);

  // Check for circuit limit violation
  useEffect(() => {
    const spValue = parseFloat(sp);
    if (!sp || spValue === 0 || qty === 0) return;
    
    const priceDifference = Math.abs(spValue - price);
    const percentageDifference = (priceDifference / price) * 100;
    
  
    
    
    if (percentageDifference >= 12 ) {
      setShowCircuitWarning(true);
    } else {
      setShowCircuitWarning(false);
    }
  }, [sp, qty, shares]);

  // Function to handle sell order submission
  const handleSell = (e) => {
    e.preventDefault();
    const tid = toast.loading("Processing your order...");
    const sellOrderData = { price: parseFloat(sp) || 0, quantity: qty, companyName: name };

    stockService
      .sellStock(id, sellOrderData)
      .then(() => {
        toast.update(tid, {
          render: "Sell order placed successfully! 💰",
          type: "success",
          isLoading: false,
          autoClose: 2300,
        });
        onClose();
        setTimeout(() => {
          window.location.href = "/portfolio";
        }, 1000);
      })
      .catch((err) => {
        toast.update(tid, {
          render: err.data?.detail || "Failed to place order",
          type: "error",
          isLoading: false,
          autoClose: 2300,
        });
      });
  };

  return (
    <div className="sell-modal-overlay" onClick={onClose}>
      <div className="sell-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">Sell {name}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="price-info">
            <div className="price-box">
              <p className="price-label">Current Price</p>
              <p className="price-value">{`${Number(sellPrice).toFixed(2)}`}</p>
            </div>
            <div className="price-box">
              <p className="price-label">24h Change</p>
              <p className={`price-change ${isPositive ? "positive" : "negative"}`}>
                {isPositive ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
                {Math.abs(dynamicPriceChange).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Circuit Limit Warning */}
          {showCircuitWarning && (
            <div className="circuit-warning">
              <AlertTriangle size={20} className="warning-icon" />
              <p>
                {totalValue > sellPrice * shares * 1.5
                  ? "Order value exceeds the allowed limit for your holdings"
                  : "Price has crossed the circuit limit according to credenz stock exchange"}
              </p>
            </div>
          )}

          {/* Order Form */}
          <div className="order-form">
            <div className="form-group">
              <label>Sell Price </label>
              <input
                type="number"
                step="0.01"
                value={
                  isSpFocused
                    ? sp
                    : sp !== ""
                      ? parseFloat(sp).toFixed(2)
                      : ""
                }
                onFocus={() => setIsSpFocused(true)}
                onBlur={() => {
                  setIsSpFocused(false);
                  if (sp !== "") {
                    setsp(parseFloat(sp).toFixed(2));
                  }
                }}
                onChange={(e) => setsp(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={qty || ""}
                onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
                min="1"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Holdings Summary */}
        <div className="modal-summary">
          <div className="summary-row">
            <div className="summary-label">
              <PieChart size={20} />
              <span>Current Holdings</span>
            </div>
            <div className="summary-value">{`${holds} shares`}</div>
          </div>
          <div className="summary-row">
            <div className="summary-label">Total Value</div>
            <div className="summary-value">{`${Number(totalValue).toFixed(2)}`}</div>
          </div>
        </div>

        {/* Modal Footer / Action Button */}
        <div className="modal-footer">
          <button
            onClick={handleSell}
            disabled={qty > holds || qty <= 0 || showCircuitWarning}
            className="action-button"
          >
            {qty > holds 
              ? "Insufficient Shares" 
              : showCircuitWarning 
                ? "Circuit Limit Exceeded" 
                : "Place Sell Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellModal;
