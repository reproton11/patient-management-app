// patient-management-app/backend/controllers/pasienController.js
const Pasien = require("../models/Pasien");
const Konsultasi = require("../models/Konsultasi");
const Joi = require("@hapi/joi");

// Schema validasi Joi untuk pendaftaran pasien
const pasienSchema = Joi.object({
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
    .min(10)
    .max(15)
    .required()
    .messages({
      "string.pattern.base": "No. HP hanya boleh angka",
      "string.min": "No. HP minimal 10 digit",
      "string.max": "No. HP maksimal 15 digit",
      "any.required": "No. HP wajib diisi",
    }),
  tensi: Joi.object({
    sistolik: Joi.number().min(60).max(200),
    diastolik: Joi.number().min(40).max(120),
  }).optional(),
  tinggiBadan: Joi.number().min(50).max(250).optional(),
  beratBadan: Joi.number().min(10).max(300).optional(),
  petugasPendaftaran: Joi.string()
    .valid("Arif", "Rani", "Nunung", "Heni", "Maria", "Emy", "Fadil", "Rayhan")
    .required()
    .messages({
      "any.required": "Petugas pendaftaran wajib diisi",
      "any.only": "Petugas pendaftaran tidak valid",
    }),
});

// === MAP ANGKA AWAL UNTUK SETIAP HURUF / GRUP HURUF ===
const startAngkaMap = {
  S: 14335,
  A: 13906,
  E: 6033,
  C_G_GROUP: 699, // Angka awal untuk grup C dan G
  D: 8908,
  Z: 2128,
  W: 1909,
  T: 2438,
  U: 1583,
  K: 2180,
  B: 2285,
  I: 2899,
  L: 2263,
  O: 607,
  P: 2095,
  R: 9043,
  J: 8944,
  F: 2248,
  M: 9120,
  H: 10502,
  N: 8000,
  DEFAULT: 0,
};

// === MAP UNTUK MENENTUKAN GRUP HURUF AWAL ===
const letterGroupsMap = {
  C: "C_G_GROUP",
  G: "C_G_GROUP",
  S: "S",
  A: "A",
  E: "E",
  D: "D",
  Z: "Z",
  W: "W",
  T: "T",
  U: "U",
  K: "K",
  B: "B",
  I: "I",
  L: "L",
  O: "O",
  P: "P",
  R: "R",
  J: "J",
  F: "F",
  M: "M",
  H: "H",
  N: "N",
};

// Helper untuk generate No. Kartu
const generateNoKartu = async (nama) => {
  const hurufAwalInput = nama.charAt(0).toUpperCase();

  // Tentukan nama grup untuk huruf awal ini
  const groupKey = letterGroupsMap[hurufAwalInput] || hurufAwalInput;

  // Ambil base angka dari map berdasarkan groupKey
  const baseAngka =
    startAngkaMap[groupKey] !== undefined
      ? startAngkaMap[groupKey]
      : startAngkaMap["DEFAULT"];

  // Buat regex untuk mencari semua nomor kartu yang termasuk dalam grup ini
  let regexPattern;
  if (groupKey === "C_G_GROUP") {
    regexPattern = new RegExp(`^[CG]-\\d{5}$`);
  } else {
    // Jika huruf awal tidak ada di letterGroupsMap, kita asumsikan itu adalah grupnya sendiri
    // Dan baseAngka akan berasal dari startAngkaMap[hurufAwalInput] atau DEFAULT
    regexPattern = new RegExp(`^${hurufAwalInput}-\\d{5}$`);
  }

  // Temukan angka urut terakhir untuk grup huruf ini
  // Menggunakan findOne dengan sort -1 dan regex akan mencari yang terbaru berdasarkan angka tertinggi
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
      const existingPasienWithBaseInGroup = await Pasien.findOne({
        noKartu: regexPattern, // Gunakan regex yang sama
      });
      // Kita perlu mengecek apakah baseAngka itu sendiri sudah dipakai
      // Daripada mencari seluruh groupKey, kita hanya perlu mencari satu specific noKartu.
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
// @access  Public
exports.daftarPasien = async (req, res) => {
  try {
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

    const { nama, petugasPendaftaran, ...otherData } = value;

    let noKartu;
    let isUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (!isUnique && attempts < MAX_ATTEMPTS) {
      noKartu = await generateNoKartu(nama);
      const existingPasien = await Pasien.findOne({ noKartu });
      if (!existingPasien) {
        isUnique = true;
      } else {
        console.warn(
          `Generated No. Kartu ${noKartu} already exists. Retrying... (Attempt ${
            attempts + 1
          })`
        );
      }
      attempts++;
      if (attempts === MAX_ATTEMPTS && !isUnique) {
        console.error(
          `Failed to generate a unique No. Kartu for ${nama} after ${MAX_ATTEMPTS} attempts.`
        );
        break;
      }
    }

    if (!isUnique) {
      return res.status(500).json({
        message: "Gagal membuat nomor kartu unik setelah beberapa percobaan.",
      });
    }

    const newPasien = new Pasien({
      noKartu,
      nama,
      petugasPendaftaran,
      ...otherData,
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
          tambahan: "Data awal dari pendaftaran",
        },
      },
      petugasKonsultasi: petugasPendaftaran,
    });
    await newKonsultasi.save();

    res.status(201).json({ message: "Pendaftaran pasien berhasil", pasien });
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Nomor kartu pasien sudah ada, coba lagi." });
    }
    res.status(500).send("Server Error");
  }
};

// @route   GET api/pasien
// @desc    Dapatkan semua daftar pasien dengan pagination dan filtering
// @access  Public
exports.getSemuaPasien = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    tanggalDaftar,
    jenisKelamin,
    petugasPendaftaran,
    sortBy = "createdAt", // Default sort by createdAt
    sortOrder = "desc", // Default descending order
  } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { nama: { $regex: search, $options: "i" } },
      { noKartu: { $regex: search, $options: "i" } },
      { noHP: { $regex: search, $options: "i" } },
    ];
  }
  if (tanggalDaftar) {
    const startOfDay = new Date(tanggalDaftar);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tanggalDaftar);
    endOfDay.setHours(23, 59, 59, 999);
    query.tanggalDaftar = { $gte: startOfDay, $lte: endOfDay };
  }
  if (jenisKelamin) {
    query.jenisKelamin = jenisKelamin;
  }
  if (petugasPendaftaran) {
    query.petugasPendaftaran = petugasPendaftaran;
  }

  //Konfigurasi sorting
  const sort = {};
  //Konversi sortOrder: 'asc' menjadi 1 dan 'desc' menjadi -1
  const order = sortOrder === "asc" ? 1 : -1;
  sort[sortBy] = order; // Contoh { nama: 1 } atau { tanggalDaftar: -1 }

  try {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sort, //Gunakan objek sort yang sudah dikonfigurasi
    };

    const result = await Pasien.paginate(query, options);

    res.json({
      pasien: result.docs,
      totalItems: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   GET api/pasien/:id
// @desc    Dapatkan detail pasien berdasarkan ID
// @access  Public
exports.getPasienById = async (req, res) => {
  try {
    const pasien = await Pasien.findById(req.params.id);
    if (!pasien) {
      return res.status(404).json({ message: "Pasien tidak ditemukan" });
    }
    res.json(pasien);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Pasien tidak ditemukan" });
    }
    res.status(500).send("Server Error");
  }
};

// @route   PUT api/pasien/:id
// @desc    Update data pasien
// @access  Public
exports.updatePasien = async (req, res) => {
  const { petugasUpdate } = req.body;
  if (!petugasUpdate) {
    return res
      .status(400)
      .json({ message: "Nama petugas yang melakukan update diperlukan." });
  }

  try {
    const { error, value } = pasienSchema.validate(req.body, {
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

    const updatedPasien = await Pasien.findByIdAndUpdate(
      req.params.id,
      {
        ...value,
        $push: {
          logAktivitas: {
            aksi: "UPDATE",
            oleh: petugasUpdate,
            catatan: catatanLog,
          },
        },
        terakhirDiUpdate: new Date(),
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Data pasien berhasil diupdate",
      pasien: updatedPasien,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Pasien tidak ditemukan" });
    }
    res.status(500).send("Server Error");
  }
};

// @route   DELETE api/pasien/:id
// @desc    Hapus pasien
// @access  Public
exports.deletePasien = async (req, res) => {
  const { petugasPenghapus } = req.body;
  if (!petugasPenghapus) {
    return res
      .status(400)
      .json({ message: "Nama petugas yang melakukan penghapusan diperlukan." });
  }
  try {
    const pasien = await Pasien.findById(req.params.id);

    if (!pasien) {
      return res.status(404).json({ message: "Pasien tidak ditemukan" });
    }

    await Pasien.findByIdAndDelete(req.params.id);

    await Konsultasi.deleteMany({ pasienId: req.params.id });

    console.log(
      `Pasien dengan ID ${req.params.id} dan konsultasi terkait dihapus oleh ${petugasPenghapus}.`
    );

    res.json({ message: "Pasien berhasil dihapus" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Pasien tidak ditemukan" });
    }
    res.status(500).send("Server Error");
  }
};

// @route   GET api/pasien/:id/riwayat-kunjungan
// @desc    Dapatkan riwayat konsultasi pasien berdasarkan ID pasien
// @access  Public
exports.getRiwayatKunjunganPasien = async (req, res) => {
  try {
    const konsultasi = await Konsultasi.find({ pasienId: req.params.id }).sort({
      tanggalKonsultasi: -1,
    });

    if (konsultasi.length === 0) {
      return res.status(404).json({
        message: "Riwayat kunjungan tidak ditemukan untuk pasien ini",
      });
    }
    res.json(konsultasi);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "ID pasien tidak valid" });
    }
    res.status(500).send("Server Error");
  }
};
