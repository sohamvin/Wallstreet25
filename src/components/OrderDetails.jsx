import { useEffect, useState } from "react";
import { portfolioService, stockService } from "../services/apis.js";
import "./OrderDetails.css"; // Import the custom CSS
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrderDetails = () => {
  const [pendingTransactions, setPendingTransactions] = useState([]);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const response = await portfolioService.getPendingTransactions();
        // console.log("API Response:", response);
        let data = [];

        if (response && response.data) {
          data = response.data;
        } else if (Array.isArray(response)) {
          data = response;
        } else {
          // console.error("Unexpected response format:", response);
        }

        if (!Array.isArray(data)) {
          // console.error("Expected an array but received:", data);
          data = [];
        }
        setPendingTransactions(data);
      } catch (error) {
        // console.error("Error fetching pending orders:", error);
      }
    };

    fetchPendingOrders();
  }, []);

  const handleCancelTransaction = (order_id) => {
    // Your cancellation logic here, e.g., calling portfolioService.cancelOrder(order_id)
  
    stockService.deleteOrder(order_id)
      .then(() => {
      

        // console.log("hello ", order_id);
        toast.info("Requested Cancel Order. Please refresh and wait some time before the order is cancelled.");
        toast.info("You can see transaction status in history.")
        setPendingTransactions((prevTransactions) =>
          prevTransactions.filter((transaction) => transaction.order_id !== order_id)
        );
      })
      .catch((error) => {
        // console.log("ello ", order_id);
        toast.error("Error cancelling order!");
      });
  };

  return (
    <div className="order-details container mt-5">
      <h3 className="text-light mb-4 text-center">Pending Orders</h3>
      <div className="order-table-container">
        <table className="table text-light text-center">
          <thead>
            <tr style={{ color: "#5eb5f8" }}>
              <th scope="col">Company</th>
              <th scope="col">Qty</th>
              <th scope="col">Type</th>
              <th scope="col">Price</th>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
              <th scope="col">Time</th>
              <th scope="col">Action</th>
              
            </tr>
          </thead>
          <tbody>
            {pendingTransactions.map((transaction) => (
              <tr key={transaction.order_id}>
                {/* <td>{transaction.order_id}</td> */}
                <td className="company-name">{transaction.companyName}</td>
                <td>{transaction.quantity}</td>
                <td
                  className={
                    transaction.order_type === "BUY"
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  {transaction.order_type.toUpperCase()}
                </td>
                <td>{Number(transaction.price).toFixed(2)}</td>
                <td>{transaction.status}</td>
                <td>{new Date(transaction.datetimePlaced).toLocaleDateString()}</td>
                <td>{new Date(transaction.datetimePlaced).toLocaleTimeString()}</td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleCancelTransaction(transaction.order_id)}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderDetails;
