import axios from "axios";

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_ORIGIN}/api/auth`;

export const register = async (data) => {
  return axios.post(
    `${API_URL}/register`,
    data
  );
};

export const login = async (data) => {
  return axios.post(
    `${API_URL}/login`,
    data
  );
};
