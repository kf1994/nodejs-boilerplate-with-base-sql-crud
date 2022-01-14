/**
 * Exporting whitelist domain for CORS
 */
module.exports.cors_whitelist = ["localhost:3000", "localhost:4000", "http://localhost:4000", "http://localhost:3000"];

/**
 * Exporting urls which doesnt need transactional based connection
 */
module.exports.transaction_excluded_routes = [];
