// patient-management-app/backend/controllers/analyticsController.js
const Pasien = require("../models/Pasien");
const Konsultasi = require("../models/Konsultasi");

// @route   GET api/analytics/summary
// @desc    Dapatkan ringkasan analytics
// @access  Public
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    // 1. Total pasien terdaftar
    const totalPasien = await Pasien.countDocuments();

    // 2. Persentase Pertumbuhan Pasien (MoM/YoY)
    const pasienBulanIni = await Pasien.countDocuments({
      tanggalDaftar: { $gte: startOfMonth }
    });
    
    const pasienBulanLalu = await Pasien.countDocuments({
      tanggalDaftar: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    
    const pasienTahunIni = await Pasien.countDocuments({
      tanggalDaftar: { $gte: startOfYear }
    });
    
    const pasienTahunLalu = await Pasien.countDocuments({
      tanggalDaftar: { $gte: startOfLastYear, $lte: endOfLastYear }
    });

    const momGrowth = pasienBulanLalu > 0 
      ? ((pasienBulanIni - pasienBulanLalu) / pasienBulanLalu * 100).toFixed(2)
      : 0;
    
    const yoyGrowth = pasienTahunLalu > 0 
      ? ((pasienTahunIni - pasienTahunLalu) / pasienTahunLalu * 100).toFixed(2)
      : 0;

    // 3. Grafik Pendaftaran Pasien - Tren harian (7 hari terakhir)
    const dailyRegistrations = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await Pasien.countDocuments({
        tanggalDaftar: { $gte: startOfDay, $lte: endOfDay }
      });
      
      dailyRegistrations.push({
        date: new Date(startOfDay).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        count
      });
    }

    // 4. Grafik Demografi
    // Jenis Kelamin
    const genderDistribution = await Pasien.aggregate([
      { $group: { _id: "$jenisKelamin", count: { $sum: 1 } } }
    ]);

    // Usia (kelompok usia)
    const ageDistribution = await Pasien.aggregate([
      {
        $project: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$tanggalLahir"] },
                31557600000 // milidetik dalam setahun
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ["$age", 18] }, "0-17 tahun",
              { $cond: [
                { $lt: ["$age", 30] }, "18-29 tahun",
                { $cond: [
                  { $lt: ["$age", 45] }, "30-44 tahun",
                  { $cond: [
                    { $lt: ["$age", 60] }, "45-59 tahun",
                    "60+ tahun"
                  ]}
                ]}
              ]}
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Provinsi
    const provinceDistribution = await Pasien.aggregate([
      { $group: { _id: "$alamat.provinsi", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Kabupaten
    const regencyDistribution = await Pasien.aggregate([
      { $group: { _id: "$alamat.kabupaten", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 5. Top 5 Diagnosis Terbanyak (dari soap.A di konsultasi)
    const topDiagnoses = await Konsultasi.aggregate([
      { $match: { "soap.A": { $exists: true, $ne: "" } } },
      { $group: { _id: "$soap.A", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // 6. Rata-rata Tensi, Tinggi Badan, Berat Badan
    const vitalStats = await Pasien.aggregate([
      {
        $match: {
          $or: [
            { "tensi.sistolik": { $exists: true } },
            { "tinggiBadan": { $exists: true } },
            { "beratBadan": { $exists: true } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          avgSistolik: { $avg: "$tensi.sistolik" },
          avgDiastolik: { $avg: "$tensi.diastolik" },
          avgTinggiBadan: { $avg: "$tinggiBadan" },
          avgBeratBadan: { $avg: "$beratBadan" }
        }
      }
    ]);

    // 7. Retensi Pasien - Pasien yang melakukan konsultasi berulang
    const patientConsultationCounts = await Konsultasi.aggregate([
      {
        $group: {
          _id: "$pasienId",
          consultationCount: { $sum: 1 }
        }
      },
      {
        $match: { consultationCount: { $gt: 1 } }
      },
      {
        $group: {
          _id: null,
          totalRetainedPatients: { $sum: 1 },
          avgConsultationsPerPatient: { $avg: "$consultationCount" }
        }
      }
    ]);

    const totalUniquePatients = await Konsultasi.distinct("pasienId").then(ids => ids.length);
    const retentionRate = totalUniquePatients > 0 
      ? ((patientConsultationCounts[0]?.totalRetainedPatients || 0) / totalUniquePatients * 100).toFixed(2)
      : 0;

    res.json({
      totalPasien,
      growth: {
        mom: parseFloat(momGrowth),
        yoy: parseFloat(yoyGrowth),
        pasienBulanIni,
        pasienBulanLalu,
        pasienTahunIni,
        pasienTahunLalu
      },
      dailyRegistrations,
      demographics: {
        gender: genderDistribution,
        age: ageDistribution,
        province: provinceDistribution,
        regency: regencyDistribution
      },
      topDiagnoses,
      vitalStats: vitalStats[0] || {
        avgSistolik: 0,
        avgDiastolik: 0,
        avgTinggiBadan: 0,
        avgBeratBadan: 0
      },
      retention: {
        retainedPatients: patientConsultationCounts[0]?.totalRetainedPatients || 0,
        retentionRate: parseFloat(retentionRate),
        avgConsultationsPerPatient: patientConsultationCounts[0]?.avgConsultationsPerPatient?.toFixed(2) || 0,
        totalUniquePatients
      }
    });
  } catch (err) {
    console.error("Error fetching analytics:", err.message);
    res.status(500).send("Server Error");
  }
};
