/**
 * Determines if the Google Location instance needs its data refreshed
 * - data can be cached up to 30 days from last refresh date
 * @example
 * googleLocation.needsRefresh // true or false
 */
function needsRefresh () {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - thirtyDays >= this.updated_at;
};

module.exports = {
  needsRefresh,
};
