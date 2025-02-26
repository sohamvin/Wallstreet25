// import React from "react";
// import { NavLink } from "react-router-dom";
// import image from "../assets/stockwhite.svg";
// import { useAuthContext } from "../hooks/useAuthContext";
// import {useLogout} from "../hooks/useLogout"

// /**
//  * This is the navbar only rendered on mobile devices
//  */
// const Navbar = () => {

//     // Get the user using context
//     const { user } = useAuthContext();
//     const {logout} = useLogout();

//     const handleLogout = () => {
//         logout();
//     };

//     return (
//         <>
//             <nav
//                 className="navbar navbar-expand-lg navbar-dark"
//                 style={{ backgroundColor: "#33333d" }}
//             >
//                 <div className="container-fluid">
//                     <div className="d-flex flex-row">
//                         <NavLink
//                             to="/"
//                             className="d-flex align-items-center mb-md-0 me-md-auto text-decoration-none"
//                         >
//                             <div>
//                                 <img src={image} alt="" id="logo" />
//                                 <div className="desktoptitle">
//                                     {" "}
//                                     Wall Street{" "}
//                                 </div>
//                             </div>
//                         </NavLink>
//                     </div>

//                     <button
//                         className="navbar-toggler"
//                         type="button"
//                         data-bs-toggle="collapse"
//                         data-bs-target="#navbarSupportedContent"
//                         aria-controls="navbarSupportedContent"
//                         aria-expanded="false"
//                         aria-label="Toggle navigation"
//                     >
//                         <div className="navbar-toggler-icon"></div>
//                     </button>
//                     <div
//                         className="collapse navbar-collapse mt-1"
//                         id="navbarSupportedContent"
//                     >
//                         <div>
//                             <div className="d-flex flex-column align-items-center align-items-sm-center text-white Navbar">
//                                 <ul
//                                     className="nav nav-pills flex-column mb-0 align-items-center align-items-sm-start mt-4"
//                                     id="menu"
//                                 >
//                                     {user && (
//                                         <li
//                                             className="nav-item"
//                                             data-bs-toggle="collapse"
//                                             data-bs-target="#navbarSupportedContent"
//                                             aria-controls="navbarSupportedContent"
//                                             aria-expanded="false"
//                                             aria-label="Toggle navigation"
//                                         >
//                                             <NavLink
                                                
//                                                 to="/stocks"
//                                                 className="nav-link align-middle px-0 py-4"
//                                             >
//                                                 <span className="bi bi-bar-chart navitems h3">
//                                                     {" "}
//                                                     Stocks{" "}
//                                                 </span>
//                                             </NavLink>
//                                         </li>
//                                     )}

//                                     {/* <li
//                                         className="nav-item"
//                                         data-bs-toggle="collapse"
//                                         data-bs-target="#navbarSupportedContent"
//                                         aria-controls="navbarSupportedContent"
//                                         aria-expanded="false"
//                                         aria-label="Toggle navigation"
//                                     >
//                                         <NavLink
                                            
//                                             to="/news"
//                                             className="nav-link align-middle px-0 py-4"
//                                         >
//                                             <span className="bi bi-bar-chart navitems h3 bi bi-newspaper">
//                                                 {" "}
//                                                 News
//                                             </span>
//                                         </NavLink>
//                                     </li> */}

//                                     {/* <li className="nav-item">
//                                         <NavLink
                                        
//                                         to="/ipo"
//                                         className="nav-link align-middle px-0 py-4"
//                                         > */}
//                                         {/* <span className="bi bi-bar-chart navitems h3 bi bi-clipboard-data">
//                                             {" "}
//                                             Ipo
//                                         </span>
//                                         </NavLink>
//                                     </li> */}

//                                     {user && (
//                                         <li
//                                             className="nav-item"
//                                             data-bs-toggle="collapse"
//                                             data-bs-target="#navbarSupportedContent"
//                                             aria-controls="navbarSupportedContent"
//                                             aria-expanded="false"
//                                             aria-label="Toggle navigation"
//                                         >
//                                             <NavLink
                                                
//                                                 to="portfolio"
//                                                 className="nav-link align-middle px-0 py-4"
//                                             >
//                                                 <span className="bi bi-bar-chart navitems h3 bi bi-pie-chart">
//                                                     {" "}
//                                                     Portfolioiadad
//                                                 </span>
//                                             </NavLink>
//                                         </li>
//                                     )}

//                                     <li
//                                         className="nav-item"
//                                         data-bs-toggle="collapse"
//                                         data-bs-target="#navbarSupportedContent"
//                                         aria-controls="navbarSupportedContent"
//                                         aria-expanded="false"
//                                         aria-label="Toggle navigation"
//                                     >
//                                         <NavLink
                                            
//                                             to="/ranking"
//                                             className="nav-link align-middle px-0 py-4"
//                                         >
//                                             <span className="bi bi-bar-chart navitems h3 bi bi-box-arrow-left bi bi-people">
//                                                 {" "}
//                                                 Rankings
//                                             </span>
//                                         </NavLink>
//                                     </li>

//                                     <li
//                                         className="nav-item"
//                                         data-bs-toggle="collapse"
//                                         data-bs-target="#navbarSupportedContent"
//                                         aria-controls="navbarSupportedContent"
//                                         aria-expanded="false"
//                                         aria-label="Toggle navigation"
//                                     >
//                                         <NavLink
                                            
//                                             to="/rules"
//                                             className="nav-link align-middle px-0 py-4"
//                                         >
//                                             <span className="bi bi-bar-chart navitems h3 bi bi-file-earmark-ruled">
//                                                 {" "}
//                                                 Rules
//                                             </span>
//                                         </NavLink>
//                                     </li>

//                                     {!user && (
//                                         <li
//                                             className="nav-item"
//                                             data-bs-toggle="collapse"
//                                             data-bs-target="#navbarSupportedContent"
//                                             aria-controls="navbarSupportedContent"
//                                             aria-expanded="false"
//                                             aria-label="Toggle navigation"
//                                         >
//                                             <NavLink
                                                
//                                                 to="/login"
//                                                 className="nav-link align-middle text-center px-0 py-4"
//                                             >
//                                                 <span className="bi bi-box-arrow-in-right navitems h3">
//                                                     {" "}
//                                                     Login
//                                                 </span>
//                                             </NavLink>
//                                             {/* <NavLink
                                                
//                                                 to="/register"
//                                                 className="nav-link align-middle px-0 py-4"
//                                             >
//                                                 <span className="bi bi-person-plus navitems h3">
//                                                     {" "}
//                                                     Register
//                                                 </span>
//                                             </NavLink> */}
//                                         </li>
//                                     )}

//                                     {user && (
//                                         <button
//                                             className="h5 bi bi-box-arrow-left align-items-center align-items-sm-start my-5 mt-5 logoutbutton py-2 px-3"
//                                             onClick={handleLogout}
//                                         >
//                                             {" "}
//                                             Logout
//                                         </button>
//                                     )}
//                                 </ul>
//                                 <hr />
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </nav>
//         </>
//     );
// };

// export default Navbar;
