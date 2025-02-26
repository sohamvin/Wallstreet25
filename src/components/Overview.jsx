import { useEffect, useState } from "react";
import socketService from "../services/socket.js";


const OverviewComponent = ({ stock ,marketCap}) => {
  // Initialize state with the stock's current price and default range values.
  const [prices, setPrices] = useState(stock.price);
  const [todaysMin, settodayMin] = useState(0);
  const [todaysMax, settodayMax] = useState(0);
  const [clampedTodaysPos, setClampedTodaysPos] = useState(0);
  const [buyVolume, setBuyVolume] = useState(0);
  const [sellVolume, setSellVolume] = useState(0);
  // Track the last data received to handle missing fields
  const [lastVolumeData, setLastVolumeData] = useState({});

  // Effect for establishing the WebSocket connection and subscribing to events.
  useEffect(() => {
    // Connect to the socket server and subscribe to the specific company's updates.
    socketService.connect();
    socketService.subscribeToCompany(stock.name);
    // console.log("Subscribed to stock:", stock);

    // Handler to update the current price.
    const handleMarketUpdate = (data) => {
      setPrices(Number(data.price));
    };

    // Handler to update buy volume.
    const handleBuyVolume = (data) => {
      // console.log("Buy volume data:", data);
      
      // Check for data.buy_volume first
      if (data && typeof data === 'object' && 'buy_volume' in data) {
        // console.log("Buy Volume:", data.buy_volume);
        setBuyVolume(Number(data.buy_volume));
        
        // Save this data for cross-referencing
        setLastVolumeData(prevData => ({
          ...prevData,
          buy_volume: data.buy_volume,
          company: data.company
        }));
      } 
      // If we're getting sell_volume but no buy_volume, we need to handle that 
      else if (data && typeof data === 'object' && 'sell_volume' in data) {
        // console.log("Received sell volume in buy handler:", data.sell_volume);
        setSellVolume(Number(data.sell_volume));
        
        // Save this data for cross-referencing
        setLastVolumeData(prevData => ({
          ...prevData,
          sell_volume: data.sell_volume,
          company: data.company
        }));
      }
      else if (typeof data === 'string' || typeof data === 'number') {
        // console.log("Buy Volume (direct value):", data);
        setBuyVolume(Number(data));
      }
    };

    // Handler to update sell volume.
    const handleSellVolume = (data) => {
      // console.log("Sell volume data:", data);
      
      // Check for data.sell_volume first
      if (data && typeof data === 'object' && 'sell_volume' in data) {
        // console.log("Sell Volume:", data.sell_volume);
        setSellVolume(Number(data.sell_volume));
        
        // Save this data for cross-referencing
        setLastVolumeData(prevData => ({
          ...prevData,
          sell_volume: data.sell_volume,
          company: data.company
        }));
      }
      // If we're getting buy_volume but no sell_volume, we need to handle that
      else if (data && typeof data === 'object' && 'buy_volume' in data) {
        // console.log("Received buy volume in sell handler:", data.buy_volume);
        setBuyVolume(Number(data.buy_volume));
        
        // Save this data for cross-referencing
        setLastVolumeData(prevData => ({
          ...prevData,
          buy_volume: data.buy_volume,
          company: data.company
        }));
      }
      else if (typeof data === 'string' || typeof data === 'number') {
        // console.log("Sell Volume (direct value):", data);
        setSellVolume(Number(data));
      }
    };

    // Handler to update today's low price.
    const handleMinUpdate = (data) => {
      // console.log("Received min update:", data);
      settodayMin(Number(data.low_price));
    };

    // Handler to update today's high price.
    const handleMaxUpdate = (data) => {
      // console.log("Received max update:", data);
      settodayMax(Number(data.high_price));
    };

    // Register the event handlers.
    socketService.onMarketUpdate(handleMarketUpdate);
    socketService.onnonupdates(handleMinUpdate);
    socketService.onupdates(handleMaxUpdate);

    // Subscribe to volume updates.
    socketService.getvolume(handleBuyVolume);
    socketService.get2volume(handleSellVolume);

    // Cleanup: remove listeners and disconnect when the component unmounts.
    return () => {
      socketService.removeListeners();
      socketService.disconnect();
    };
  }, [stock]);

  // Effect to recalculate the current price's position within today's range.
  useEffect(() => {
    if (todaysMax !== todaysMin) {
      const todaysPosition = ((prices - todaysMin) / (todaysMax - todaysMin)) * 100;
      setClampedTodaysPos(Math.max(0, Math.min(100, todaysPosition)));
    }
  }, [prices, todaysMin, todaysMax]);

  // Optional: useEffect to log volume updates for debugging
  useEffect(() => {
    // console.log("Current volumes - Buy:", buyVolume, "Sell:", sellVolume);
  }, [buyVolume, sellVolume]);

  return (
    <div className="overview-component">
      {/* Today's Range Display */}
      <div className="info-card range-card">
        <h3>All Time Range</h3>
        <h4>{Number(prices).toFixed(2)}</h4>
        <div className="range-slider">
          <div className="range-values">
            <span>₹ {todaysMin.toFixed(2)}</span>
            <span>₹ {todaysMax.toFixed(2)}</span>
          </div>
          <div className="range-bar">
            <div className="range-progress" style={{ width: `${clampedTodaysPos}%` }}></div>
            <div className="range-marker" style={{ left: `${clampedTodaysPos}%` }}></div>
          </div>
        </div>
      </div>

      {/* Key Statistics Display */}
      <div className="info-grid">
        <div className="info-card">
          <strong>Opening Price</strong>
          <span>{Number(stock.price).toFixed(2)}</span>
          </div>
        <div className="info-card">
          <strong>Buy Volume</strong>
          <span>{buyVolume}</span>
        </div>
        <div className="info-card">
          <strong>Sell Volume</strong>
          <span>{sellVolume}</span>
        </div>
      </div>
    </div>
  );
};

export default OverviewComponent;