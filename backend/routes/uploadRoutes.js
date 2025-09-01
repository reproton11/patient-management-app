const express = require("express");
const controller = require("../controllers/uploadController");
const router = express.Router();

/* POST /api/upload/:konsultasiId */
router.post("/:konsultasiId", controller.uploadFileToKonsultasi);

/* GET /api/upload/file/:fileId */
router.get("/file/:fileId", controller.getFile);

/* DELETE /api/upload/file/:konsultasiId/:fileGridFsId */
router.delete("/file/:konsultasiId/:fileGridFsId", controller.deleteFile);

module.exports = router;
