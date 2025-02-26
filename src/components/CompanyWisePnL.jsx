const CompanyWisePnl = ({ holdings = [] }) => {
  return (
    <div className="container mt-5">
      <h3 className="text-light mb-4 text-center">Company Wise P&L</h3>
      {holdings.length > 0 ? (
        <table className="table text-light text-center table-fixed">
          <thead>
            <tr style={{ color: "#5eb5f8" }}>
              <th scope="col">Company</th>
              <th scope="col">Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
              <tr key={holding.stock__ticker}>
                <td>{holding.stock__ticker}</td>
                <td
                  className={
                    holding.profit_loss > 0 ? "text-success" : "text-danger"
                  }
                >
                  ₹{" "}
                  {holding.profit_loss
                    ? holding.profit_loss.toFixed(2)
                    : "0.00"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-light text-center">No Holdings Available</p>
      )}
    </div>
  );
};

export default CompanyWisePnl;
