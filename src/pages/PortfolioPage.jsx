import PropTypes from "prop-types"; // Import PropTypes

import NetWorthCard from "./NetWorthCard/NetWorthCard";
import IntradayProfitLossCard from "./IntradayProfitLossCard/IntradayProfitLossCard";
import CompanyWisePnL from "./CompanyWisePnL/CompanyWisePnL";
import TransactionHistory from "./TransactionHistory/TransactionHistory";
import HoldingsCard from "./HoldingsCard/HoldingsCard";
import OrderDetails from "./OrderDetails/OrderDetails";

const PortfolioPage = ({ userData }) => {
  return (
    <div className="portfolio-page">
      <h1>Portfolio Overview</h1>

      <NetWorthCard userData={userData} />
      <IntradayProfitLossCard profitLoss={userData.intradayProfitLoss} />
      <CompanyWisePnL companyPnL={userData.companyPnL} />
      <TransactionHistory transactions={userData.transactions} />
      <HoldingsCard holdings={userData.holdings} />
      <OrderDetails transactions={userData.transactions} />
    </div>
  );
};

// Define PropTypes for userData
PortfolioPage.propTypes = {
  userData: PropTypes.shape({
    intradayProfitLoss: PropTypes.number.isRequired,
    companyPnL: PropTypes.array.isRequired,
    transactions: PropTypes.array.isRequired,
    holdings: PropTypes.array.isRequired,
    // Add more properties as needed
  }).isRequired,
};

export default PortfolioPage;
