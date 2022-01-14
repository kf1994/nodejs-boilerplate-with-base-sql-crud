const router = require("express").Router();
const { authenticate } = require("./common/helper");

/**
 * Auth routes
 */
router.use("/auth", require("./app/auth/routes"));

/**
 * Attaching Other Modules
 */
router.use("/admins", authenticate, require("./app/admins/routes"));

module.exports = router;
