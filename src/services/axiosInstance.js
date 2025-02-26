import axios from "axios";
import { useLogout } from "../hooks/useLogout"; 

const API_URL = import.meta.env.VITE_BACKEND_URL; 


const axiosNoAuthInstance = axios.create({
  baseURL: API_URL,
});

const axiosAuthInstance = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor for the authenticated axios instance.
axiosAuthInstance.interceptors.request.use(
  (config) => {
    const userToken = localStorage.getItem("user");
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for the authenticated axios instance.
axiosAuthInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // if (error.response && error.response.status === 401) {
    //   // Handle unauthorized error, e.g., redirect to login page
    //   console.error("Unauthorized access - possibly invalid token");
    // }
    if(error.response && error.response.status===403){
      console.log("logout");
      // alert("log");
      const logout= useLogout();
      logout();
      window.location.href = "/login";
      
    }
    return Promise.reject(error);
  }
);

export { axiosAuthInstance, axiosNoAuthInstance };
