const router = require("express").Router();

const { logout, login, jwtLogin } = require("./controller");
const { loginValidator } = require("./validator");

router.post("/logout", logout);
router.post("/access-token", jwtLogin);
router.post("/login", loginValidator, login);

module.exports = router;
