import api from "./api";

// =====================================================
// REGISTER NEW USER
// =====================================================

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

// =====================================================
// LOGIN USER
// =====================================================

export const loginUser = async (userData) => {
  const response = await api.post("/auth/login", userData);

  // Debug: check the exact response from backend
  console.log("=================================");
  console.log("LOGIN API RESPONSE:");
  console.log(response.data);
  console.log("TOKEN FROM RESPONSE:");
  console.log(response.data?.token);
  console.log("=================================");

  return response.data;
};

// =====================================================
// GET CURRENTLY LOGGED-IN USER
// =====================================================

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};