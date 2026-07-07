/**
 * Utilitaires de géolocalisation et calcul de distances
 */

/**
 * Calcule la distance en kilomètres entre deux points GPS
 * utilisant la formule de Haversine (Haversine formula)
 *
 * @param {number} lat1 - Latitude du premier point
 * @param {number} lon1 - Longitude du premier point
 * @param {number} lat2 - Latitude du second point
 * @param {number} lon2 - Longitude du second point
 * @returns {number} Distance en kilomètres
 */
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formate une distance en km avec 1 décimale
 *
 * @param {number} distanceKm - Distance en km
 * @returns {string} Distance formatée
 */
export const formatDistance = (distanceKm) => {
  return distanceKm.toFixed(1);
};

/**
 * Ouvre Google Maps avec un itinéraire vers les coordonnées fournies
 *
 * @param {number} latitude - Latitude de la destination
 * @param {number} longitude - Longitude de la destination
 * @param {string} label - Label optionnel pour la destination
 * @returns {Promise} Résultat de l'ouverture du lien
 */
export const openGoogleMapsDirections = async (latitude, longitude, label = '') => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}${label ? '&destination_place_id=' + label : ''}`;

  try {
    const Linking = require('react-native').Linking;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      console.error('Google Maps URL not supported');
      return false;
    }
  } catch (error) {
    console.error('Error opening Google Maps:', error);
    return false;
  }
};

/**
 * Centre les centres de santé autour de la position utilisateur
 *
 * @param {array} centres - Array de centres
 * @param {number} userLat - Latitude utilisateur
 * @param {number} userLon - Longitude utilisateur
 * @returns {array} Centres triés par distance
 */
export const sortCentresByDistance = (centres, userLat, userLon) => {
  return centres
    .filter((centre) => centre.latitude && centre.longitude)
    .map((centre) => ({
      ...centre,
      distance: getDistanceKm(userLat, userLon, centre.latitude, centre.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);
};
