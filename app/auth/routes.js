const router = require("express").Router();

/**
 * App auth routes
 */
router.use("/app", require("./app/routes"));

/**
 * Admin auth routes
 */
router.use("/admin", require("./admin/routes"));

module.exports = router;
