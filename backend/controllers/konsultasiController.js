const Konsultasi = require("../models/Konsultasi");
const Pasien = require("../models/Pasien");
const Joi = require("@hapi/joi");
const asyncHandler = require("../middlewares/asyncHandler");
const { VALID_PETUGAS, VALIDATION_CONFIG, PAGINATION_CONFIG } = require(
  "../constants"
);

const soapField = Joi.object({
  S: Joi.string().allow("").optional(),
  O: Joi.object({
    tensi: Joi.object({
      sistolik: Joi.number()
        .min(VALIDATION_CONFIG.TENSISISTOLIK_MIN)
        .max(VALIDATION_CONFIG.TENSISISTOLIK_MAX)
        .allow(null)
        .optional(),
      diastolik: Joi.number()
        .min(VALIDATION_CONFIG.TENSIDIASTOLIK_MIN)
        .max(VALIDATION_CONFIG.TENSIDIASTOLIK_MAX)
        .allow(null)
        .optional(),
    }).optional(),
    tinggiBadan: Joi.number()
      .min(VALIDATION_CONFIG.TINGGI_BADAN_MIN)
      .max(VALIDATION_CONFIG.TINGGI_BADAN_MAX)
      .allow(null)
      .optional(),
    beratBadan: Joi.number()
      .min(VALIDATION_CONFIG.BERAT_BADAN_MIN)
      .max(VALIDATION_CONFIG.BERAT_BADAN_MAX)
      .allow(null)
      .optional(),
    tambahan: Joi.string().allow("").max(2000).optional(),
  }).optional(),
  A: Joi.string().allow("").max(2000).optional(),
  P: Joi.string().allow("").max(2000).optional(),
});

const therapyField = Joi.string().allow("").max(2000).optional();

const petugasKonsultasiField = Joi.string()
  .valid(...VALID_PETUGAS)
  .messages({
    "any.only": "Petugas konsultasi tidak valid",
  });

// Schema untuk pembuatan konsultasi baru (petugas wajib)
const konsultasiCreateSchema = Joi.object({
  pasienId: Joi.string().required().messages({
    "any.required": "ID Pasien wajib diisi",
  }),
  soap: soapField.required(),
  therapy: therapyField,
  petugasKonsultasi: petugasKonsultasiField
    .required()
    .messages({
      "any.required": "Petugas konsultasi wajib diisi",
    }),
});

// Schema untuk update: petugasKonsultasi opsional.
// Jika tidak dikirim (mis. auto-save), nilai lama di database dipertahankan.
const konsultasiUpdateSchema = Joi.object({
  soap: soapField.optional(),
  therapy: therapyField,
  petugasKonsultasi: petugasKonsultasiField.optional(),
});

// @route   POST api/konsultasi
// @desc    Buat entri konsultasi baru
// @access  Private
exports.createKonsultasi = asyncHandler(async (req, res) => {
  const { error, value } = konsultasiCreateSchema.validate(req.body, {
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

  const pasien = await Pasien.findById(value.pasienId);
  if (!pasien) {
    return res.status(404).json({ message: "Pasien tidak ditemukan" });
  }

  const newKonsultasi = new Konsultasi(value);
  const konsultasi = await newKonsultasi.save();

  await Pasien.findByIdAndUpdate(value.pasienId, {
    $push: {
      logAktivitas: {
        aksi: "CREATE_KONSULTASI",
        oleh: value.petugasKonsultasi,
        catatan: `Konsultasi baru dibuat (ID Konsultasi: ${konsultasi._id})`,
      },
    },
  });

  res.status(201).json({ message: "Konsultasi berhasil dibuat", konsultasi });
});

// @route   GET api/konsultasi/:id
// @desc    Dapatkan detail konsultasi
// @access  Private
exports.getKonsultasiById = asyncHandler(async (req, res) => {
  const konsultasi = await Konsultasi.findById(req.params.id).populate(
    "pasienId",
    "nama noKartu"
  );
  if (!konsultasi) {
    return res.status(404).json({ message: "Konsultasi tidak ditemukan" });
  }
  res.json(konsultasi);
});

// @route   GET api/konsultasi/pasien/:pasienId
// @desc    Dapatkan semua konsultasi untuk pasien tertentu
// @access  Private
exports.getKonsultasiByPasienId = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || PAGINATION_CONFIG.DEFAULT_PAGE, 1);
  const requestedLimit = parseInt(req.query.limit, 10) || PAGINATION_CONFIG.DEFAULT_LIMIT;
  const limit = Math.min(requestedLimit, PAGINATION_CONFIG.MAX_LIMIT);

  const result = await Konsultasi.paginate(
    { pasienId: req.params.pasienId },
    { page, limit, sort: { tanggalKonsultasi: -1 } }
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
});

// @route   PUT api/konsultasi/:id
// @desc    Update entri konsultasi
// @access  Private
exports.updateKonsultasi = asyncHandler(async (req, res) => {
  const { error, value } = konsultasiUpdateSchema.validate(req.body, {
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

  const updatedKonsultasi = await Konsultasi.findByIdAndUpdate(
    req.params.id,
    {
      ...value,
      $push: {
        logAktivitas: {
          aksi: "UPDATE",
          oleh: value.petugasKonsultasi || req.user.nama,
          catatan: `Data konsultasi diupdate oleh ${
            value.petugasKonsultasi || req.user.nama
          }`,
        },
      },
    },
    { new: true, runValidators: true }
  );

  res.json({
    message: "Konsultasi berhasil diupdate",
    konsultasi: updatedKonsultasi,
  });
});

// @route   DELETE api/konsultasi/:id
// @desc    Hapus entri konsultasi
// @access  Private
exports.deleteKonsultasi = asyncHandler(async (req, res) => {
  const konsultasi = await Konsultasi.findById(req.params.id);

  if (!konsultasi) {
    return res.status(404).json({ message: "Konsultasi tidak ditemukan" });
  }

  await Konsultasi.findByIdAndDelete(req.params.id);

  console.log(
    `Konsultasi dengan ID ${req.params.id} dihapus oleh ${req.user.nama}.`
  );

  res.json({ message: "Konsultasi berhasil dihapus" });
});
