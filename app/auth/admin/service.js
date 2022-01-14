const logger = require("../../../config/bunyan").createLogger("auth/admin/service");

module.exports.destroyAdminToken = async (connection, token) => {
	return new Promise(async (resolve, reject) => {
		try {
			const sqlQuery = `UPDATE admins SET JWTToken='' WHERE JWTToken = ?`;
			const [rows] = await connection.query(sqlQuery, [token]);
			return resolve(rows.affectedRows);
		} catch (err) {
			logger.error(err);
			return reject(err);
		}
	});
};
