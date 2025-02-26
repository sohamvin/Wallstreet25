import { useEffect, useState } from "react";
import { portfolioService } from "../services/apis.js";
import "./TransactionHistory.css"; 

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await portfolioService.getTransactions();
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

        // Process each transaction: if it's canceled with shares_transacted > 0,
        // split it into two transactions: one for the canceled remainder and one for the completed part.
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

            // Calculate the remaining quantity and adjust the price accordingly
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

            // For the completed part, price is computed as moneyExchanged divided by transactedShares
            const completedPrice = moneyExchanged / transactedShares;
            const completedTransaction = {
              ...transaction,
              quantity: transactedShares,
              price: completedPrice,
              status: "COMPLETED",
              // Reset these fields for the completed part
              shares_transacted: 0,
              money_exchanged: 0,
            };

            // Return both transactions
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
  }, []);

  return (
    <div className="transaction-history container mt-5">
      <h3 className="text-light mb-4 text-center">Transaction History</h3>
      
      {/* A container with a set max-height and scroll */}
      <div className="transaction-table-container">
        <table className="table text-light text-center">
          <thead>
            <tr style={{ color: "#5eb5f8" }}>
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
                <td
                  className={
                    String(transaction.status) === "COMPLETED"
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  {transaction.status}
                </td>
                <td>
                  {new Date(transaction.datetimePlaced).toLocaleDateString()}
                </td>
                <td>
                  {new Date(transaction.datetimePlaced).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
