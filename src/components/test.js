
import {io} from 'socket.io-client';
import socketService from '../services/socket.js';

socketService.connect();
// const socket = io("http://3.111.114.201:3500")

socketService.subscribeToCompany("Google");


// socket.on('connect', ()=> {
//     socket.emit('subscribeToCompany', 'Google');

//   })
socketService.onMarketUpdate((data)=> {
    console.log(data);
  }
)


// socket.on('market', (data)=> {
//     console.log(data);
//   });


  
