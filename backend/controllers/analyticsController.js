const Konsultasi = require("../models/Konsultasi");
const Pasien = require("../models/Pasien");

// @route   GET api/analytics/overview
// @desc    Dapatkan ringkasan statistik untuk dashboard analitik
// @access  Public
exports.getAnalyticsOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Total pasien
    const totalPasien = await Pasien.countDocuments();
    
    // Pasien baru hari ini, minggu ini, bulan ini, tahun ini
    const pasienBaruHariIni = await Pasien.countDocuments({
      tanggalDaftar: { $gte: today }
    });
    
    const pasienBaruMingguIni = await Pasien.countDocuments({
      tanggalDaftar: { $gte: startOfWeek }
    });
    
    const pasienBaruBulanIni = await Pasien.countDocuments({
      tanggalDaftar: { $gte: startOfMonth }
    });
    
    const pasienBaruTahunIni = await Pasien.countDocuments({
      tanggalDaftar: { $gte: startOfYear }
    });

    // Total konsultasi
    const totalKonsultasi = await Konsultasi.countDocuments();
    
    // Konsultasi hari ini, minggu ini, bulan ini
    const konsultasiHariIni = await Konsultasi.countDocuments({
      tanggalKonsultasi: { $gte: today }
    });
    
    const konsultasiMingguIni = await Konsultasi.countDocuments({
      tanggalKonsultasi: { $gte: startOfWeek }
    });
    
    const konsultasiBulanIni = await Konsultasi.countDocuments({
      tanggalKonsultasi: { $gte: startOfMonth }
    });

    // Rata-rata pasien per hari (bulan ini)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const avgPasienPerHari = Math.round((pasienBaruBulanIni / daysInMonth) * 10) / 10;

    // Distribusi jenis kelamin
    const distribusiJenisKelamin = await Pasien.aggregate([
      {
        $group: {
          _id: "$jenisKelamin",
          count: { $sum: 1 }
        }
      }
    ]);

    // Top 5 petugas pendaftaran
    const topPetugasPendaftaran = await Pasien.aggregate([
      {
        $group: {
          _id: "$petugasPendaftaran",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Top 5 petugas konsultasi
    const topPetugasKonsultasi = await Konsultasi.aggregate([
      {
        $group: {
          _id: "$petugasKonsultasi",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Rata-rata tensi pasien (dari data terakhir)
    const avgTensi = await Pasien.aggregate([
      {
        $match: {
          "tensi.sistolik": { $exists: true, $ne: null },
          "tensi.diastolik": { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgSistolik: { $avg: "$tensi.sistolik" },
          avgDiastolik: { $avg: "$tensi.diastolik" }
        }
      }
    ]);

    // Rata-rata IMT (Indeks Massa Tubuh)
    const avgIMTData = await Pasien.aggregate([
      {
        $match: {
          tinggiBadan: { $exists: true, $ne: null, $gt: 0 },
          beratBadan: { $exists: true, $ne: null, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgTinggi: { $avg: "$tinggiBadan" },
          avgBerat: { $avg: "$beratBadan" }
        }
      }
    ]);
    
    let avgIMT = null;
    if (avgIMTData.length > 0 && avgIMTData[0].avgTinggi > 0) {
      const tinggiM = avgIMTData[0].avgTinggi / 100; // cm ke meter
      avgIMT = Math.round((avgIMTData[0].avgBerat / (tinggiM * tinggiM)) * 10) / 10;
    }

    res.json({
      totalPasien,
      pasienBaru: {
        hariIni: pasienBaruHariIni,
        mingguIni: pasienBaruMingguIni,
        bulanIni: pasienBaruBulanIni,
        tahunIni: pasienBaruTahunIni
      },
      totalKonsultasi,
      konsultasi: {
        hariIni: konsultasiHariIni,
        mingguIni: konsultasiMingguIni,
        bulanIni: konsultasiBulanIni
      },
      avgPasienPerHari,
      distribusiJenisKelamin,
      topPetugasPendaftaran,
      topPetugasKonsultasi,
      avgTensi: avgTensi.length > 0 ? avgTensi[0] : null,
      avgIMT
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   GET api/analytics/trend
// @desc    Dapatkan data trend untuk grafik
// @access  Public
exports.getAnalyticsTrend = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    const today = new Date();
    let startDate = new Date();
    let groupFormat;

    switch (period) {
      case 'day':
        // 24 jam terakhir
        startDate.setHours(today.getHours() - 24);
        groupFormat = "%H";
        break;
      case 'week':
        // 7 hari terakhir
        startDate.setDate(today.getDate() - 7);
        groupFormat = "%w";
        break;
      case 'year':
        // 12 bulan terakhir
        startDate.setFullYear(today.getFullYear() - 1);
        groupFormat = "%m";
        break;
      case 'month':
      default:
        // 30 hari terakhir
        startDate.setDate(today.getDate() - 30);
        groupFormat = "%d";
        break;
    }

    // Trend pendaftaran pasien
    const trendPasien = await Pasien.aggregate([
      {
        $match: {
          tanggalDaftar: { $gte: startDate, $lte: today }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$tanggalDaftar" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Trend konsultasi
    const trendKonsultasi = await Konsultasi.aggregate([
      {
        $match: {
          tanggalKonsultasi: { $gte: startDate, $lte: today }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$tanggalKonsultasi" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      period,
      trendPasien,
      trendKonsultasi
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   GET api/analytics/petugas/:nama
// @desc    Dapatkan statistik untuk petugas tertentu
// @access  Public
exports.getAnalyticsByPetugas = async (req, res) => {
  try {
    const { nama } = req.params;
    const { role = 'pendaftaran' } = req.query; // pendaftaran atau konsultasi

    if (role === 'konsultasi') {
      const stats = await Konsultasi.aggregate([
        {
          $match: { petugasKonsultasi: nama }
        },
        {
          $group: {
            _id: null,
            totalKonsultasi: { $sum: 1 },
            uniquePasien: { $addToSet: "$pasienId" }
          }
        },
        {
          $project: {
            _id: 0,
            totalKonsultasi: 1,
            jumlahPasienDitangani: { $size: "$uniquePasien" }
          }
        }
      ]);

      res.json(stats.length > 0 ? stats[0] : { totalKonsultasi: 0, jumlahPasienDitangani: 0 });
    } else {
      const stats = await Pasien.aggregate([
        {
          $match: { petugasPendaftaran: nama }
        },
        {
          $group: {
            _id: null,
            totalPasien: { $sum: 1 }
          }
        }
      ]);

      res.json(stats.length > 0 ? stats[0] : { totalPasien: 0 });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
