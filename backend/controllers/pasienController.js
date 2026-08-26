const Pasien = require("../models/Pasien");
const Konsultasi = require("../models/Konsultasi");
const Joi = require("@hapi/joi");
const asyncHandler = require("../middlewares/asyncHandler");
const {
  VALID_PETUGAS,
  START_ANGKA_MAP,
  LETTER_GROUPS_MAP,
  VALIDATION_CONFIG,
  PAGINATION_CONFIG,
} = require("../constants");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Normalisasi nama ke Title Case: "budi SANTOSO" -> "Budi Santoso"
const toTitleCase = (str) =>
  String(str)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|\s)[a-z]/g, (ch) => ch.toUpperCase());

const pasienBaseFields = {
  nama: Joi.string()
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      "string.pattern.base": "Nama hanya boleh mengandung huruf dan spasi",
      "any.required": "Nama wajib diisi",
    }),
  alamat: Joi.object({
    provinsi: Joi.string().required(),
    kabupaten: Joi.string().required(),
    kecamatan: Joi.string().required(),
    kelurahan: Joi.string().required(),
  })
    .required()
    .messages({
      "any.required": "Alamat lengkap wajib diisi",
    }),
  jenisKelamin: Joi.string()
    .valid("Laki-laki", "Perempuan", "Other")
    .required()
    .messages({
      "any.required": "Jenis kelamin wajib diisi",
      "any.only": "Jenis kelamin tidak valid",
    }),
  tanggalLahir: Joi.date().iso().required().messages({
    "any.required": "Tanggal lahir wajib diisi",
    "date.base": "Tanggal lahir tidak valid",
    "date.iso": "Format tanggal lahir harus YYYY-MM-DD",
  }),
  noHP: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(VALIDATION_CONFIG.NO_HP_MIN_LENGTH)
    .max(VALIDATION_CONFIG.NO_HP_MAX_LENGTH)
    .required()
    .messages({
      "string.pattern.base": "No. HP hanya boleh angka",
      "string.min": `No. HP minimal ${VALIDATION_CONFIG.NO_HP_MIN_LENGTH} digit`,
      "string.max": `No. HP maksimal ${VALIDATION_CONFIG.NO_HP_MAX_LENGTH} digit`,
      "any.required": "No. HP wajib diisi",
    }),
  tensi: Joi.object({
    sistolik: Joi.number()
      .min(VALIDATION_CONFIG.TENSISISTOLIK_MIN)
      .max(VALIDATION_CONFIG.TENSISISTOLIK_MAX),
    diastolik: Joi.number()
      .min(VALIDATION_CONFIG.TENSIDIASTOLIK_MIN)
      .max(VALIDATION_CONFIG.TENSIDIASTOLIK_MAX),
  }).optional(),
  tinggiBadan: Joi.number()
    .min(VALIDATION_CONFIG.TINGGI_BADAN_MIN)
    .max(VALIDATION_CONFIG.TINGGI_BADAN_MAX)
    .optional(),
  beratBadan: Joi.number()
    .min(VALIDATION_CONFIG.BERAT_BADAN_MIN)
    .max(VALIDATION_CONFIG.BERAT_BADAN_MAX)
    .optional(),
};

// Schema untuk pendaftaran pasien baru (petugas wajib)
const pasienSchema = Joi.object({
  ...pasienBaseFields,
  petugasPendaftaran: Joi.string()
    .valid(...VALID_PETUGAS)
    .required()
    .messages({
      "any.required": "Petugas pendaftaran wajib diisi",
      "any.only": "Petugas pendaftaran tidak valid",
    }),
});

// Schema untuk update pasien: petugas opsional.
// Jika dikirim, dipakai sebagai identitas pada log aktivitas & field petugas.
const pasienUpdateSchema = Joi.object({
  ...pasienBaseFields,
  petugasPendaftaran: Joi.string()
    .valid(...VALID_PETUGAS)
    .optional(),
});

const generateNoKartu = async (nama) => {
  const hurufAwalInput = nama.charAt(0).toUpperCase();
  const groupKey = LETTER_GROUPS_MAP[hurufAwalInput] || hurufAwalInput;
  const baseAngka =
    START_ANGKA_MAP[groupKey] !== undefined
      ? START_ANGKA_MAP[groupKey]
      : START_ANGKA_MAP["DEFAULT"];

  let regexPattern;
  if (groupKey === "C_G_GROUP") {
    regexPattern = new RegExp(`^[CG]-\\d{5}$`);
  } else {
    regexPattern = new RegExp(`^${hurufAwalInput}-\\d{5}$`);
  }

  const lastPasienInGroup = await Pasien.findOne({
    noKartu: regexPattern,
  }).sort({ noKartu: -1 });

  let angkaUrut;

  if (lastPasienInGroup) {
    const lastAngkaStr = lastPasienInGroup.noKartu.split("-")[1];
    const lastAngka = parseInt(lastAngkaStr, 10);

    if (lastAngka >= baseAngka) {
      angkaUrut = lastAngka + 1;
    } else {
      const specificBaseNoKartu = `${hurufAwalInput}-${String(
        baseAngka
      ).padStart(5, "0")}`;
      const existingSpecificBase = await Pasien.findOne({
        noKartu: specificBaseNoKartu,
      });

      if (existingSpecificBase) {
        angkaUrut = lastAngka + 1;
      } else {
        angkaUrut = baseAngka;
      }
    }
  } else {
    angkaUrut = baseAngka > 0 ? baseAngka : 1;
  }

  return `${hurufAwalInput}-${String(angkaUrut).padStart(5, "0")}`;
};

// @route   POST api/pasien
// @desc    Daftarkan pasien baru
// @access  Private
exports.daftarPasien = asyncHandler(async (req, res) => {
  const { error, value } = pasienSchema.validate(req.body, {
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

  // Normalisasi nama ke Title Case sebelum diproses/disisipkan
  const nama = toTitleCase(value.nama);
  const petugasPendaftaran = value.petugasPendaftaran;

  let noKartu;
  let isUnique = false;
  let attempts = 0;
  const MAX_ATTEMPTS = VALIDATION_CONFIG.MAX_CARD_GENERATION_ATTEMPTS;

  while (!isUnique && attempts < MAX_ATTEMPTS) {
    noKartu = await generateNoKartu(nama);
    const existingPasien = await Pasien.findOne({ noKartu });
    if (!existingPasien) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    return res.status(500).json({
      message: "Gagal membuat nomor kartu unik setelah beberapa percobaan.",
    });
  }

  const newPasien = new Pasien({
    noKartu,
    ...value,
    nama,
    petugasPendaftaran,
    logAktivitas: [
      {
        aksi: "CREATE",
        oleh: petugasPendaftaran,
        catatan: "Pasien baru didaftarkan",
      },
    ],
  });

  const pasien = await newPasien.save();

  const newKonsultasi = new Konsultasi({
    pasienId: pasien._id,
    soap: {
      O: {
        tensi: pasien.tensi,
        tinggiBadan: pasien.tinggiBadan,
        beratBadan: pasien.beratBadan,
        tambahan: "N ",
      },
    },
    petugasKonsultasi: petugasPendaftaran,
  });
  await newKonsultasi.save();

  res.status(201).json({ message: "Pendaftaran pasien berhasil", pasien });
});

// @route   GET api/pasien
// @desc    Dapatkan semua daftar pasien dengan pagination dan filtering
// @access  Private
exports.getSemuaPasien = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || PAGINATION_CONFIG.DEFAULT_PAGE, 1);
  const requestedLimit = parseInt(req.query.limit, 10) || PAGINATION_CONFIG.DEFAULT_LIMIT;
  const limit = Math.min(requestedLimit, PAGINATION_CONFIG.MAX_LIMIT);
  const { search, tanggalDaftar, jenisKelamin, petugasPendaftaran } = req.query;

  const query = {};
  if (search) {
    const escaped = escapeRegex(String(search));
    query.$or = [
      { nama: { $regex: escaped, $options: "i" } },
      { noKartu: { $regex: escaped, $options: "i" } },
      { noHP: { $regex: escaped, $options: "i" } },
    ];
  }
  if (tanggalDaftar) {
    const startOfDay = new Date(tanggalDaftar);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tanggalDaftar);
    endOfDay.setHours(23, 59, 59, 999);
    if (!Number.isNaN(startOfDay.getTime())) {
      query.tanggalDaftar = { $gte: startOfDay, $lte: endOfDay };
    }
  }
  if (jenisKelamin) {
    query.jenisKelamin = String(jenisKelamin);
  }
  if (petugasPendaftaran) {
    query.petugasPendaftaran = String(petugasPendaftaran);
  }

  const ALLOWED_SORT_FIELDS = [
    "createdAt",
    "updatedAt",
    "nama",
    "noKartu",
    "tanggalDaftar",
    "tanggalLahir",
  ];
  const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy)
    ? req.query.sortBy
    : "createdAt";
  const order = req.query.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: order };

  const result = await Pasien.paginate(query, { page, limit, sort });

  res.json({
    pasien: result.docs,
    totalItems: result.totalDocs,
    totalPages: result.totalPages,
    currentPage: result.page,
  });
});

// @route   GET api/pasien/:id
// @desc    Dapatkan detail pasien berdasarkan ID
// @access  Private
exports.getPasienById = asyncHandler(async (req, res) => {
  const pasien = await Pasien.findById(req.params.id);
  if (!pasien) {
    return res.status(404).json({ message: "Pasien tidak ditemukan" });
  }
  res.json(pasien);
});

// @route   PUT api/pasien/:id
// @desc    Update data pasien
// @access  Private
exports.updatePasien = asyncHandler(async (req, res) => {
  const { error, value } = pasienUpdateSchema.validate(req.body, {
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

  if (value.nama) {
    value.nama = toTitleCase(value.nama);
  }

  const pasienLama = await Pasien.findById(req.params.id);
  if (!pasienLama) {
    return res.status(404).json({ message: "Pasien tidak ditemukan" });
  }

  const changes = [];
  for (const key in value) {
    if (
      key !== "petugasUpdate" &&
      JSON.stringify(pasienLama[key]) !== JSON.stringify(value[key])
    ) {
      changes.push(
        `${key} dari '${JSON.stringify(
          pasienLama[key]
        )}' menjadi '${JSON.stringify(value[key])}'`
      );
    }
  }
  const catatanLog =
    changes.length > 0
      ? `Mengubah: ${changes.join(", ")}`
      : "Tidak ada perubahan signifikan";

  const petugasPelaku = value.petugasPendaftaran || req.user.nama;

  const updatedPasien = await Pasien.findByIdAndUpdate(
    req.params.id,
    {
      ...value,
      $push: {
        logAktivitas: {
          aksi: "UPDATE",
          oleh: petugasPelaku,
          catatan: catatanLog,
        },
      },
    },
    { new: true, runValidators: true }
  );

  res.json({
    message: "Data pasien berhasil diupdate",
    pasien: updatedPasien,
  });
});

// @route   DELETE api/pasien/:id
// @desc    Hapus pasien beserta seluruh konsultasinya
// @access  Private
exports.deletePasien = asyncHandler(async (req, res) => {
  const pasien = await Pasien.findById(req.params.id);

  if (!pasien) {
    return res.status(404).json({ message: "Pasien tidak ditemukan" });
  }

  await Pasien.findByIdAndDelete(req.params.id);
  await Konsultasi.deleteMany({ pasienId: req.params.id });

  console.log(
    `Pasien dengan ID ${req.params.id} dan konsultasi terkait dihapus oleh ${req.user.nama}.`
  );

  res.json({ message: "Pasien berhasil dihapus" });
});

// @route   GET api/pasien/stats
// @desc    Statistik ringkas untuk dashboard (hari/minggu/bulan ini + log aktivitas terbaru)
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today, week, month, total, todayPatients] = await Promise.all([
    Pasien.countDocuments({ tanggalDaftar: { $gte: startOfToday } }),
    Pasien.countDocuments({ tanggalDaftar: { $gte: startOfWeek } }),
    Pasien.countDocuments({ tanggalDaftar: { $gte: startOfMonth } }),
    Pasien.countDocuments(),
    Pasien.find({ tanggalDaftar: { $gte: startOfToday } })
      .select("nama noKartu tanggalDaftar")
      .sort({ tanggalDaftar: -1 })
      .lean(),
  ]);

  const recentActivity = await Pasien.aggregate([
    { $unwind: "$logAktivitas" },
    { $sort: { "logAktivitas.pada": -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        type: "Pasien",
        entityId: "$logAktivitas.oleh",
        entityName: "$nama",
        noKartu: "$noKartu",
        aksi: "$logAktivitas.aksi",
        oleh: "$logAktivitas.oleh",
        catatan: "$logAktivitas.catatan",
        pada: "$logAktivitas.pada",
      },
    },
  ]);

  res.json({
    stats: { today, week, month, total },
    recentPatients: todayPatients,
    recentActivity,
  });
});

// @route   GET api/pasien/:id/riwayat-kunjungan
// @desc    Dapatkan riwayat konsultasi pasien berdasarkan ID pasien
// @access  Private
exports.getRiwayatKunjunganPasien = asyncHandler(async (req, res) => {
  const konsultasi = await Konsultasi.find({ pasienId: req.params.id })
    .sort({ tanggalKonsultasi: -1 })
    .lean();

  if (konsultasi.length === 0) {
    return res.status(404).json({
      message: "Riwayat kunjungan tidak ditemukan untuk pasien ini",
    });
  }
  res.json(konsultasi);
});
