const jwt = require("jsonwebtoken");

const logger = require("../../../config/bunyan").createLogger("auth/app/controller");
const { destroyAppToken } = require("./service");

/**
 *
 * @module auth/app/
 * @api auth/app/logout
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
			await destroyAppToken(req.conn, bearer[1]);
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
 * @module auth/app/
 * @api auth/app/login
 * @function
 * @param {import('express').Request<>} req.
 * @param {import('express').Response} res
 * @param req.body.loginPin {Number} login pin of the user.
 * @return {Object} 200 | 401 status
 *
 */
module.exports.login = async (req, res) => {
	const loginPin = req.body.loginPin;

	try {
		// verifying user verification code
		const user = await req.gdb.single(req.conn, "users", undefined, {
			where: { column: "loginPin", value: loginPin, op: "eq" },
		});

		if (!user) {
			return res.status(401).json({ msg: "The code you entered is incorrect or expired." });
		}

		// generating JWT token
		const payload = {
			id: user.id,
			loginPin: user.loginPin,
		};
		const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET, {
			expiresIn: 3600000000000000,
		});

		const JWTUpdated = {
			updatedAt: new Date(),
			JWTToken: token,
		};

		await req.gdb.update(req.conn, "users", user.id, JWTUpdated);
		delete user.password;

		res.status(200).json({ success: true, ...user, JWTToken: "Bearer " + token });
	} catch (err) {
		logger.error(err);
		return res.status(400).send({
			msg: "Something went wrong! Login is not processed successfully.",
		});
	}
};
