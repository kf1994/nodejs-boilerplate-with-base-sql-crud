const passport = require("passport");
const multer = require("multer");
const moment = require("moment");

const logger = require("../config/bunyan.js").createLogger("helper");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./images/patients");
	},
	filename: function (req, file, cb) {
		cb(null, "patient-" + moment(new Date()).format("YYYY-MM-DD-HH-mm-ss") + ".webp");
	},
});
module.exports.upload = multer({ storage: storage });

module.exports.rand = (low, high) => {
	return Math.floor(Math.random() * (high - low) + low);
};

module.exports.checkStringValue = value => {
	return !(!value || value === "");
};

module.exports.authenticate = (req, res, next) => {
	let strategy;
	const deviceType = req.get("Device-Type");
	if (deviceType && (deviceType.toLowerCase() === "android" || deviceType.toLowerCase() === "ios")) {
		strategy = "app-login";
	} else {
		strategy = "admin-login";
	}
	passport.authenticate(strategy, { session: false }, (err, user, info) => {
		if (err) {
			logger.error(err);
			return res.status(401).send({ msg: "Error verifying token" });
		}

		//authentication error
		if (!user) {
			return res.status(401).send({ msg: info.message || "Unauthorized" });
		}

		//success
		req.logIn(user, function (err) {
			if (err) {
				logger.error(err);
				return res.status(401).send({ msg: "Error verifying token" });
			}
			return next();
		});
	})(req, res, next);
};
