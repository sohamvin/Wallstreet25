import PropTypes from "prop-types";

const NetWorthCard = ({ cash = 0, networth = 0 }) => {
  return (
    <div className="container card p-1 shadow portfolioCard text-light mt-4 p-2">
      <div className="card-body stockcard-body w-100">
        <div className="row">
          <div className="col-6">
            <p className="mt-2 mb-sm-2 h5 ms-sm-3 bi bi-pie-chart">
              Net Worth: ₹ {Number(networth).toFixed(2)}
            </p>
          </div>
          <div className="col-6 text-end">
            <p className="mt-2 mb-sm-2 h5 ms-sm-3 me-2 bi bi-wallet">
              Cash: ₹ {Number(cash).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Add PropTypes for type validation
NetWorthCard.propTypes = {
  cash: PropTypes.number,
  networth: PropTypes.number,
};

export default NetWorthCard;
