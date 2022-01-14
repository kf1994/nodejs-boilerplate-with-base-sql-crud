require("dotenv").config();

const express = require("express");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const flash = require("connect-flash");
const passport = require("passport");
const path = require("path");
const cors = require("cors");

const logger = require(path.join(__dirname, "./config/bunyan")).createLogger("init");
// const { cors_whitelist } = require(path.join(__dirname, "./common/constants"));

module.exports.init = async function init() {
	try {
		/**
		 * Initializing express
		 */
		const app = express();
		app.use("/images", express.static("images"));

		app.use(compression());
		app.use(express.json({ limit: "50mb" }));
		app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 100000 }));
		app.use(cookieParser());
		app.use(helmet());
		app.use(flash());

		/**
		 * Adding CORS middleware
		 */
		// const cors = function (req, res, next) {
		//   const whitelist = cors_whitelist;
		//   const origin = req.headers.origin;
		//   const host = req.headers.host;
		//   if (whitelist.indexOf(origin) > -1 || whitelist.indexOf(host) > -1) {
		//     if (origin) {
		//       res.setHeader("Access-Control-Allow-Origin", origin);
		//     } else {
		//       res.setHeader("Access-Control-Allow-Origin", host);
		//     }
		//   } else {
		//     if (origin) {
		//       logger.info("Not Allowed", req.headers.origin);
		//     } else {
		//       logger.info("Not Allowed", req.headers.host);
		//     }
		//     return res.status(403).send("Not Allowed...");
		//   }
		//   res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
		//   res.setHeader(
		//     "Access-Control-Allow-Headers",
		//     "Content-Type,Authorization"
		//   );
		//   next();
		// };
		// app.use(cors);
		app.use(cors());

		/**
		 * Passport middleware
		 */
		app.use(passport.initialize({ session: false }));
		require("./config/passport-jwt")(passport);

		/**
		 * Attaching routes to server
		 */
		const appRoutes = require("./route_handler");
		app.use("/", appRoutes);

		/**
		 * starting server
		 */
		const port = process.env.PORT || 4000;
		app.listen(port)
			.on("error", error => logger.error(error))
			.on("listening", () => logger.info(`Express listening on ${port}`));
	} catch (error) {
		logger.error("Error in initializing", error);
	}
};
