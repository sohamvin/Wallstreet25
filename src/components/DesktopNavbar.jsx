import React from "react";
import { NavLink } from "react-router-dom";
import image from "../assets/stockwhite.svg";

/**
 * This is the desktop navbar component which will be rendered if user is not logged in 
 */
const DesktopNavbar = () => {
    return (
        <div>
            <div>
                <div>
                    <nav className="desktopNavbar navbar navbar-expand-md navbar-light mx-0">
                        <div className="container">

                            {/* Top left icon */}
                            <NavLink to="/" className="navbar-brand">
                                <div>
                                    <img src={image} alt="" id="logo" />
                                    <span className="desktoptitle">
                                        {" "}
                                        Wallstreet{" "}
                                    </span>
                                </div>
                            </NavLink>

                            <button
                                className="navbar-toggler"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#main-nav"
                                aria-controls="main-nav"
                                aria-expanded="false"
                                aria-label="Toggle navigation"
                            >
                                <span className="navbar-toggler-icon"></span>
                            </button>
                            
                            {/* Right side menu links */}
                            <div
                                className="collapse navbar-collapse justify-content-end align-center"
                                id="main-nav"
                            >
                                <ul className="navbar-nav">
                                    <li className="nav-item">
                                        <NavLink
                                            to="/"
                                            className="nav-link text-light navItem"
                                        >
                                            Home
                                        </NavLink>
                                    </li>
                                   
                                    <li className="nav-item">
                                        <NavLink
                                            to="/ranking"
                                            className="nav-link text-light navItem"
                                        >
                                            Rankings
                                        </NavLink>
                                    </li>
                                    {/* <li className="nav-item">
                                        <NavLink
                                        to="/ipo"
                                        className="nav-link text-light navItem"
                                        >
                                        IPOs
                                        </NavLink>
                                    </li> */}
                                    <li className="nav-item">
                                        <NavLink
                                            to="/rules"
                                            className="nav-link text-light navItem"
                                        >
                                            Rules
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink
                                            to="/login"
                                            className="nav-link text-light navItem"
                                        >
                                            Login
                                        </NavLink>
                                    </li>
                                    {/* <li className="nav-item">
                                        <NavLink
                                            to="/register"
                                            className="nav-link text-light navItem"
                                        >
                                            Register
                                        </NavLink>
                                    </li> */}
                                </ul>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default DesktopNavbar;
