/**
 * Configuration de l'API backend
 */

// Remplacez cette URL par votre URL backend réelle
// Pour le développement local: http://192.168.x.x:8000 (adresse IP de votre machine)
// Pour la production: https://api.votredomaine.com
export const API_BASE_URL = 'http://192.168.100.81:8000/api';

export const API_ENDPOINTS = {
  // Centres
  CENTRES: '/centres/',
  CENTRE_DETAIL: (id) => `/centres/${id}/`,

  // Autres endpoints à ajouter selon vos besoins
};
