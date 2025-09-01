const express = require("express");
const router = express.Router();
const pasienController = require("../controllers/pasienController");

router.post("/", pasienController.daftarPasien);
router.get("/", pasienController.getSemuaPasien);
router.get("/:id", pasienController.getPasienById);
router.put("/:id", pasienController.updatePasien);
router.delete("/:id", pasienController.deletePasien);
router.get(
  "/:id/riwayat-kunjungan",
  pasienController.getRiwayatKunjunganPasien
);

module.exports = router;
