// src/hooks/useSignup.jsx
import { useState } from "react";

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const signup = async ({ email, razorpayId, password }) => {
    setIsLoading(true);
    setError(null);

    if (!email && !razorpayId) {
      setError("Please provide either a Gmail or a Razorpay ID.");
      setIsLoading(false);
      return;
    }

    try {
      // Replace with your actual signup API endpoint
      const response = await fetch("/api/signup", {
        method: "POST",
        body: JSON.stringify({ email, razorpayId, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to sign up");
      }

      // Handle successful signup logic (e.g., redirect to login page)
      console.log("Signup successful");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { signup, error, isLoading };
};
