const logger = require("../../../config/bunyan").createLogger("auth/app/service");

module.exports.destroyAppToken = async (connection, token) => {
	return new Promise(async (resolve, reject) => {
		try {
			const sqlQuery = `UPDATE users SET JWTToken='' WHERE JWTToken = ?`;
			const [rows] = await connection.query(sqlQuery, [token]);
			return resolve(rows.affectedRows);
		} catch (err) {
			logger.error(err);
			return reject(err);
		}
	});
};
