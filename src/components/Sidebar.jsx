import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import image from "../assets/stockwhite.svg";
import { useAuthContext } from "../hooks/useAuthContext";
import { useLogout } from "../hooks/useLogout";
import {
  FaBook,
  FaNewspaper,
  FaBars,
  FaChartBar,
  FaUserTie,
  FaSignOutAlt,
  FaTrophy,
  FaHeart, // Wishlist icon
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuthContext();
  const { logout } = useLogout();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        sidebarOpen &&
        !event.target.closest(".sidebar") &&
        !event.target.closest(".hamburger")
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [sidebarOpen, setSidebarOpen]);

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Hamburger icon to toggle sidebar */}
      <div
        className="hamburger"
        onClick={() => setSidebarOpen((prev) => !prev)}
      >
        <FaBars />
      </div>

      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <NavLink to="/" className="logo-container">
          <img src={image} alt="logo" className="logo" />
          <span className="logo-text">Wall Street</span>
        </NavLink>
        <ul className="nav-links">
          {user && (
            <li className="nav-item">
              <NavLink to="/stocks" className="nav-link">
                <FaChartBar className="icon" />
                Stocks
              </NavLink>
            </li>
          )}
          {user && (
            <li className="nav-item">
              <NavLink to="/portfolio" className="nav-link">
                <FaUserTie className="icon" />
                Portfolio
              </NavLink>
            </li>
          )}
          {/* Wishlist Page Link */}
          {user && (
            <li className="nav-item">
              <NavLink to="/wishlist" className="nav-link">
                <FaHeart className="icon" /> WatchList
              </NavLink>
            </li>
          )}
          <li className="nav-item">
            <NavLink to="/ranking" className="nav-link">
              <FaTrophy className="icon" />
              Ranking
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/rules" className="nav-link">
              <FaBook className="icon" />
              Rules
            </NavLink>
          </li>
          <li className="nav-item">
            <a
              href="https://news-wallstreet-credenz.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              <FaNewspaper className="icon" />
              News
            </a>
          </li>
        </ul>
        <button className="logoutbtn" onClick={handleLogout}>
          <FaSignOutAlt className="icon" /> Logout
        </button>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
};

export default Sidebar;
