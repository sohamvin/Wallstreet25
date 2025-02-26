// src/services/socketService.js
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_LINK ; // Replace with actual server URL

class SocketService {
  constructor() {
    this.socket = io(SOCKET_SERVER_URL, { 
      transports: ['websocket'],  
      path: '/socket.io',  
  }); // Prevent auto-connect
  }

  // Connect to the socket server
  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  // Disconnect from the socket server
  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // Subscribe to a company's market updates
  subscribeToCompany(company) {
    try{
    this.socket.emit('subscribeToCompany', company);
    }
    catch(e){
      alert(e)
    }
    // console.log("Subscribed to", company);
  }

  ranking(callback){
    
      this.socket.on('leaderboard',callback);

  }

  // Listen for market updates

  onMarketUpdate(callback) {
    // console.log("onMarketUpdate");
    this.socket.on('market', callback);
    // callback({company: "Google", price: 100});
  }

  onupdates(callback){
    this.socket.on('high_price',callback);
  }
  onnonupdates(callback){
    this.socket.on('low_price',callback);
  }

  getvolume(callback){
    this.socket.on('sell_volume',callback);
  }

  get2volume(callback){
    this.socket.on('buy_volume',callback);
  }
  

//   onBuyLiquidUpdate(callback){
//     this.socket.on("buy_liquid", callback)
//   }

//   onSellLiquidUpdate(callback){
//     this.socket.on("sell_liquid", callback)
//   }

  // Listen for buy/sell volume updates
//   onBuyVolumeUpdate(callback) {
//     this.socket.on("buy_volume", callback);
//   }

//   onSellVolumeUpdate(callback) {
//     this.socket.on("sell_volume", callback);
//   }

  // Remove listeners when the component unmounts
  removeListeners() {
    this.socket.off("market");
    // this.socket.off("buy_volume");
    // this.socket.off("sell_volume");
    // this.socket.off("buy_liquid");
    // this.socket.off("sell_liquid");
  }
}

// Create a singleton instance of the SocketService
const socketService = new SocketService();
export default socketService;