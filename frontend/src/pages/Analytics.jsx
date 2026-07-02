import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { toast } from "react-toastify";
import {
  TrendingUp,
  Users,
  Activity,
  UserCheck,
  BarChart2,
  Calendar,
} from "lucide-react";

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (overview) {
      fetchTrend(selectedPeriod);
    }
  }, [selectedPeriod, overview]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, trendRes] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/trend", { params: { period: selectedPeriod } }),
      ]);
      setOverview(overviewRes.data);
      setTrend(trendRes.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      toast.error("Gagal memuat data analitik");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrend = async (period) => {
    try {
      const res = await api.get("/analytics/trend", { params: { period } });
      setTrend(res.data);
    } catch (err) {
      console.error("Error fetching trend:", err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">Memuat data analitik...</div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-8 text-red-500">
        Gagal memuat data analitik
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-900">
          Insight & Analitik
        </h1>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="day">24 Jam</option>
          <option value="week">7 Hari</option>
          <option value="month">30 Hari</option>
          <option value="year">12 Bulan</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pasien"
          value={overview.totalPasien}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Konsultasi"
          value={overview.totalKonsultasi}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Pasien Baru Bulan Ini"
          value={overview.pasienBaru.bulanIni}
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="Rata-rata Pasien/Hari"
          value={overview.avgPasienPerHari}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pasien Baru Overview */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            Pasien Baru
          </h2>
          <div className="space-y-3">
            <StatRow label="Hari Ini" value={overview.pasienBaru.hariIni} />
            <StatRow label="Minggu Ini" value={overview.pasienBaru.mingguIni} />
            <StatRow label="Bulan Ini" value={overview.pasienBaru.bulanIni} />
            <StatRow label="Tahun Ini" value={overview.pasienBaru.tahunIni} />
          </div>
        </motion.div>

        {/* Konsultasi Overview */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-green-600" />
            Konsultasi
          </h2>
          <div className="space-y-3">
            <StatRow label="Hari Ini" value={overview.konsultasi.hariIni} />
            <StatRow
              label="Minggu Ini"
              value={overview.konsultasi.mingguIni}
            />
            <StatRow label="Bulan Ini" value={overview.konsultasi.bulanIni} />
          </div>
        </motion.div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-red-600" />
            Rata-rata Tensi
          </h2>
          {overview.avgTensi ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <span className="text-gray-700 font-medium">Sistolik</span>
                <span className="text-2xl font-bold text-red-600">
                  {Math.round(overview.avgTensi.avgSistolik)} mmHg
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Diastolik</span>
                <span className="text-2xl font-bold text-blue-600">
                  {Math.round(overview.avgTensi.avgDiastolik)} mmHg
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Data tensi tidak tersedia</p>
          )}
        </motion.div>

        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3 flex items-center">
            <BarChart2 className="w-6 h-6 mr-2 text-purple-600" />
            Indeks Massa Tubuh (IMT)
          </h2>
          {overview.avgIMT !== null ? (
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-center">
                <span className="text-4xl font-bold text-purple-600">
                  {overview.avgIMT}
                </span>
                <p className="text-sm text-gray-600 mt-2">Rata-rata IMT</p>
                <p className="text-xs text-gray-500 mt-1">
                  {getIMTCategory(overview.avgIMT)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Data IMT tidak tersedia</p>
          )}
        </motion.div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gender Distribution */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">
            Distribusi Jenis Kelamin
          </h2>
          <div className="space-y-3">
            {overview.distribusiJenisKelamin.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <span className="text-gray-700">{item._id}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-48 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (item.count / overview.totalPasien) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Petugas Pendaftaran */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">
            Top 5 Petugas Pendaftaran
          </h2>
          <div className="space-y-3">
            {overview.topPetugasPendaftaran.map((item, index) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-orange-500"
                        : "bg-blue-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-gray-800 font-medium">
                    {item._id}
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Trend Chart Placeholder */}
      <motion.div
        className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">
          Trend Kunjungan ({selectedPeriod === 'day' ? '24 Jam' : selectedPeriod === 'week' ? '7 Hari' : selectedPeriod === 'month' ? '30 Hari' : '12 Bulan'})
        </h2>
        {trend && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Trend Pendaftaran Pasien
              </h3>
              <div className="flex items-end space-x-2 h-40 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {trend.trendPasien.length > 0 ? (
                  trend.trendPasien.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center min-w-[30px]"
                    >
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                        style={{
                          height: `${Math.min(
                            (item.count /
                              Math.max(...trend.trendPasien.map((t) => t.count))) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                      <span className="text-xs text-gray-600 mt-1">
                        {item._id}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center w-full">
                    Tidak ada data
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Trend Konsultasi
              </h3>
              <div className="flex items-end space-x-2 h-40 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {trend.trendKonsultasi.length > 0 ? (
                  trend.trendKonsultasi.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center min-w-[30px]"
                    >
                      <div
                        className="w-full bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                        style={{
                          height: `${Math.min(
                            (item.count /
                              Math.max(
                                ...trend.trendKonsultasi.map((t) => t.count)
                              )) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                      <span className="text-xs text-gray-600 mt-1">
                        {item._id}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center w-full">
                    Tidak ada data
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-600">{title}</h3>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-4xl font-extrabold text-gray-900">{value}</p>
    </motion.div>
  );
};

const StatRow = ({ label, value }) => (
  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
    <span className="text-gray-700">{label}</span>
    <span className="text-xl font-bold text-blue-600">{value}</span>
  </div>
);

const getIMTCategory = (imt) => {
  if (imt < 18.5) return "Underweight";
  if (imt < 25) return "Normal";
  if (imt < 30) return "Overweight";
  return "Obese";
};

export default Analytics;
