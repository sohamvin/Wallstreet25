import { useState, useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import DesktopNavbar from "./components/DesktopNavbar.jsx";
import Home from "./pages/Home.jsx";
import Footer from "./components/Footer.jsx";
import Rules from "./pages/Rules.jsx";
import Stocks from "./pages/Stocks.jsx";
import StocksDetail from "./pages/StocksDetail.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Login from "./pages/Login.jsx";
import { useAuthContext } from "./hooks/useAuthContext";
import { ToastContainer } from "react-toastify";
import MyWishlist from "./pages/wishlist.jsx";
import "react-toastify/dist/ReactToastify.css";
import Ranking from "./pages/Ranking.jsx";

function App() {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  
  // Initialize sidebarOpen: open for desktop (>=768px), closed for mobile.
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  
  useEffect(() => {
    // Listen for window resize events to update sidebar state on mobile.
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    // Check initial window size and add resize listener.
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Auto-close sidebar on mobile on route change.
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);
  
  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }
  
  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
  
      {!user && <DesktopNavbar />}
      {!user && <Footer />}
  
      <div style={{ display: "flex", flexDirection: "row", flexGrow: 1 }}>
        {user && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        <div
          style={{
            flexGrow: 1,
            padding: "16px",

// OYYYYYYYYYYY HAPPY BIRTHDAY NASLELEA KANDA NE SANGITLA IKDE SMTG MEDIA QUERY TAK ANI MOVILE NA NONE KR 






            width: user && window.innerWidth >= 800
              ? sidebarOpen
              ? "calc(100% - 230px)"
              : "100%"
              : "100%",
            marginLeft: user && window.innerWidth >= 768 ? (sidebarOpen ? "230px" : "0") : "0",
            transition: "width 0.3s ease-in-out, margin-left 0.3s ease-in-out",
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/stocks"
              element={user ? <Stocks /> : <Navigate to="/login" />}
             
            />
            <Route
              path="/stocksdetail/:id"
              element={user ? <StocksDetail /> : <Navigate to="/login" />}
            />
            <Route 
             path="/wishlist"  
             element={user ? <MyWishlist/> : <Navigate to="/login"/>}
             />
            <Route
              path="/portfolio"
              element={user ? <Portfolio /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={!user ? <Login /> : <Navigate to="/" />}
            />
            <Route path="/rules" element={<Rules />} />
            <Route path="/ranking" element={<Ranking />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
