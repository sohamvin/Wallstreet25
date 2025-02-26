import React, { useState, useEffect, useRef } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, X, AlertTriangle } from "lucide-react";
import { stockService, portfolioService } from "../services/apis";
import { toast } from "react-toastify";
import "./BuyModal.css";

const BuyModal = ({ id, name, price, socketPrice, onClose }) => {
  // console.log("ID:", id);
  // console.log("Name:", name);
  // console.log("Initial Price:", price);
  // console.log("Socket Price:", socketPrice);

  const [qty, setQty] = useState(0);
  // bidPrice reflects the continuously updated price from the socket
  const [bidPrice, setBidPrice] = useState(socketPrice);
  // Store buyprice as a string to allow empty input; initialize with socketPrice.
  const [buyprice, setBuyprice] = useState(String(socketPrice));
  const [showCircuitWarning, setShowCircuitWarning] = useState(false);
  const [cash, setCash] = useState(0);
  const [value, setvalue] = useState(price);

  // Calculate the dynamic 24h change relative to the initial price prop
  const dynamicPriceChange = ((bidPrice - price) / price) * 100;
  const isPositive = dynamicPriceChange >= 0;
  const totalValue = (parseFloat(buyprice) || 0) * qty;
  
  // Fetch available cash on mount
  useEffect(() => {
    portfolioService
      .getCash()
      .then((paisa) => setCash(paisa.cash))
      .catch((err) => toast.error("Error fetching cash", err));
  }, []);

  // Update bidPrice when socketPrice changes
  useEffect(() => {
    setBidPrice(socketPrice);
  }, [socketPrice]);

  // If the user hasn't modified the bid price (i.e. it's still the previous socketPrice), update it.
  const prevSocketPriceRef = useRef(socketPrice);
  useEffect(() => {
    if (buyprice === String(parseFloat(prevSocketPriceRef.current).toFixed(2))) {
      setBuyprice(String(socketPrice));
    }
    prevSocketPriceRef.current = socketPrice;

  }, [socketPrice, buyprice]);

  // Check for circuit limit violation when buyprice or bidPrice changes
  useEffect(() => {
    if ( buyprice === "") return;
    const userPrice = parseFloat(buyprice);
    if (isNaN(userPrice)) return;
    const priceDifference = Math.abs(userPrice - price);
    const percentageDifference = (priceDifference / price) * 100;
    setShowCircuitWarning(percentageDifference >= 12);
  }, [ buyprice]);

  const handleBuy = (e) => {
    e.preventDefault();
    const tid = toast.loading("Please wait...");
    // Convert buyprice to a number for the API call
    const buyOrderData = { price: parseFloat(buyprice) || 0, quantity: qty, companyName: name };

    stockService
      .buyStock(id, buyOrderData)
      .then(() => {
        toast.update(tid, {
          render: "Buy order placed successfully!",
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
          render: err.data.detail,
          type: "error",
          isLoading: false,
          autoClose: 2300,
        });
      });
  };

  return (
    <div className="buy-modal-overlay" onClick={onClose}>
      <div className="buy-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">Buy {name}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="price-info">
            <div className="price-box">
              <p className="price-label">Current Price</p>
              <p className="price-value">{`₹ ${Number(bidPrice).toFixed(2)}`}</p>
            </div>
            <div className="price-box">
              <p className="price-label">24h Change</p>
              <p className={`price-change ${isPositive ? "positive" : "negative"}`}>
                {isPositive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                {Math.abs(dynamicPriceChange).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Circuit Limit Warning */}
          {showCircuitWarning && (
            <div className="circuit-warning">
              <AlertTriangle size={20} className="warning-icon" />
              <p>Price has crossed the circuit limit according to credenz stock exchange</p>
            </div>
          )}

          <div className="order-form">
            <div className="form-group">
              <label>Bid Price (₹)</label>
              <input
                type="number"
                step="1"
                value={buyprice}
                onChange={(e) => setBuyprice(e.target.value)}
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

        {/* Summary */}
        <div className="modal-summary">
          <div className="summary-row">
            <div className="summary-label">
              <Wallet size={20} /> Cash
            </div>
            <div className="summary-value">{`₹ ${Number(cash).toFixed(2)}`}</div>
          </div>
          <div className="summary-row">
            <div className="summary-label">Total Value</div>
            <div className="summary-value">{`₹ ${Number(totalValue).toFixed(2)}`}</div>
          </div>
        </div>

        {/* Footer / Action */}
        <div className="modal-footer">
          <button
            type="button"
            className="action-button"
            onClick={handleBuy}
            disabled={totalValue > cash || qty <= 0 || showCircuitWarning}
          >
            {totalValue > cash 
              ? "Insufficient Funds" 
              : showCircuitWarning 
                ? "Circuit Limit Exceeded" 
                : "Place Buy Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyModal;
