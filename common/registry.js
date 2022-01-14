module.exports = {
	users: { model: "users", primaryKey: "id", unique: ["email"] },
	admins: { model: "admins", primaryKey: "id", unique: ["email"] },
};
