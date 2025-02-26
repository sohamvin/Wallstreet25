const HoldingsCard = ({ holdings = [] }) => {
  return (
    <div className="container mt-5">
      <h3 className="text-light mb-4 text-center">Your Holdings</h3>
      {holdings.length === 0 ? (
        <p className="text-light">No holdings available</p>
      ) : (
        <table className="table text-light text-center table-fixed">
          <thead>
            <tr style={{ color: "#5eb5f8" }}>
              <th scope="col">Company</th>
              <th scope="col">Quantity</th>
              <th scope="col">Avg. Price</th>
              <th scope="col">Current Price</th>
              <th scope="col">Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const profitLoss = holding.stock__current_price
                ? (holding.stock__current_price - holding.avg_price) *
                  holding.total_quantity
                : 0;
              return (
                <tr key={holding.stock__ticker}>
                  <td>{holding.stock__ticker}</td>
                  <td>{holding.total_quantity}</td>
                  <td>₹ {holding.avg_price.toFixed(2)}</td>
                  <td>
                    ₹ {holding.stock__current_price?.toFixed(2) || "0.00"}
                  </td>
                  <td style={{ color: profitLoss >= 0 ? "lightgreen" : "red" }}>
                    ₹ {profitLoss.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HoldingsCard;
