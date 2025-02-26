const TransactionHistory = ({ transactions }) => {
  return (
    <div className="container mt-5">
      <h3 className="text-light mb-4 text-center">Transaction History</h3>
      <table className="table text-light text-center table-fixed">
        <thead>
          <tr style={{ color: "#5eb5f8" }}>
            <th scope="col">Company</th>
            <th scope="col">Qty</th>
            <th scope="col">Transaction Type</th>
            <th scope="col">Price</th>
            <th scope="col">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.ticker}</td>
              <td>{transaction.quantity}</td>
              <td
                className={
                  transaction.transaction_type === "buy"
                    ? "text-success"
                    : "text-danger"
                }
              >
                {transaction.transaction_type.toUpperCase()}
              </td>
              <td>₹ {transaction.traded_price.toFixed(2)}</td>
              <td>{transaction.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;
