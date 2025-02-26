import React, { useEffect, useState } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  ReferenceLine
} from "recharts";
import { io } from "socket.io-client";
import "./Graph.css"; 
import { stockService } from "../services/apis.js";
import { toast } from "react-toastify";
import socketService from "../services/socket.js";

const socket = io(import.meta.env.VITE_SOCKET_LINK, {
  transports: ["websocket"],
  path: "/socket.io",
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

const Graph = ({ companyName }) => { // Accept companyName as a prop
  const [data, setData] = useState([]);
  const [openingPrice, setOpeningPrice] = useState(null);
  // windowSize controls how many data points are shown. Start zoomed in (fewer points)
  const [windowSize, setWindowSize] = useState(30);

  // Helper function to convert time to IST time string
  const convertToIST = (time) =>
    new Date(time).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });

  useEffect(() => {
    // Fetch historical data for the chart
    
    socket.off("disconnect");



    const fetchHistoricalData = async () => {
     
      stockService.gethistoricaldata({ companyName })
        .then(response => {
          // console.log("pspspspsppsps", response);
            const formattedData = response.data.map(d => ({
            time: convertToIST(d.time),
            price: d.price,
            }));
          setData(formattedData);
          // Adjust the windowSize if there are fewer data points than our initial setting.
          if (formattedData.length < windowSize) {
        setWindowSize(formattedData.length);
          }
        })
        .catch(err => {
          toast.error("Error fetching historical data:", err);
        });
      }
    

    // Fetch the market opening price
    const fetchOpeningPrice = async () => {
      try {
      const response = await stockService.getopeningprice(companyName);
      // console.log("spspspspsp",response);
      const price = Number(response.openingPrice);
      // console.log("Opening price:", price);
      setOpeningPrice(price);
      
      } catch (error) {
      // console.error("Error fetching opening price:", error);
      // setTimeout(fetchOpeningPrice, 4000); // Retry after 3 seconds
      toast.error("Error, please try again", error);
      }
    };

    fetchHistoricalData();
    fetchOpeningPrice();



    // Setup WebSocket connection for real-time updates
    socket.on("connect", () => {
      // console.log("Connected to the server");
      socket.emit("subscribeToCompany", companyName);
    });

    socket.on("market", (message) => {
      // console.log(`Received market update for ${companyName}:`, message);
      setData(prevData => [
        ...prevData,
        { time: convertToIST(message.time), price: message.price },
      ]);
    });

    socket.on("disconnect", (reason) => {
      // console.log("Disconnected from the server. Reason:", reason);
    });

    return () => {
    //   socket.off("disconnect");
    //   socket.off("disconnect");
    //   socket.off("connect");
      // socket.disconnect();

      
     
    };
  }, [companyName, windowSize]);

  // Determine the line color based on current price vs. opening price
  let lineColor = "#00c853"; // default green
  if (openingPrice !== null && data.length > 0) {
    const currentPrice = data[data.length - 1].price;
    lineColor = currentPrice >= openingPrice ? "#00c853" : "#ff0000";
  }

  // Determine the subset of data to display based on windowSize.
  const viewData = data.slice(Math.max(0, data.length - windowSize), data.length);

  // Button handlers to adjust windowSize.
  const handleZoomIn = () => {
    // Zooming in means reducing the window (but not less than a minimum, e.g. 10 points).
    if (windowSize > 10) {
      setWindowSize(windowSize - 10);
    }
  };

  const handleZoomOut = () => {
    // Zooming out means increasing the window (up to the total number of data points).
    if (windowSize < data.length) {
      setWindowSize(Math.min(data.length, windowSize + 10));
    }
  };

  return (
    <div className="Graph-container">
      <div style={{ marginBottom: "10px" }}>
        <button className="boton-elegante" onClick={handleZoomIn} style={{ marginRight: "10px" }}>
          Zoom In
        </button>
        <button className="boton-elegante" onClick={handleZoomOut}>
          Zoom Out
        </button>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={viewData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="time" stroke="#ddd" minTickGap={20} tick={{ fontSize: 12 }} />
          <YAxis
  stroke="#ddd"
  tick={{ fontSize: 12 }}
  tickFormatter={(value) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
    return value.toFixed(1); // Ensure one decimal place
  }}
  domain={
    viewData.length > 0
      ? (() => {
          let prices = viewData
            .map(d => Number(d.price))
            .filter(price => !isNaN(price) && price > 0 && price < 1e6); // Prevent extreme values

          if (prices.length === 0) return ["auto", "auto"];
          
          const minPrice = Math.min(...prices);
          let maxPrice = Math.max(...prices);
          const buffer = (maxPrice - minPrice) * 0.1 || 1; // Add spacing

          return [Math.max(0, minPrice - buffer), maxPrice + buffer];
        })()
      : ["auto", "auto"]
  }
/>
          <Tooltip 
            contentStyle={{ backgroundColor: "#1e1e1e", color: "#fff" }}
            formatter={(value) => typeof value === "number" ? value.toFixed(1) : value}
          />
          <Line 
            type="linear"
            dataKey="price" 
            stroke={lineColor} 
            strokeWidth={2.5} 
            dot={false} 
            isAnimationActive={true}
            strokeLinejoin="miter"
            strokeLinecap="butt"
          />
          {openingPrice !== null && (
            <ReferenceLine y={openingPrice} stroke="#fff" strokeDasharray="3 3" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Graph;
