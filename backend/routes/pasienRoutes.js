const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const pasienController = require("../controllers/pasienController");

router.use(auth);

router.route("/").get(pasienController.getSemuaPasien).post(pasienController.daftarPasien);

router.get("/stats", pasienController.getDashboardStats);

router
  .route("/:id")
  .get(pasienController.getPasienById)
  .put(pasienController.updatePasien)
  .delete(pasienController.deletePasien);

router.get("/:id/riwayat-kunjungan", pasienController.getRiwayatKunjunganPasien);

module.exports = router;
