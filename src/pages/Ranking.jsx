
import  { useState, useEffect } from "react";
import RankCard from "../components/RankCard.jsx";
import { ThreeDots } from "react-loader-spinner";
import { rankService } from "../services/apis.js";
import { toast } from "react-toastify";
import "./Ranking.css";
import socketService from "../services/socket.js";

const Leaderboard = () => {
  const [ranks, setRanks] = useState([]);
  const [first,setFirst]=useState(0);
  useEffect(() => {
    // Fetch initial rankings
    if(first==0){
    const fetchRankings = async () => {
      try {
        const response = await rankService.getRankings();
        const sortedRanks = response.sort((a, b) => b.totalValue - a.totalValue);
        setRanks(sortedRanks);
        // console.log("this is by http");
      } catch (error) {
        // console.error("Error fetching rankings:", error);
        toast.error("Failed to fetch rankings.");
      }
    };
    setFirst(1);
    fetchRankings();
  }

    // Socket connection for live updates
    const handleRankingUpdate = (data) => {
      const sortedRanks = data.sort((a, b) => b.totalValue - a.totalValue);
      setRanks(sortedRanks);
      
    };

    socketService.connect();
    socketService.ranking(handleRankingUpdate);

    // Cleanup on unmount
    return () => {
      socketService.removeListeners();
      socketService.disconnect();
    };
  },[] );

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Leaderboard</h1>
      {ranks.length === 0 ? (
        <div className="loader">
          <ThreeDots
            height="55"
            width="55"
            color="#5eb5f8"
            ariaLabel="loading-indicator"
            visible={true}
          />
        </div>
      ) : (
        <>
          <div className="leaderboard-header">
            <div className="header-cell rank-header">Rank</div>
            <div className="header-cell name-header">Name</div>
            {/* <div className="header-cell cash-header">Cash</div> */}
            <div className="header-cell total-header">Networth</div>
          </div>
          <div className="leaderboard-list">
            {ranks.map((rank, index) => (
              <RankCard key={index} ranki={index + 1} {...rank} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
