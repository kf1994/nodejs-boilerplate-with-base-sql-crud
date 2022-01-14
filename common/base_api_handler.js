const pool = require("../config/db");

const logger = require("../config/bunyan.js").createLogger("base-handler");
const registry = require("./registry");

const splitURL = url => {
	let parts;
	if (url[url.length - 1] === "/") {
		parts = url.substring(1, url.length - 1).split("/");
	} else {
		parts = url.substring(1, url.length).split("/");
	}

	return parts;
};

module.exports.checkRegistry = async (req, res, next) => {
	try {
		const slug = splitURL(req.path)[0];
		if (registry[slug]) {
			next();
		} else {
			return res.status(404).send({ msg: "Resource not found!" });
		}
	} catch (e) {
		logger.error(e);
		return res.status(400).send(e);
	}
};

module.exports.applyMethod = async (req, res) => {
	const parts = splitURL(req.path);
	const slug = parts[0];

	try {
		switch (req.method) {
			case "GET":
				if (parts[1]) {
					const data = await req.gdb.single(pool, slug, parts[1], req.query);
					return res.status(200).send(data);
				} else {
					const data = await req.gdb.all(pool, slug, req.query);
					return res.status(200).send(data);
				}
			case "POST":
				await req.gdb.create(req.conn, slug, req.body);
				return res.status(200).send({ msg: "Successfully Created!" });
			case "PUT":
			case "PATCH":
				if (parts[1]) {
					await req.gdb.update(req.conn, slug, parts[1], req.body);
					return res.status(200).send({ msg: "Successfully Updated!" });
				} else {
					return res.status(400).send({ msg: "Please provide a valid primary key!" });
				}
			case "DELETE":
				if (parts[1]) {
					await req.gdb.delete(req.conn, slug, parts[1]);
					return res.status(200).send({ msg: "Successfully Deleted!" });
				} else {
					return res.status(400).send({ msg: "Please provide a valid primary key!" });
				}
			default:
				return res.status(404).send({ msg: "Resource not found!" });
		}
	} catch (err) {
		logger.error(err);
		return res.status(err.errorCode).send({ msg: err.msg });
	}
};
