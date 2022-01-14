const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const logger = require("../../../config/bunyan").createLogger("auth/admin/controller");
const { destroyAdminToken } = require("./service");

const comparePassword = (given, actual) => {
	return new Promise(function (resolve, reject) {
		bcrypt.compare(given, actual, function (err, isMatch) {
			if (err) {
				reject(err);
			} else {
				resolve(isMatch);
			}
		});
	});
};

/**
 *
 * @module auth/admin/
 * @api auth/admin/logout
 * @function
 * @param {import('express').Request<>} req.
 * @param {import('express').Response} res
 * @param req.headers.authorization {String} The header authorization token.
 * @param req.session {Object} The session object.
 * @return {Object} 200 status with msg as string
 *
 */
module.exports.logout = async (req, res) => {
	const token = req.headers.authorization;
	if (token) {
		const bearer = token.split(" ");
		try {
			await destroyAdminToken(req.conn, bearer[1]);
		} catch (err) {
			logger.log(err);
		}
	} else {
		if (req.session) req.session.destroy();
	}
	return res.status(200).json({ msg: "logged out successfully" });
};

/**
 *
 * @module auth/admin/
 * @api auth/admin/login
 * @function
 * @param {import('express').Request<>} req.
 * @param {import('express').Response} res
 * @param req.body.email {String} admin email.
 * @param req.body.password {String} admin password.
 * @return {Object} 200 | 401 status
 *
 */
module.exports.login = async (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

	try {
		// getting admin by email
		const admin = await req.gdb.single(req.conn, "admins", undefined, {
			where: { column: "email", value: email, op: "eq" },
		});
		if (!admin) {
			return res.status(403).json({ msg: "Admin not found!" });
		}

		// comparing password
		const isMatch = await comparePassword(password, admin.password);

		if (!isMatch) {
			return res.status(403).json({ msg: "Password doesn't match!" });
		}

		// generating JWT token
		const payload = { id: admin.id, email: admin.email };
		const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET, {
			expiresIn: 3600000000000000,
		});

		const JWTUpdated = {
			updatedAt: new Date(),
			JWTToken: token,
		};

		await req.gdb.update(req.conn, "admins", admin.id, JWTUpdated);
		delete admin.password;

		res.status(200).json({ success: true, ...admin, JWTToken: "Bearer " + token });
	} catch (err) {
		logger.error(err);
		return res.status(400).send({
			msg: "Something went wrong! Login is not processed successfully.",
		});
	}
};

/**
 *
 * @module auth/admin/
 * @api auth/admin/access-token
 * @function
 * @param {import('express').Request<>} req.
 * @param {import('express').Response} res
 * @param req.body.access_token {String} access_token.
 * @return {Object} 200 | 401 status
 *
 */
module.exports.jwtLogin = async (req, res) => {
	const access_token = req.body.access_token.split(" ")[1];

	try {
		// getting admin by jwt token
		const admin = await req.gdb.single(req.conn, "admins", undefined, {
			where: { column: "JWTToken", value: access_token, op: "eq" },
		});
		if (!admin) {
			return res.status(401).json({ msg: "Admin not found!" });
		}

		res.status(200).json({ success: true, ...admin, JWTToken: "Bearer " + admin.JWTToken });
	} catch (err) {
		logger.error(err);
		return res.status(400).send({
			msg: "Something went wrong! Login is not processed successfully.",
		});
	}
};
