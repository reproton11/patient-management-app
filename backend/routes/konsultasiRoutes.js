const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const konsultasiController = require("../controllers/konsultasiController");

router.use(auth);

router.post("/", konsultasiController.createKonsultasi);
router.get("/pasien/:pasienId", konsultasiController.getKonsultasiByPasienId);
router.get("/:id", konsultasiController.getKonsultasiById);
router.put("/:id", konsultasiController.updateKonsultasi);
router.delete("/:id", konsultasiController.deleteKonsultasi);

module.exports = router;
