require("dotenv").config();

const fs = require("fs");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const __main__ = async () => {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		port: process.env.DB_PORT,
		multipleStatements: true,
	});

	try {
		// let sql = '';
		// const baseDir = './app/';
		// const modules = fs.readdirSync(baseDir);
		// for(let i=0; i<modules.length; i++) {
		//     const dirPath = baseDir+modules[i];
		//     if(fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
		//         if(fs.existsSync(dirPath+'/model.sql')) {
		//             sql += fs.readFileSync(dirPath+'/model.sql').toString();
		//         }
		//     }
		// }

		await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE}`);
		await connection.changeUser({ database: process.env.DB_DATABASE });
		await connection.beginTransaction();

		const sql = fs.readFileSync("db.sql").toString();
		// await connection.query('SET FOREIGN_KEY_CHECKS=0; \n' + sql + '\nSET FOREIGN_KEY_CHECKS=1;');
		await connection.query(sql);

		let admin = {
			email: process.env.ADMIN_EMAIL || "admin@example.com",
			password: process.env.ADMIN_PASSWORD || "1234567",
			fullName: "Admin",
		};

		admin.password = await bcrypt.hashSync(admin.password, 10);
		await connection.query("INSERT INTO admins SET ?", [admin]);

		const user = {
			email: process.env.USER_EMAIL || "user@example.com",
			loginPin: process.env.USER_LOGIN_PIN || "11223",
			fullName: "Dummy User",
		};
		await connection.query("INSERT INTO users SET ?", [user]);

		await connection.commit();
	} catch (err) {
		console.log(err);
		await connection.rollback();
		throw err;
	}
};

__main__()
	.then(() => {
		console.log("Setup executed successfully!");
		process.exit();
	})
	.catch(() => {
		console.log("Error executing setup!");
		process.exit(1);
	});
