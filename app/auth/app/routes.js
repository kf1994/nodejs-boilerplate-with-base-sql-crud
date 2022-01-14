const router = require("express").Router();

const { logout, login } = require("./controller");
const { loginValidator } = require("./validator");

router.post("/logout", logout);
router.post("/login", loginValidator, login);

module.exports = router;
