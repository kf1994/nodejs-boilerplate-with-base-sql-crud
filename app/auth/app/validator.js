module.exports.loginValidator = (req, res, next) => {
	const loginPin = parseInt(req.body.loginPin);
	if (!loginPin || typeof loginPin !== "number") {
		return res.status(400).json({ msg: "Please provide a valid login pin" });
	}
	next();
};
