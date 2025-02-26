// src/components/LeaderboardCard.js
import React from "react";
import "./RankCard.css";

const RankCard = ({ ranki, name, cash, totalValue }) => {
  return (
    <div className="leaderboard-card">
      <div className="cell rank-cell">{ranki}</div>
      <div className="cell name-cell">{name}</div>
      {/* <div className="cell cash-cell">₹ {Number(cash).toFixed(4)}</div> */}
      <div className="cell total-cell">₹ {Number(totalValue).toFixed(2)}</div>
    </div>
  );
};

export default RankCard;
