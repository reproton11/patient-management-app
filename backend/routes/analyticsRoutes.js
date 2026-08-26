const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { getAnalyticsSummary } = require("../controllers/analyticsController");

router.use(auth);

// @route   GET api/analytics/summary
router.get("/summary", getAnalyticsSummary);

module.exports = router;
