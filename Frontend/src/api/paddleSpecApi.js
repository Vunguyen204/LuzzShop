import http from "./http";
import { localizeApiMessage, missingLabel } from "../config/paddleSpecs";

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const BASE_URL = `${API_ORIGIN}/api/admin/paddle-specs`;

export const listPaddleSpecs = () => http.get(BASE_URL).then(({ data }) => data);
export const getPaddleSpec = (productId) => http.get(`${BASE_URL}/${productId}`).then(({ data }) => data);
export const createPaddleSpec = (productId) => http.post(`${BASE_URL}/${productId}`, {}).then(({ data }) => data);
export const updatePaddleTechnical = (productId, payload) => http.put(`${BASE_URL}/${productId}/technical`, payload).then(({ data }) => data);
export const updatePaddleScores = (productId, payload) => http.put(`${BASE_URL}/${productId}/scores`, payload).then(({ data }) => data);
export const submitPaddleSpec = (productId) => http.post(`${BASE_URL}/${productId}/submit`, {}).then(({ data }) => data);
export const confirmPaddleSpec = (productId, payload = {}) => http.post(`${BASE_URL}/${productId}/confirm`, payload).then(({ data }) => data);
export const reviewPaddleSpec = (productId, payload) => http.post(`${BASE_URL}/${productId}/review`, payload).then(({ data }) => data);
export const addPaddleSource = (productId, payload) => http.post(`${BASE_URL}/${productId}/sources`, payload).then(({ data }) => data);
export const updatePaddleSource = (productId, sourceId, payload) => http.put(`${BASE_URL}/${productId}/sources/${sourceId}`, payload).then(({ data }) => data);
export const deletePaddleSource = (productId, sourceId) => http.delete(`${BASE_URL}/${productId}/sources/${sourceId}`).then(({ data }) => data);
export const reviewPaddleSource = (productId, sourceId, payload) => http.post(`${BASE_URL}/${productId}/sources/${sourceId}/review`, payload).then(({ data }) => data);

export const getApiError = (error, fallback) => {
  const message = localizeApiMessage(error.response?.data?.message || fallback);
  const details = error.response?.data?.details;
  return Array.isArray(details) && details.length ? `${message}: ${details.map(missingLabel).join(", ")}` : message;
};
