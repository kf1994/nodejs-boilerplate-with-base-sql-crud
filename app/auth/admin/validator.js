const { checkStringValue } = require("./../../../common/helper");

module.exports.loginValidator = (req, res, next) => {
	if (!checkStringValue(req.body.email)) {
		return res.status(400).json({ msg: "Please provide a valid email" });
	}

	if (!checkStringValue(req.body.password)) {
		return res.status(400).json({ msg: "Please provide a valid password" });
	}
	next();
};
