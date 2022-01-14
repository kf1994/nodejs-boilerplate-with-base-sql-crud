const router = require("express").Router();

const { createAdmin, updateAdmin } = require("./controller");
const { createAdminValidator, updateAdminValidator } = require("./validator");

router.post("/", createAdminValidator, createAdmin);
router.patch("/:id", updateAdminValidator, updateAdmin);

module.exports = router;
