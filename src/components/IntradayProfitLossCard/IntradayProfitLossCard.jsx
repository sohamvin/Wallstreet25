const IntradayProfit = ({ holdings }) => {
  const intradayHoldings = holdings.filter((h) => h.trade_type === "intraday");

  return (
    <div className="container mt-5">
      <h3 className="text-light mb-4">Intraday Profit/Loss</h3>
      <table className="table text-light text-center table-fixed">
        <thead>
          <tr style={{ color: "#5eb5f8" }}>
            <th scope="col">Company</th>
            <th scope="col">Profit/Loss</th>
          </tr>
        </thead>
        <tbody>
          {intradayHoldings.map((holding) => (
            <tr key={holding.stock__ticker}>
              <td>{holding.stock__ticker}</td>
              <td
                className={
                  holding.profit_loss > 0 ? "text-success" : "text-danger"
                }
              >
                ₹ {holding.profit_loss.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default IntradayProfit;
