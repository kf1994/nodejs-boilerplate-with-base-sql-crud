const bcrypt = require("bcryptjs");

const logger = require("../../config/bunyan").createLogger("admins/controller");

module.exports.createAdmin = async (req, res) => {
	try {
		const admin = await req.gdb.single(req.conn, "admins", undefined, {
			where: { column: "email", value: req.body.email, op: "eq" },
		});
		if (admin) {
			return res.status(409).json({
				success: false,
				msg: "Admin with this email already exists.",
			});
		}

		req.body.password = bcrypt.hashSync(req.body.password, 10);

		await req.gdb.create(req.conn, "admins", req.body);

		res.status(201).json({ msg: "Successfully created admin." });
	} catch (err) {
		logger.error(err);
		return res.status(400).send({
			msg: "Something went wrong! Can not create admin account.",
		});
	}
};

module.exports.updateAdmin = async (req, res) => {
	try {
		if (req.body.password2) {
			req.body.password = bcrypt.hashSync(req.body.password2, 10);
		}
		delete req.body.password2;
		delete req.body.createdAt;
		delete req.body.updatedAt;

		await req.gdb.update(req.conn, "admins", req.params.id, req.body);

		res.status(204).json({ msg: "Successfully updated admin." });
	} catch (err) {
		logger.error(err);
		return res.status(400).send({
			msg: "Something went wrong! Can not update admin account.",
		});
	}
};
