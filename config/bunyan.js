"use strict";

const bunyan = require("bunyan");
const bunyanFormat = require("bunyan-format");
const { moduleNotConfigured } = require("./helper");

const path = require("path");
const appRootDir = path.dirname(require.main.filename);

if (process.env.NODE_ENV === "production") {
	const formatOut = bunyanFormat({
		outputMode: "short",
	});

	//creating bunyan logging
	module.exports.createLogger = function createLogger(name) {
		return bunyan.createLogger({
			name,
			serializers: bunyan.stdSerializers,
			streams: [
				{
					level: "info",
					path: `${appRootDir}/logs/info.production.log`,
					stream: formatOut,
				},
			],
		});
	};
} else if (process.env.NODE_ENV === "test") {
	moduleNotConfigured("bunyan");
} else if (process.env.NODE_ENV === "beta") {
	moduleNotConfigured("bunyan");
} else {
	// If no NODE_ENV configured, then it's considered as Development
	//Declaring output mode.
	const formatOut = bunyanFormat({
		outputMode: "short",
	});

	//creating bunyan logging
	module.exports.createLogger = function (name) {
		return bunyan.createLogger({
			name,
			src: true,
			serializers: bunyan.stdSerializers,
			stream: formatOut,
		});
	};
}
