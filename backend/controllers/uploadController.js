/* backend/controllers/uploadController.js */
const mongoose = require("mongoose");
const multer  = require("multer");
const Konsultasi = require("../models/Konsultasi");

let gridfsBucket;          // akan diisi setelah Mongo ready
const uploadMemory = multer({   // simpan dulu di memory
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2 MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Hanya PDF diizinkan"));
  },
}).single("file");

/* --------------------------------------------------
   Inisialisasi bucket (dipanggil dari server.js)
-------------------------------------------------- */
function initGridFS(conn) {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
}

/* --------------------------------------------------
   Helper upload ke GridFS
-------------------------------------------------- */
async function saveToGridFS(buffer, filename, metadata) {
  return new Promise((resolve, reject) => {
    const uploadStream = gridfsBucket.openUploadStream(filename, { metadata });
    uploadStream.end(buffer);
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", reject);
  });
}

/* --------------------------------------------------
   Upload file
-------------------------------------------------- */
const uploadFileToKonsultasi = (req, res) => {
  uploadMemory(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(400).json({ message: multerErr.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Tidak ada file" });
    }

    const { pasienId, tipe, petugasUpload } = req.body;
    const { konsultasiId } = req.params;

    if (!pasienId || !tipe || !petugasUpload) {
      return res.status(400).json({ message: "Metadata kurang" });
    }

    try {
      const konsultasi = await Konsultasi.findById(konsultasiId);
      if (!konsultasi) {
        return res.status(404).json({ message: "Konsultasi tidak ditemukan" });
      }

      const fileId = await saveToGridFS(
        req.file.buffer,
        `${Date.now()}-${req.file.originalname}`,
        { pasienId, konsultasiId, tipe, petugas: petugasUpload }
      );

      konsultasi.files.push({
        namaFile: req.file.originalname,
        tipe,
        gridFsId: fileId,
        tanggalUpload: new Date(),
      });

      konsultasi.logAktivitas.push({
        aksi: "UPLOAD_FILE",
        oleh: petugasUpload,
        catatan: `File ${req.file.originalname} (${tipe}) diupload`,
      });

      await konsultasi.save();

      res.json({ message: "File berhasil diupload", konsultasi });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal upload", error: err.message });
    }
  });
};

/* --------------------------------------------------
   Stream file
-------------------------------------------------- */
const getFile = (req, res) => {
  if (!gridfsBucket) return res.status(500).json({ message: "GridFS belum siap" });

  const downloadStream = gridfsBucket.openDownloadStream(
    new mongoose.Types.ObjectId(req.params.fileId)
  );
  downloadStream.on("error", () =>
    res.status(404).json({ message: "File tidak ditemukan" })
  );
  downloadStream.pipe(res);
};

/* --------------------------------------------------
   Delete file
-------------------------------------------------- */
const deleteFile = async (req, res) => {
  const { konsultasiId, fileGridFsId } = req.params;
  const { petugasPenghapus } = req.body;
  if (!petugasPenghapus)
    return res.status(400).json({ message: "Petugas penghapusan diperlukan" });
  if (!gridfsBucket)
    return res.status(500).json({ message: "GridFS belum siap" });

  try {
    const konsultasi = await Konsultasi.findById(konsultasiId);
    if (!konsultasi) return res.status(404).json({ message: "Konsultasi tidak ditemukan" });

    const idx = konsultasi.files.findIndex(
      (f) => f.gridFsId.toString() === fileGridFsId
    );
    if (idx === -1)
      return res.status(404).json({ message: "File tidak ditemukan dalam konsultasi" });

    await gridfsBucket.delete(new mongoose.Types.ObjectId(fileGridFsId));
    konsultasi.files.splice(idx, 1);
    konsultasi.logAktivitas.push({
      aksi: "DELETE_FILE",
      oleh: petugasPenghapus,
      catatan: `File ${konsultasi.files[idx]?.namaFile} dihapus`,
    });
    await konsultasi.save();
    res.json({ message: "File berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus file", error: err.message });
  }
};

/* --------------------------------------------------
   Export
-------------------------------------------------- */
module.exports = {
  initGridFS,
  uploadFileToKonsultasi,
  getFile,
  deleteFile,
};