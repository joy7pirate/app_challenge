import axios from "axios";

const API_URL = "http://192.168.100.81:8000/api";

export const api = axios.create({
  baseURL: API_URL,
});
