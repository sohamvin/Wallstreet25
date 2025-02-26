import React, { useState } from "react";
import { useLogin } from "../hooks/useLogin.jsx";

import { FaUser, FaLock, FaSpinner } from "react-icons/fa"; // Importing React Icons
import "./Login.css";

const Login = () => {
  const [username, setName] = useState("");
  const [password, setPass] = useState("");

  const { login, error, isLoading } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);

  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h4>User Login</h4>

        {/* Username Input */}
        <div className="input-container">
          <FaUser className="input-icon" />
          <input
            type="text"
            placeholder="Email Address"
            onChange={(e) => setName(e.target.value)}
            value={username}
            required 
          />
        </div>

        {/* Password Input */}
        <div className="input-container">
          <FaLock className="input-icon" />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPass(e.target.value)}
            value={password}
            required
          />
        </div>

        {/* Submit Button */}
        <button className="login-btn" type="submit" disabled={isLoading}>
          {isLoading ? <FaSpinner className="spinner" /> : "Log In"}
        </button>

        {/* Error Message */}
        {error && <p className="error-msg">{error}</p>}
      </form>
    </div>
  );
};

export default Login;
