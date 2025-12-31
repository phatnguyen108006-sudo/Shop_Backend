const express = require("express");
const router = express.Router();
const { getCustomers } = require("../controllers/customers.controller");
const { requireAuth, requireRole } = require("../middlewares/auth");

// Route: GET /api/v1/customers
router.get("/", requireAuth, requireRole("admin"), getCustomers);

module.exports = router;