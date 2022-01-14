const _ = require("underscore");
const registry = require("../common/registry");
const logger = require("../config/bunyan").createLogger("dbh");

const gdb = {};

const decodeString = (str = "") => {
	str = decodeURIComponent(str).toString();
	str = str.replace(/'/g, "''");

	return str;
};

const addColumns = (columns = "") => {
	columns = decodeURIComponent(columns).toString();
	if (columns === "" || columns === `''`) return " * ";
	else return columns;
};

const joinSearchColumns = (columns = "") => {
	columns = addColumns(columns);
	columns = columns.split(",");
	columns = _.without(columns, "");
	return `LOWER(CONCAT(${columns.join(", ' ', ")}))`;
};

const removeProtectedCols = (model, rows) => {
	return _.map(rows, function (row) {
		return _.omit(row, registry[model].protectedColumns);
	});
};

const checkUniqueCols = async (connection, model, values, id) => {
	let whereQuery = "WHERE ";
	if (id) {
		whereQuery += "(";
	}
	for (let i = 0; i < registry[model].unique.length; i++) {
		whereQuery += ` ${registry[model].unique[i]} = '${values[registry[model].unique[i]]}'`;

		if (i !== registry[model].unique.length - 1) {
			whereQuery += ` OR`;
		}
	}
	if (id) {
		whereQuery += `) AND id != '${id}'`;
	}

	const sqlQuery = `SELECT * FROM ${model} ${whereQuery} LIMIT 1`;
	const [rows] = await connection.query(sqlQuery, [values]);
	if (!rows[0]) {
		return { exists: false };
	}

	let key = "";
	for (let x of registry[model].unique) {
		if (rows[0][x] === values[x]) {
			key = x;
			break;
		}
	}
	return { exists: true, key };
};

const makeCriteria = where => {
	if (!where.column || where.column === "") return null;

	const operator = where.op && where.op !== "" ? where.op : "eq";

	switch (operator) {
		case "eq":
			if (Array.isArray(where.value)) {
				return `${where.column} IN (${where.value})`;
			}
			return `${where.column} = '${where.value}'`;
		case "ne":
			if (Array.isArray(where.value)) {
				return `${where.column} NOT IN (${where.value})`;
			}
			return `${where.column} != '${where.value}'`;
		case "lt":
			return `${where.column} < '${where.value}'`;
		case "le":
			return `${where.column} <= '${where.value}'`;
		case "gt":
			return `${where.column} > '${where.value}'`;
		case "ge":
			return `${where.column} >= '${where.value}'`;
		case "like":
			return `${where.column} LIKE '%${where.value}%'`;
		case "bt":
			return `${where.column} BETWEEN '${where.value[0]}' AND '${where.value[1]}'`;
	}

	return null;
};

const addWheres = where => {
	const whType = where.group && where.group !== "" ? where.group.toLowerCase() : null;

	if (!whType) return makeCriteria(where);

	let whereGroup = [];
	for (let i = 0; i < where.children.length; i++) {
		const criteria = addWheres(where.children[i]);
		if (criteria) whereGroup.push(criteria);
	}

	if (whType === "or") {
		return "(" + whereGroup.join(" OR ") + ")";
	}

	if (whType === "and") {
		return "(" + whereGroup.join(" AND ") + ")";
	}

	return null;
};

const getWhere = (where = undefined, primaryKey = undefined, id = undefined) => {
	if (where === undefined || where === {}) {
		if (!id) return "";
		return `WHERE ${primaryKey}=${id}`;
	}

	let wh = addWheres(where);
	wh = wh ? " WHERE " + wh : null;

	return wh;
};

const searchOrWhere = opts => {
	if (opts.search !== undefined && opts.search !== "" && opts.searchColumns !== undefined) {
		const searchCols = joinSearchColumns(opts.searchColumns);
		const search = decodeString(opts.search);
		return ` WHERE ${searchCols} LIKE '%${search}%'`;
	} else {
		const where = getWhere(opts.where);

		if (!where && where !== "") {
			throw `Please provide a valid where clause..`;
		}

		return where;
	}
};

gdb.all = async (connection, model, opts = {}) => {
	return new Promise(async (resolve, reject) => {
		try {
			let sqlQuery = `SELECT ${addColumns(opts.columns)} FROM ${model}`;
			let countQuery = `SELECT COUNT(*) AS count FROM ${model}`;

			const where = searchOrWhere(opts);

			sqlQuery += where;
			countQuery += where;

			if (opts.orderBy !== undefined && opts.order !== undefined) {
				sqlQuery += ` ORDER BY ${opts.orderBy} ${opts.order}`;
			}

			if (opts.offset !== undefined && opts.limit !== undefined) {
				sqlQuery += ` LIMIT ${opts.limit} OFFSET ${opts.offset * opts.limit}`;
			}

			let [rows] = await connection.query(sqlQuery, []);
			const [total_records] = await connection.query(countQuery);

			if (registry[model].protectedColumns && registry[model].protectedColumns.length > 0) {
				rows = removeProtectedCols(model, rows);
			}

			return resolve({ data: rows, total_records: total_records[0].count });
		} catch (err) {
			logger.error(`Error in fetching records ${model}: ${err}`);
			return reject({ msg: `Error in fetching ${model}`, errorCode: 400 });
		}
	});
};

gdb.single = async (connection, model, id, opts = {}) => {
	return new Promise(async (resolve, reject) => {
		const primaryKey = registry[model].primaryKey;
		const where = getWhere(opts.where, primaryKey, id);

		if (!where && where !== "") {
			return reject({
				msg: `Error fetching ${model}! Please provide a valid where clause..`,
				errorCode: 400,
			});
		}

		const sqlQuery = `SELECT ${addColumns(opts.columns)} FROM ${model} ${where}`;
		try {
			let [rows] = await connection.query(sqlQuery);

			if (registry[model].protectedColumns && registry[model].protectedColumns.length > 0) {
				rows = removeProtectedCols(model, rows);
			}

			// if (rows.length === 0) {
			// 	return reject({ msg: `No record found!`, errorCode: 404 });
			// }

			return resolve(rows[0]);
		} catch (err) {
			logger.error(`Error in fetching single ${model}: ${err}`);
			return reject({ msg: `Error in fetching single ${model}`, errorCode: 400 });
		}
	});
};

gdb.create = async (connection, model, values) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (registry[model].unique && registry[model].unique.length > 0) {
				let data = await checkUniqueCols(connection, model, values, undefined);
				if (data.exists) {
					return reject({
						msg: `${model} with ${data.key} = ${values[data.key]} already exists`,
						errorCode: 400,
					});
				}
			}
			const sqlQuery = `INSERT INTO ${model} set ?`;
			const [rows] = await connection.query(sqlQuery, [values]);
			return resolve(rows.insertId);
		} catch (err) {
			logger.error(`Error in inserting ${model}: ${err}`);
			return reject({ msg: `Error in inserting ${model}`, errorCode: 400 });
		}
	});
};

gdb.update = async (connection, model, id, values, opts = {}) => {
	return new Promise(async (resolve, reject) => {
		const primaryKey = registry[model].primaryKey;

		const where = getWhere(opts.where, primaryKey, id);

		if (!where && where !== "") {
			return reject({
				msg: `Error fetching ${model}! Please provide a valid where clause..`,
				errorCode: 400,
			});
		}

		if (values.hasOwnProperty(primaryKey)) {
			delete values[primaryKey];
		}

		if (registry[model].unique && registry[model].unique.length > 0) {
			let data = await checkUniqueCols(connection, model, values, id);
			if (data.exists) {
				return reject({
					msg: `${model} with ${data.key} = ${values[data.key]} already exists`,
					errorCode: 400,
				});
			}
		}
		const sqlQuery = `UPDATE ${model} set ? ${where}`;
		try {
			const [rows] = await connection.query(sqlQuery, [values]);
			if (rows.affectedRows > 0) {
				return resolve(rows.affectedRows);
			} else {
				return reject({ msg: `${model} with ${primaryKey}=${id} doesn't exists!`, errorCode: 404 });
			}
		} catch (err) {
			logger.error(`Error in updating ${model}: ${err}`);
			return reject({ msg: `Error updating ${model}`, errorCode: 400 });
		}
	});
};

gdb.delete = async (connection, model, id, opts = {}) => {
	return new Promise(async (resolve, reject) => {
		const primaryKey = registry[model].primaryKey;
		const where = getWhere(opts.where, primaryKey, id);

		if (!where && where !== "") {
			return reject({
				msg: `Error fetching ${model}! Please provide a valid where clause..`,
				errorCode: 400,
			});
		}

		const sqlQuery = `DELETE FROM ${model} ${where}`;
		try {
			const [rows] = await connection.query(sqlQuery, [id]);
			if (rows.affectedRows > 0) {
				return resolve(rows.affectedRows);
			} else {
				return reject({ msg: `${model} with ${primaryKey}=${id} doesn't exists!`, errorCode: 404 });
			}
		} catch (err) {
			logger.error(`Error in deleting ${model}: ${err}`);
			return reject({ msg: `Error deleting ${model}`, errorCode: 400 });
		}
	});
};

gdb.count = async (connection, model, opts = {}) => {
	return new Promise(async (resolve, reject) => {
		try {
			let countQuery = `SELECT COUNT(*) AS count FROM ${model}`;

			const where = searchOrWhere(opts);
			countQuery += where;

			const [total_records] = await connection.query(countQuery);

			return resolve(total_records[0].count);
		} catch (err) {
			logger.error(`Error in fetching records ${model}: ${err}`);
			return reject({ msg: `Error in fetching ${model}`, errorCode: 400 });
		}
	});
};

module.exports = gdb;
