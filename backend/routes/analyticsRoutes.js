const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// Rute untuk mendapatkan ringkasan analitik
router.get("/overview", analyticsController.getAnalyticsOverview);

// Rute untuk mendapatkan data trend (grafik)
router.get("/trend", analyticsController.getAnalyticsTrend);

// Rute untuk mendapatkan statistik petugas tertentu
router.get("/petugas/:nama", analyticsController.getAnalyticsByPetugas);

module.exports = router;
