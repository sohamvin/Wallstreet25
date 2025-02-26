const OrderDetails = ({ pendingTransactions, handleCancelTransaction }) => {
  return (
    <div className="container mt-5">
      <h3 className="text-light mb-4 text-center">Pending Orders</h3>
      <table className="table text-light text-center table-fixed">
        <thead>
          <tr style={{ color: "#5eb5f8" }}>
            <th scope="col">Company</th>
            <th scope="col">Qty</th>
            <th scope="col">Type</th>
            <th scope="col">Price</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingTransactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.ticker}</td>
              <td>{transaction.quantity}</td>
              <td>{transaction.transaction_type}</td>
              <td>₹ {transaction.traded_price}</td>
              <td>
                <button
                  className="btn btn-danger"
                  onClick={() => handleCancelTransaction(transaction.id)}
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderDetails;
