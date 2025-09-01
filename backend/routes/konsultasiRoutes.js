const express = require("express");
const router = express.Router();
const konsultasiController = require("../controllers/konsultasiController");

router.post("/", konsultasiController.createKonsultasi);
router.get("/:id", konsultasiController.getKonsultasiById);
router.get("/pasien/:pasienId", konsultasiController.getKonsultasiByPasienId); // Untuk riwayat kunjungan di luar profil
router.put("/:id", konsultasiController.updateKonsultasi);
router.delete("/:id", konsultasiController.deleteKonsultasi);

module.exports = router;
