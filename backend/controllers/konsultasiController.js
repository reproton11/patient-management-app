const Konsultasi = require("../models/Konsultasi");
const Pasien = require("../models/Pasien");
const Joi = require("@hapi/joi");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream"); // Akan diinisialisasi di uploadController
const mongoosePaginate = require("mongoose-paginate-v2");

let gfs; // Variable global untuk GridFS
let gridfsBucket;
const conn = mongoose.connection;
conn.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads"); // Nama koleksi untuk GridFS
});

// Schema validasi Joi untuk konsultasi
const konsultasiSchema = Joi.object({
  pasienId: Joi.string().required().messages({
    "any.required": "ID Pasien wajib diisi",
  }),
  soap: Joi.object({
    S: Joi.string().allow("").optional(),
    O: Joi.object({
      tensi: Joi.object({
        sistolik: Joi.number().min(60).max(200).allow(null).optional(),
        diastolik: Joi.number().min(40).max(120).allow(null).optional(),
      }).optional(),
      tinggiBadan: Joi.number().min(50).max(250).allow(null).optional(),
      beratBadan: Joi.number().min(10).max(300).allow(null).optional(),
      tambahan: Joi.string().allow("").optional(),
    }).optional(),
    A: Joi.string().allow("").optional(),
    P: Joi.string().allow("").optional(),
  }).required(),
  therapy: Joi.string().allow("").optional(),
  petugasKonsultasi: Joi.string()
    .valid("Arif", "Rani", "Nunung", "Heni", "Maria", "Emy", "Fadil", "Rayhan")
    .required()
    .messages({
      "any.required": "Petugas konsultasi wajib diisi",
      "any.only": "Petugas konsultasi tidak valid",
    }),
  // files tidak divalidasi di sini, tapi di multer middleware
});

// @route   POST api/konsultasi
// @desc    Buat entri konsultasi baru
// @access  Public
exports.createKonsultasi = async (req, res) => {
  try {
    const { error, value } = konsultasiSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: error.details.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Pastikan pasienId valid
    const pasien = await Pasien.findById(value.pasienId);
    if (!pasien) {
      return res.status(404).json({ message: "Pasien tidak ditemukan" });
    }

    const newKonsultasi = new Konsultasi(value);
    const konsultasi = await newKonsultasi.save();

    // Log aktivitas
    pasien.logAktivitas.push({
      aksi: "CREATE_KONSULTASI",
      oleh: value.petugasKonsultasi,
      catatan: `Konsultasi baru dibuat (ID Konsultasi: ${konsultasi._id})`,
    });
    await pasien.save();

    res.status(201).json({ message: "Konsultasi berhasil dibuat", konsultasi });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   GET api/konsultasi/:id
// @desc    Dapatkan detail konsultasi
// @access  Public
exports.getKonsultasiById = async (req, res) => {
  try {
    const konsultasi = await Konsultasi.findById(req.params.id).populate(
      "pasienId",
      "nama noKartu"
    ); // Populasikan data pasien
    if (!konsultasi) {
      return res.status(404).json({ message: "Konsultasi tidak ditemukan" });
    }
    res.json(konsultasi);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Konsultasi tidak ditemukan" });
    }
    res.status(500).send("Server Error");
  }
};

// @route   GET api/konsultasi/pasien/:pasienId
// @desc    Dapatkan semua konsultasi untuk pasien tertentu
// @access  Public
exports.getKonsultasiByPasienId = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { tanggalKonsultasi: -1 },
    };
    const result = await Konsultasi.paginate(
      { pasienId: req.params.pasienId },
      options
    );

    if (result.docs.length === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada riwayat konsultasi untuk pasien ini" });
    }
    res.json({
      konsultasi: result.docs,
      totalItems: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "ID Pasien tidak valid" });
    }
    res.status(500).send("Server Error");
  }
};

// @route   PUT api/konsultasi/:id
// @desc    Update entri konsultasi
// @access  Public
exports.updateKonsultasi = async (req, res) => {
  const { petugasUpdate } = req.body;
  if (!petugasUpdate) {
    return res
      .status(400)
      .json({ message: "Nama petugas yang melakukan update diperlukan." });
  }

  try {
    const { error, value } = konsultasiSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: error.details.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    const konsultasiLama = await Konsultasi.findById(req.params.id);
    if (!konsultasiLama) {
      return res.status(404).json({ message: "Konsultasi tidak ditemukan" });
    }

    // Bangun catatan log perubahan
    const changes = [];
    // Ini bisa menjadi sangat kompleks jika membandingkan objek nested seperti SOAP.
    // Untuk sederhana, kita bisa log bahwa konsultasi diupdate.
    // Jika perlu detail, harus iterasi setiap field SOAP
    changes.push(`Konsultasi ID ${req.params.id} diupdate`);

    const updatedKonsultasi = await Konsultasi.findByIdAndUpdate(
      req.params.id,
      {
        ...value,
        $push: {
          logAktivitas: {
            aksi: "UPDATE",
            oleh: petugasUpdate,
            catatan: `Data konsultasi diupdate oleh ${petugasUpdate}`, // Contoh sederhana
          },
        },
        updatedAt: new Date(), // Mongoose timestamps akan otomatis, tapi bisa diset manual
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Konsultasi berhasil diupdate",
      konsultasi: updatedKonsultasi,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Konsultasi tidak ditemukan" });
    }
    res.status(500).send("Server Error");
  }
};

// @route   DELETE api/konsultasi/:id
// @desc    Hapus entri konsultasi
// @access  Public
exports.deleteKonsultasi = async (req, res) => {
  const { petugasPenghapus } = req.body;
  if (!petugasPenghapus) {
    return res
      .status(400)
      .json({ message: "Nama petugas yang melakukan penghapusan diperlukan." });
  }

  try {
    const konsultasi = await Konsultasi.findById(req.params.id);

    if (!konsultasi) {
      return res.status(404).json({ message: "Konsultasi tidak ditemukan" });
    }

    if (!gridfsBucket) {
      // Ini seharusnya tidak terjadi jika koneksi MongoDB sudah open, tapi sebagai fallback
      console.error(
        "GridFSBucket not initialized when trying to delete files."
      );
      return res
        .status(500)
        .json({ message: "Sistem penyimpanan file tidak siap." });
    }

    // Hapus file-file terkait di GridFS
    for (const fileRef of konsultasi.files) {
      if (gfs) {
        await gfs.remove({ _id: fileRef.gridFsId, root: "uploads" });
        console.log(
          `File GridFS ${fileRef.namaFile} (${fileRef.gridFsId}) dihapus.`
        );
      }
    }

    await Konsultasi.findByIdAndDelete(req.params.id);

    console.log(
      `Konsultasi dengan ID ${req.params.id} dihapus oleh ${petugasPenghapus}.`
    );

    res.json({ message: "Konsultasi berhasil dihapus" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Konsultasi tidak ditemukan" });
    }
    res.status(500).send("Server Error");
  }
};
