const app = require("express")();
const pool = require("./config/db");
const moment = require("moment");
const path = require("path");
const gdb = require("./common/db_handler");

const logger = require(path.join(__dirname, "./config/bunyan.js")).createLogger("routes");
const { transaction_excluded_routes } = require("./common/constants");
const { checkRegistry, applyMethod } = require("./common/base_api_handler");
const { authenticate } = require("./common/helper");

/**
 * Adding middleware on all routes to begin transaction if its not GET request or doesnt match specified routes
 */
app.use("/", async (req, res, next) => {
	req.startTime = new Date();
	logger.info(`${moment(req.startTime).format("DD-MM-YYYY hh:mm:ss")} | ${req.method} | ${req.url}`);

	req.gdb = gdb;

	if (req.method !== "GET" && !transaction_excluded_routes.includes(req.location)) {
		try {
			req.conn = await pool.getConnection();
			await req.conn.beginTransaction();
		} catch (e) {
			return res.status(400).send({ msg: "Error establishing database connection" });
		}
	} else {
		req.conn = undefined;
	}

	next();
});

/**
 * Adding middleware on all routes end to print route name, request name, time taken
 * Also to release connection if connection of pool exists
 * And also to commit or rollback on the basis of status code
 */
app.use(async (req, res, next) => {
	await res.on("finish", async () => {
		try {
			if (req.conn) {
				if (res.statusCode >= 200 && res.statusCode < 300) {
					await req.conn.commit();
				} else {
					await req.conn.rollback();
				}
				await req.conn.release();
			}
			const endTime = new Date();
			const responseTime = endTime.getTime() - req.startTime.getTime();
			const startTime = moment(req.startTime).format("DD-MM-YYYY hh:mm:ss");
			logger.info(`${startTime} | ${req.method} | ${req.originalUrl} ${res.statusCode} ${responseTime}ms`);
		} catch (e) {
			logger.error(e);
		}
	});
	next();
});

/**
 * attaching all routes
 */
app.use("/", require(path.join(__dirname, "./routes.js")));

/**
 * Handling call if no route found
 */
app.use("/", checkRegistry, authenticate, applyMethod);

module.exports = app;
