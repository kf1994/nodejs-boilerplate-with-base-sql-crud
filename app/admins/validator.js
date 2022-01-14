const { checkStringValue } = require("./../../common/helper");

module.exports.createAdminValidator = (req, res, next) => {
	if (!checkStringValue(req.body.fullName)) {
		return res.status(400).json({ msg: "Please provide a valid full name" });
	}

	if (!checkStringValue(req.body.email)) {
		return res.status(400).json({ msg: "Please provide a valid email" });
	}

	if (!checkStringValue(req.body.password)) {
		return res.status(400).json({ msg: "Please provide a valid password" });
	}

	next();
};

module.exports.updateAdminValidator = (req, res, next) => {
	if (!checkStringValue(req.body.fullName)) {
		return res.status(400).json({ msg: "Please provide a valid full name" });
	}

	if (!checkStringValue(req.body.email)) {
		return res.status(400).json({ msg: "Please provide a valid email" });
	}

	next();
};
