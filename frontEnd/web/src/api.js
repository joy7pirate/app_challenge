const API_URL = 'http://localhost:8000/api';

const get = async (path, params = {}) => {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
};

export const getMedecins = (params) => get('/medecins/', params);
export const getMedecinById = (id) => get(`/medecins/${id}/`);
export const getCentres = (params) => get('/centres/', params);
export const getDisponibilites = (params) => get('/disponibilites/', params);
