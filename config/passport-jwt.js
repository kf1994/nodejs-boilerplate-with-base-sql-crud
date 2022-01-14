const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const pool = require("./db");

const opts = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: process.env.JWT_TOKEN_SECRET,
	passReqToCallback: true,
};

module.exports = passport => {
	passport.serializeUser(function (user, done) {
		done(null, user);
	});

	passport.deserializeUser(function (user, done) {
		done(null, user);
	});

	passport.use(
		"admin-login",
		new JwtStrategy(opts, async (req, jwt_payload, done) => {
			try {
				const token = req.headers.authorization.split(" ")[1];
				const [rows] = await pool.query("SELECT * FROM admins WHERE email = ? AND JWTToken = ? ", [
					jwt_payload.email,
					token,
				]);
				if (!rows.length) {
					return done(null, false, { msg: "Admin doesn't exist." });
				}
				const is_token_exist = rows[0].JWTToken && rows[0].JWTToken !== "";
				if (!is_token_exist) {
					return done(null, false, { msg: "Token expired" });
				}
				return done(null, rows[0]);
			} catch (err) {
				return done(err, null, { msg: "Error verifying app user token" });
			}
		})
	);
	passport.use(
		"app-login",
		new JwtStrategy(opts, async (req, jwt_payload, done) => {
			try {
				const [rows] = await pool.query("SELECT * FROM users WHERE loginPin = ?", [jwt_payload.loginPin]);
				if (!rows.length) {
					return done(null, false, { msg: "App User doesn't exist." });
				}
				const token = req.headers.authorization.split(" ")[1];
				const is_token_exist = rows[0].JWTToken && rows[0].JWTToken !== "" && token === rows[0].JWTToken;
				if (!is_token_exist) {
					return done(null, false, { msg: "Token expired" });
				}
				return done(null, rows[0]);
			} catch (err) {
				return done(err, null, { msg: "Error verifying app user token" });
			}
		})
	);
};
