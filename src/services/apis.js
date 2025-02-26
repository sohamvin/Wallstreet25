import {axiosAuthInstance, axiosNoAuthInstance} from "../services/axiosInstance.js";
// import axios from "axios";
const userService = {
    loginUser: (loginData) => {
        // console.log(loginData);
        
        return axiosNoAuthInstance.post("/auth/login", loginData)
        .then(res => res.data)
        .catch(err => {
            // console.log(err.response)
            // console.clear()
            throw err.response
            // console.clear()
        })
    }


    // logoutUser: () => {
    //     return axiosAuthInstance.post("/auth/token/logout/")
    //     .then(res => res.data)
    //     .catch(err => {
            // console.clear()
    //         throw err.response
            // console.clear()
    //     })
    // },
    // registerUser: (registerData) => {
    //     return axiosNoAuthInstance.post("/auth/users/", registerData)
    //     .then(res => res.data)
    //     .catch(err => {
            // console.clear()
    //         throw err.response
            // console.clear()
    //     })
    // }
}



const stockService = {
    getStocks: () => {
        return axiosAuthInstance.get("/company/all")
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
           
        })
    },
    gethistoricaldata:(req)=>{

        return axiosAuthInstance.post('/market/historicalMarketData',req).then(res=>res.data).catch(err=>{throw err.response})
    },
    getStockDetail: (req) => {
        const request={companyName:req};
        return axiosAuthInstance.post(`/company/about`,request)
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
            
        })
    },
    buyStock: (id, buyOrderData) => {
        return axiosAuthInstance.post(`/order/buy`, buyOrderData)
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
           
        })
    },
    sellStock: (id, sellOrderData) => {
        return axiosAuthInstance.post(`/order/sell`, sellOrderData)
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
            
        })
    },
    deleteOrder: (id) => {
        console.log("working",id);
        
        const req = { order_id: id };
        // console.log(req);

       
        
                return axiosAuthInstance.post(`/order/delete`, req)
                .then(res => res.data)
            .catch(err => {
            throw err.response;
            });
    },
    
    getopeningprice:(req) => {
        
            const request={companyName: req};
            
            // const price = Number(response.data.openingPrice);
            return axiosAuthInstance.post('/market/opening',request)
            .then(res=>res.data)
            .catch(err => {
                throw err.response
            })
         
          
    },
    getQuantity: (req) => {
    //    alert(req);
        const request={company:req};
        // console.log(request);
        return axiosAuthInstance.post(`/portfolio/companyHolding`, request)
        .then(res => res.data)
        .catch(err => {
            
            throw err.response
            
        })
    },
    getWishlist: () => {
    return axiosAuthInstance
      .get("/wishlist") // Assuming this is the correct endpoint
      .then((res) => res.data)
      .catch((err) => {
        console.clear();
        throw err.response;
      });
  },
  
  addToWishlist: (stock) => {
    // console.log(stock);
    return axiosAuthInstance
      .post("/watchlist/add", stock) 
      .then((res) => res.data)
      .catch((err) => {
        
        
        throw err.response;
      });
  },
  removeWishlist : (stock)=>{
    // console.log(stock);
    return axiosAuthInstance
   
    .post("/watchlist/remove",stock)
    .then((res)=> res.data)
    .catch((err)=>{
       
        throw err.response;
    })
  }
}

const wishlistService= {
    getWishlist:()=>{
        return axiosAuthInstance.get('/watchlist')
        .then((res)=> res.data)
        .catch((err)=>{
            console.clear()
            throw err.response
        })
    },
    isBookmark:(stock)=>{
        return axiosAuthInstance.post('/watchlist/isBookmarked',stock)
        .then((res)=> res.data)
        .catch((err)=>{
            console.clear()
            throw err.response
        })

    }
}

const portfolioService = {
    getPortfolio: () => {
        return axiosAuthInstance.get("/portfolio/")
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
         
        })
    },
    getCash: () => {
        
        return axiosAuthInstance.get("/portfolio/cash")
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
            
        })
    },
    getTransactions: () => {
        return axiosAuthInstance.get("/portfolio/completedOrders/")
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
            
        })
    },
    getindiTransactions:(req)=>{
        return axiosAuthInstance.post("/company/orders",req)
        .then(res=>res.data)
        .catch(err=>{
            console.clear()
            // console.log(err)
            throw err.response
        })
    },
    getPendingTransactions: () => {
        return axiosAuthInstance.get("/portfolio/pendingOrders")
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
            
        })
    },

    getholdingdetails: () => {
        return axiosAuthInstance.get("/portfolio/holdingDetail/")
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
        }
        )
    }
}

const marketService = {
    checkMarketStatus: () => {
        return axiosNoAuthInstance.get("/market/marketIsOpen")
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
            
        })
    }
}


// const ipoService = {
//     getIpos: () => {
//         return axiosAuthInstance.get("/ipos/")
//         .then(res => res.data)
//         .catch(err => {
            // console.clear()
//             throw err.response
            // console.clear()
//         })
//     },
//     subscribeIpo: (id, ipoSubscribeData) => {
//         return axiosAuthInstance.post(`/ipos/subscribe/${id}`, ipoSubscribeData)
//         .then(res => res.data)
//         .catch(err => {
            // console.clear()
//             throw err.response
            // console.clear()
//         })
//     }
// }

const rankService = {
    getRankings: () => {
        return axiosNoAuthInstance.get('/auth/rankings/')
        .then(res => res.data)
        .catch(err => {
            console.clear()
            throw err.response
         
        })
    }
}

export {userService, stockService, portfolioService, marketService, rankService, wishlistService};
