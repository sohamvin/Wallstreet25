import { useEffect, useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import {
  FaWallet,
  FaChartPie,
  FaListAlt,
  FaExchangeAlt,
  FaBuilding,
  FaClipboardList,
} from "react-icons/fa";
import CompanyWisePnL from "../components/CompanyWisePnL.jsx";
import HoldingsCard from "../components/HoldingsCard.jsx";
import OrderDetails from "../components/OrderDetails.jsx";
import TransactionHistory from "../components/TransactionHistory.jsx";
import "./Portfolio.css";
import { portfolioService } from "../services/apis";
import socketService from "../services/socket.js";
import { Car } from "lucide-react";

socketService.connect();

const Portfolio = () => {
  // Consolidated net worth state variable.
  const [netWorth, setNetWorth] = useState(0);
  const [cash, setCash] = useState(0);
  // Removed duplicate networth state variable.
  // const [networth, setNetworth] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [holdings, setHoldings] = useState(null);

  const [activeTab, setActiveTab] = useState("holdings");

  const handleNetWorth = (newNetWorth) => {
    // Update the portfolio net worth by summing cash and the holdings net worth.
    setNetWorth(Number(newNetWorth) + Number(cash));
  };

  useEffect(() => {
    setTimeout(() => {
      // Fetch data from API
      /*
      fetch("YOUR_BACKEND_API_ENDPOINT/portfolio")
        .then((response) => response.json())
        .then((data) => {
          setCash(data.cash);
          setNetworth(data.networth);
          setHoldings(data.holdings);
          setTransactions(data.transactions);
          setPendingTransactions(data.pendingTransactions);
        })
        .catch((error) => console.error("Error fetching portfolio data:", error));
      */

      // Static fallback data (for development/testing)

      portfolioService.getCash().then((res) => {
        setCash(res.cash);
      });

      portfolioService.getholdingdetails().then((res) => {
        const response = res;
        for (let i = 0; i < response.length; i++) {
          response[i].stock__current_price = 185.26;
        }

        setHoldings(response);
      });

    
      //  setHoldings([
      //   {
      //     id: 1,
      //     stock__ticker: "AAPL",
      //     total_quantity: 50,
      //     avg_price: 145.3,
      //     stock__current_price: 185.45,
      //     profit_loss: 2007.5,
      //     trade_type: "delivery",
      //   },
      //   {
      //     id: 2,
      //     stock__ticker: "TSLA",
      //     total_quantity: 25,
      //     avg_price: 220.5,
      //     stock__current_price: 275.8,
      //     profit_loss: 1382.5,
      //     trade_type: "intraday",
      //   },
      //   {
      //     id: 3,
      //     stock__ticker: "MSFT",
      //     total_quantity: 40,
      //     avg_price: 245.75,
      //     stock__current_price: 310.2,
      //     profit_loss: 2578.0,
      //     trade_type: "delivery",
      //   },
      // ]);
    }, 900);
  }, []);

  return (
    <div className="portfolio-container">
      <h3 className="portfolio-title">📊 Portfolio Overview</h3>

      {/* Net Worth & Cash - Always Visible */}
      <div className="overview-cards">
        <div className="overview-card">
          <h5>
            <FaChartPie /> Net Worth
          </h5>
          <p>₹ {Number(netWorth).toFixed(2)}</p>
        </div>
        <div className="overview-card">
          <h5>
            <FaWallet /> Cash
          </h5>
          <p>₹{Number(cash).toFixed(2)}</p>
        </div>
      </div>

      {/* Navigation Tabs with Icons */}
      <div className="nav-tabs">
        <button
          className={activeTab === "holdings" ? "active" : ""}
          onClick={() => setActiveTab("holdings")}
        >
          <FaListAlt /> Holdings
        </button>
        {/* <button
          className={activeTab === "pnl" ? "active" : ""}
          onClick={() => setActiveTab("pnl")}
        >
          <FaBuilding /> Company-Wise PnL
        </button> */}
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          <FaClipboardList /> Orders
        </button>
        <button
          className={activeTab === "transactions" ? "active" : ""}
          onClick={() => setActiveTab("transactions")}
        >
          <FaExchangeAlt /> Transactions
        </button>
      </div>

      {/* Show Component Based on Selected Tab */}
      {!holdings ? (
        <div className="loader-wrapper">
          <ThreeDots height="55" width="55" color="#5eb5f8" />
        </div>
      ) : (
        <div className="component-container">
          {activeTab === "holdings" && (
            <HoldingsCard holdings={holdings} onNetWorthChange={handleNetWorth} />
          )}
          {/* {activeTab === "pnl" && <CompanyWisePnL holdings={holdings} />} */}
          {activeTab === "orders" && <OrderDetails pendingTransactions />}
          {activeTab === "transactions" && <TransactionHistory transactions />}
        </div>
      )}
    </div>
  );
};

export default Portfolio;
