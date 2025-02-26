import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ThreeDots } from "react-loader-spinner";
import Chart from "chart.js/auto";
import { Activity, TrendingUp, Building, History } from "lucide-react";
import { CategoryScale } from "chart.js";
import "./StocksDetail.css";
import Transactionsindi from "../components/Transactionsindi.jsx";
import Overview from "../components/Overview.jsx";
import { stockService, marketService, wishlistService } from "../services/apis.js";
import BuyModal from "../components/BuyModal";
import SellModal from "../components/SellModal";
import Graph from "../components/Graph.jsx";
import socketService from "../services/socket.js";
import { toast } from "react-toastify";
import { FaBookmark } from "react-icons/fa";
Chart.register(CategoryScale);

const StocksDetail = () => {
  const location = useLocation();
  const passedState = location.state;

  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [infostock, setInfostock] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(passedState.stock ? passedState.stock.price : 0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch detailed stock info
  useEffect(() => {
    wishlistService.isBookmark({ companyName: passedState.stock.name })
      .then((res) => setIsBookmarked(res.is_marked))
      .catch((err) => {
        toast.error(err);
      });

    stockService.getStockDetail(passedState.stock.name)
      .then((res) => setInfostock(res))
      .catch((err) => {
        setTimeout(() => {
          stockService.getStockDetail(passedState.stock.name)
            .then((res) => setInfostock(res))
            .catch((err) => {
              toast.error("the about request");
            });
        }, 5000);
      });
  }, [passedState]);

  // Market status check
  useEffect(() => {
    const checkMarketStatus = () => {
      marketService.checkMarketStatus()
        .then((res) => setIsMarketOpen(res.is_open))
        .catch((err) => {});
    };

    checkMarketStatus();
  }, []);

  // Socket subscription for live price updates
  useEffect(() => {
    if (!passedState.stock) return;
    socketService.connect();
    socketService.subscribeToCompany(passedState.stock.name);
    const handleMarketUpdate = (data) => {
      setCurrentPrice(Number(data.price));
    };
    socketService.onMarketUpdate(handleMarketUpdate);
    return () => {
      socketService.removeListeners();
      socketService.disconnect();
    };
  }, [passedState.stock]);

  // Refresh handler to fetch live data (reloads the page)
  const handleRefresh = () => {
    window.location.reload();
  };

  // Toggle bookmark state
  const toggleBookmark = () => {
    setIsBookmarked((prev) => !prev);
    if (!isBookmarked) {
      stockService.addToWishlist({ companyName: passedState.stock.name })
        .then(() => toast.success("Added to wishlist"))
        .catch((err) => {
          toast.error("Failed to add to wishlist");
          setIsBookmarked((prev) => !prev);
        });
    } else {
      stockService.removeWishlist({ companyName: passedState.stock.name })
        .then(() => toast.success("Removed from wishlist"))
        .catch((err) => {
          toast.error("Failed to remove from wishlist");
          setIsBookmarked((prev) => !prev);
        });
    }
  };

  return (
    <div className="stocks-detail-container">
      {!passedState.stock && (
        <div className="loader-wrapper">
          <ThreeDots
            height="55"
            width="55"
            color="#5eb5f8"
            ariaLabel="line-wave"
            visible={true}
          />
        </div>
      )}

      {passedState.stock && (
        <>
          {/* Header Section */}
          <header className="stock-header">
            <div className="stock-header-content">
              <h1 className="stock-title">{passedState.stock.name}</h1>
              <span className="current-price">{`₹ ${Number(currentPrice).toFixed(2)}`}</span>
              <button className="bookmark-button" onClick={toggleBookmark}>
                <FaBookmark
                  size={48}
                  color={isBookmarked ? "#63b3ed" : "#a0aec0"}
                />
              </button>
            </div>
          </header>

          {/* Graph Section with Refresh Button */}
          <section className="Graph-section">
            <div className="graph-refresh-container">
              <div className="graph-wrapper">
                <Graph companyName={passedState.stock.name} />
              </div>
              <button className="btn btn-refresh" onClick={handleRefresh}>
                Fetch the live data
              </button>
            </div>
          </section>

          {/* Action Section */}
          <section className="action-section">
            {isMarketOpen ? (
              <div className="market-actions">
                <button
                  className="btn btn-buy"
                  onClick={() => setShowBuyModal(true)}
                  data-toggle="modal"
                  data-target={`#modal${passedState.stock.name}`}
                >
                  Buy
                </button>
                <button
                  className="btn btn-sell"
                  onClick={() => setShowSellModal(true)}
                  data-toggle="modal"
                  data-target={`#sellmodal${passedState.stock.name}`}
                >
                  Sell
                </button>
              </div>
            ) : (
              <div className="market-closed">
                [Note: The market is currently closed. Trading resumes at 9.00 AM.]
              </div>
            )}
          </section>

          {/* Modals */}
          {showBuyModal && (
            <BuyModal
              id={passedState.stock.id}
              name={passedState.stock.name}
              price={passedState.stock.price}
              socketPrice={currentPrice}
              onClose={() => setShowBuyModal(false)}
            />
          )}
          {showSellModal && (
            <SellModal
              id={passedState.stock.id}
              name={passedState.stock.name}
              shares={passedState.stock.shares}
              price={passedState.stock.price}
              price_change={passedState.stock.price_change}
              onClose={() => setShowSellModal(false)}
            />
          )}

          {/* Navigation Tabs */}
          <nav className="tab-navigation">
            <button
              onClick={() => setActiveTab("overview")}
              className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
            >
              <Activity className="tab-icon" size={20} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("fundamentals")}
              className={`tab-button ${activeTab === "fundamentals" ? "active" : ""}`}
            >
              <TrendingUp className="tab-icon" size={20} />
              Fundamentals
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`tab-button ${activeTab === "about" ? "active" : ""}`}
            >
              <Building className="tab-icon" size={20} />
              About Company
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`tab-button ${activeTab === "info" ? "active" : ""}`}
            >
              <Building className="tab-icon" size={20} />
              Information
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`tab-button ${activeTab === "transactions" ? "active" : ""}`}
            >
              <History className="tab-icon" size={20} />
              Transactions
            </button>
          </nav>

          {/* Content Sections */}
          <div className="content-section">
            {activeTab === "overview" && <Overview stock={passedState.stock} />}
            {activeTab === "fundamentals" && (
              <div className="fundamentals-section info-grid">
                <div className="info-card">
                  <strong>Market Cap</strong>
                  <span>{infostock ? infostock.marketcap : passedState.stock.marketcap || "NA"}</span>
                </div>
                <div className="info-card">
                  <strong>P/E Ratio (TTM)</strong>
                  <span>{infostock ? infostock.fundamentals?.peRatio : passedState.stock.fundamentals?.peRatio || "NA"}</span>
                </div>
                <div className="info-card">
                  <strong>ROE</strong>
                  <span>{infostock ? infostock.fundamentals?.roe : passedState.stock.fundamentals?.roe || "NA"}</span>
                </div>
                <div className="info-card">
                  <strong>Book Value</strong>
                  <span>{infostock ? infostock.fundamentals?.bookValue : passedState.stock.fundamentals?.bookValue || "NA"}</span>
                </div>
                <div className="info-card">
                  <strong>Face Value</strong>
                  <span>{infostock ? infostock.facevalue : passedState.stock.facevalue || "NA"}</span>
                </div>
                <div className="info-card">
                  <strong>Debt to Equity</strong>
                  <span>{infostock ? infostock.fundamentals?.debtToEquity : passedState.stock.fundamentals?.debtToEquity || "NA"}</span>
                </div>
                <div className="info-card">
                  <strong>EPS (TTM)</strong>
                  <span>{infostock ? infostock.fundamentals?.eps : passedState.stock.fundamentals?.eps || "NA"}</span>
                </div>
                <div className="info-card">
                  <strong>ROCE</strong>
                  <span>{infostock ? infostock.fundamentals?.roce : passedState.stock.fundamentals?.roce || "NA"}</span>
                </div>
                <div className="info-card">
                  <strong>Current Ratio</strong>
                  <span>{infostock ? infostock.fundamentals?.currentRatio : passedState.stock.fundamentals?.currentRatio || "NA"}</span>
                </div>
                <div className="info-card">
                  <strong>RSI</strong>
                  <span>{infostock ? infostock.fundamentals?.rsi : passedState.stock.fundamentals?.rsi || "NA"}</span>
                </div>
              </div>
            )}
            {activeTab === "about" && (
              <div className="about-section">
                <div className="info-card">
                  <div className="company-info">
                    <div>
                      <strong>CEO/MD</strong>
                      <span>{infostock ? infostock.ceo : passedState.stock.ceo || "NA"}</span>
                    </div>
                    <div>
                      <strong>Sector</strong>
                      <span>{infostock ? infostock.sector : passedState.stock.sector || "NA"}</span>
                    </div>
                    <div>
                      <strong>Subsector</strong>
                      <span>{infostock ? infostock.subsector : passedState.stock.subsector || "NA"}</span>
                    </div>
                    <div>
                      <strong>Group</strong>
                      <span>{infostock ? infostock.group : passedState.stock.group || "NA"}</span>
                    </div>
                    <div>
                      <strong>Locations</strong>
                      <span>{(infostock ? infostock.locations : passedState.stock.locations)?.join(", ") || "NA"}</span>
                    </div>
                    {infostock && infostock.foreign_trade_exposure && infostock.foreign_trade_exposure.length > 0 && (
                      <div>
                        <strong>Foreign Trade Exposure</strong>
                        <span>
                          {infostock.foreign_trade_exposure.map((item, index) => (
                            `${item.Country}: ${item.Percentage}${index < infostock.foreign_trade_exposure.length - 1 ? ', ' : ''}`
                          ))}
                        </span>
                      </div>
                    )}
                    {infostock && infostock.government_schemes_involvement && infostock.government_schemes_involvement.length > 0 && (
                      <div>
                        <strong>Government Schemes</strong>
                        <span>
                          {infostock.government_schemes_involvement.join(", ")}
                        </span>
                      </div>
                    )}
                    {infostock && infostock.public_sector && (
                      <div>
                        <strong>Public Sector</strong>
                        <span>{infostock.public_sector}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "info" && (
              <div className="info-section">
                <div className="info-card">
                  <h3 className="para">{infostock ? infostock.name : passedState.stock.name}</h3>
                  <p className="para">
                    {infostock ? infostock.name : passedState.stock.name} ({infostock ? infostock.ticker : passedState.stock.ticker}) is a leading company in the {infostock ? infostock.sector : passedState.stock.sector} sector, specifically focusing on {infostock ? infostock.subsector : passedState.stock.subsector}. With a market capitalization of {infostock ? infostock.marketcap : passedState.stock.marketcap}, it has established itself as a significant player in the industry.
                  </p>
                  <p className="para">
                    The company reported an annual revenue of {infostock ? infostock.revenue : passedState.stock.revenue} with year-over-year growth of {infostock ? infostock.yoy_growth : passedState.stock.yoy_growth}. The profit after tax (PAT) stands at {infostock ? infostock.pat : passedState.stock.pat}, showing a growth of {infostock ? infostock.profit_growth : passedState.stock.profit_growth}.
                  </p>
                  <h4 className="para">Expansion Plans</h4>
                  {(infostock ? infostock.expansion_plans : passedState.stock.expansion_plans)?.map((plan, index) => (
                    <span className="para" key={index}>{plan}</span>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "transactions" && (
              <div className="transactions-section">
                <Transactionsindi name={passedState.stock.name} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StocksDetail;
