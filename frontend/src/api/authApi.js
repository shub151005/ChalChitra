import axiosClient from "./axiosClient";

export const signupUser = async (payload) => {
  const response = await axiosClient.post("/auth/signup", payload);
  return response.data;
};

export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const response = await axiosClient.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axiosClient.get("/auth/me");
  return response.data;
};