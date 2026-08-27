const Pasien = require("../models/Pasien");
const Konsultasi = require("../models/Konsultasi");
const asyncHandler = require("../middlewares/asyncHandler");

// @route   GET api/analytics/summary
// @desc    Dapatkan ringkasan analytics
// @access  Private
exports.getAnalyticsSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
  const startOf7DaysAgo = new Date(now);
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 6);
  startOf7DaysAgo.setHours(0, 0, 0, 0);

  // Tren harian dalam SATU agregasi (menggantikan loop 7x countDocuments)
  const dailyRegistrationsAgg = await Pasien.aggregate([
    { $match: { tanggalDaftar: { $gte: startOf7DaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$tanggalDaftar" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Susun 7 hari berurutan agar hari tanpa pendaftaran tetap muncul bernilai 0
  const countByDate = Object.fromEntries(
    dailyRegistrationsAgg.map((d) => [d._id, d.count])
  );
  const dailyRegistrations = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
    dailyRegistrations.push({
      date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      count: countByDate[key] || 0,
    });
  }

  const [
    totalPasien,
    pasienBulanIni,
    pasienBulanLalu,
    pasienTahunIni,
    pasienTahunLalu,
    genderDistribution,
    ageDistribution,
    provinceDistribution,
    regencyDistribution,
    regencyByProvinceDistribution,
    topDiagnoses,
    vitalStatsAgg,
    consultationCountsAgg,
    totalUniquePatientsArr,
  ] = await Promise.all([
    Pasien.countDocuments(),
    Pasien.countDocuments({ tanggalDaftar: { $gte: startOfMonth } }),
    Pasien.countDocuments({
      tanggalDaftar: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    }),
    Pasien.countDocuments({ tanggalDaftar: { $gte: startOfYear } }),
    Pasien.countDocuments({
      tanggalDaftar: { $gte: startOfLastYear, $lte: endOfLastYear },
    }),
    Pasien.aggregate([
      { $group: { _id: "$jenisKelamin", count: { $sum: 1 } } },
    ]),
    Pasien.aggregate([
      {
        $project: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [now, "$tanggalLahir"] },
                31557600000,
              ],
            },
          },
        },
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
                    "60+ tahun",
                  ]},
                ]},
              ]},
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Pasien.aggregate([
      { $group: { _id: "$alamat.provinsi", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Pasien.aggregate([
      { $group: { _id: "$alamat.kabupaten", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Pasien.aggregate([
      {
        $group: {
          _id: {
            provinsi: "$alamat.provinsi",
            kabupaten: "$alamat.kabupaten",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Konsultasi.aggregate([
      { $match: { "soap.A": { $exists: true, $ne: "" } } },
      { $group: { _id: "$soap.A", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Pasien.aggregate([
      {
        $match: {
          $or: [
            { "tensi.sistolik": { $exists: true } },
            { tinggiBadan: { $exists: true } },
            { beratBadan: { $exists: true } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          avgSistolik: { $avg: "$tensi.sistolik" },
          avgDiastolik: { $avg: "$tensi.diastolik" },
          avgTinggiBadan: { $avg: "$tinggiBadan" },
          avgBeratBadan: { $avg: "$beratBadan" },
        },
      },
    ]),
    Konsultasi.aggregate([
      { $group: { _id: "$pasienId", consultationCount: { $sum: 1 } } },
      { $match: { consultationCount: { $gt: 1 } } },
      {
        $group: {
          _id: null,
          totalRetainedPatients: { $sum: 1 },
          avgConsultationsPerPatient: { $avg: "$consultationCount" },
        },
      },
    ]),
    Konsultasi.distinct("pasienId"),
  ]);

  const momGrowth =
    pasienBulanLalu > 0
      ? ((pasienBulanIni - pasienBulanLalu) / pasienBulanLalu * 100).toFixed(2)
      : 0;
  const yoyGrowth =
    pasienTahunLalu > 0
      ? ((pasienTahunIni - pasienTahunLalu) / pasienTahunLalu * 100).toFixed(2)
      : 0;

  const totalUniquePatients = totalUniquePatientsArr.length;
  const retainedPatients = consultationCountsAgg[0]?.totalRetainedPatients || 0;
  const retentionRate =
    totalUniquePatients > 0
      ? ((retainedPatients / totalUniquePatients) * 100).toFixed(2)
      : 0;

  res.json({
    totalPasien,
    growth: {
      mom: parseFloat(momGrowth),
      yoy: parseFloat(yoyGrowth),
      pasienBulanIni,
      pasienBulanLalu,
      pasienTahunIni,
      pasienTahunLalu,
    },
    dailyRegistrations,
    demographics: {
      gender: genderDistribution,
      age: ageDistribution,
      province: provinceDistribution,
      regency: regencyDistribution,
      regencyByProvince: regencyByProvinceDistribution,
    },
    topDiagnoses,
    vitalStats: vitalStatsAgg[0] || {
      avgSistolik: 0,
      avgDiastolik: 0,
      avgTinggiBadan: 0,
      avgBeratBadan: 0,
    },
    retention: {
      retainedPatients,
      retentionRate: parseFloat(retentionRate),
      avgConsultationsPerPatient:
        consultationCountsAgg[0]?.avgConsultationsPerPatient?.toFixed(2) || 0,
      totalUniquePatients,
    },
  });
});
