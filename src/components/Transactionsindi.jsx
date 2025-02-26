import { useEffect, useState } from "react";
import { portfolioService } from "../services/apis.js";
import "./Transactionsindi.css"; 

const Transactionsindi = ({ name }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const request = { companyId: name };
        const response = await portfolioService.getindiTransactions(request);
        // console.log("API Response:", response);

        let data = [];
        if (response && response.data) {
          data = response.data;
        } else if (Array.isArray(response)) {
          // If the response itself is an array, use it directly
          data = response;
        } else {
          // console.error("Unexpected response format:", response);
        }

        // Ensure data is an array; if not, default to an empty array
        if (!Array.isArray(data)) {
          // console.error("Expected an array but received:", data);
          data = [];
        }

        // Process each transaction:
        // If a transaction is CANCELED and has a positive shares_transacted,
        // split it into two transactions (canceled and completed parts).
        const processedData = data.flatMap((transaction) => {
          if (
            transaction.status === "CANCELED" &&
            transaction.shares_transacted &&
            transaction.shares_transacted > 0
          ) {
            const transactedShares = transaction.shares_transacted;
            const originalQuantity = transaction.quantity;
            const originalPrice = Number(transaction.price);
            const moneyExchanged = transaction.money_exchanged; // total money exchanged for transacted shares

            // Calculate the remaining quantity and adjusted price for the canceled part
            const remainingQuantity = originalQuantity - transactedShares;
            let cancelledPrice = originalPrice;
            if (remainingQuantity > 0) {
              cancelledPrice =
                ((originalQuantity * originalPrice) - moneyExchanged) /
                remainingQuantity;
            }
            const cancelledTransaction = {
              ...transaction,
              quantity: remainingQuantity,
              price: cancelledPrice,
              status: "CANCELED",
            };

            // For the completed part, calculate the price and update status
            const completedPrice = moneyExchanged / transactedShares;
            const completedTransaction = {
              ...transaction,
              quantity: transactedShares,
              price: completedPrice,
              status: "COMPLETED",
              shares_transacted: 0,
              money_exchanged: 0,
            };

            // Return both transactions as separate entries
            return [cancelledTransaction, completedTransaction];
          }
          return transaction;
        });

        setTransactions(processedData);
      } catch (error) {
        // console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, [name]);

  return (
    <div className="transaction-history container mt-5">
      <h3 className="text-light mb-4 text-center">Transaction History</h3>
      
      {/* A container with a set max-height and scroll */}
      <div className="transaction-table-container">
        <table className="table text-light text-center">
          <thead>
            <tr style={{ color: "#5eb5f8" }}>
              {/* Uncomment or remove based on design */}
              <th scope="col">Company</th>
              <th scope="col">Quantity</th>
              <th scope="col">Order Type</th>
              <th scope="col">Price</th>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
              <th scope="col">Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.order_id + transaction.status}>
                <td>{transaction.companyName}</td>
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
                <td
                  className={
                    transaction.status === "COMPLETED"
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  {transaction.status}
                </td>
                <td>{new Date(transaction.datetimePlaced).toLocaleDateString()}</td>
                <td>{new Date(transaction.datetimePlaced).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactionsindi;
