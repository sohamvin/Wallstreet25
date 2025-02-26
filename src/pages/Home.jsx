import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Rocket, DollarSign } from "lucide-react";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStartTrading = () => {
    navigate("/stocks");
  };

  const tickers = ["EXCHANGE", "   ","   ", "  ", "STOCK"];

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div
          className="hero-bg"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80)",
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        />
        <div className="hero-content">
          <h1 className="hero-title">Stacks to the Moon! 🚀</h1>
          <p className="hero-description">
            The most outrageous trading simulator this side of Wall Street
          </p>
          <button className="start-trading-button" onClick={handleStartTrading}>
            <Rocket size={24} />
            <span>Start Trading</span>
          </button>
        </div>
        {tickers.map((ticker, i) => (
          <div
            key={i}
            className="floating-ticker"
            style={{
              right: `${i * 20 + 10}%`,
              top: `${i * 15 + 10}%`,
              animationDuration: `${5 + i}s`,
            }}
          >
            {ticker}
          </div>
        ))}
      </div>
      <footer className="footer">
        <p>
          Developed by{" "}
          <a href="https://wallstreet-webteam.vercel.app" target="_blank" rel="noopener noreferrer">
            web team
          </a>
        </p>
      </footer>
    </div>
  );
}
