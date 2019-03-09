/**
 * Refreshes the location data of a Google Location
 * @param {object} googleAPI Google API util
 * @param {GoogleLocation} googleLocation location instance to refresh
 * @returns {GoogleLocation} refreshed Google Location instance
 */
async function refreshLocation(googleLocation, googleAPI) {
  const data = await googleAPI.getLocationData(googleLocation.place_id);
  return googleLocation.update({ ...data });
}

module.exports = {
  refreshLocation,
};
