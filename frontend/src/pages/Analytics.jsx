// patient-management-app/frontend/src/pages/Analytics.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/analytics/summary");
      setAnalytics(response.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      toast.error("Gagal memuat data analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">Memuat data analytics...</div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-red-500">
        Gagal memuat data analytics
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
      <h1 className="text-4xl font-extrabold text-glass-primary mb-8 border-b border-white/20 pb-4">
        Analytics & Insight
      </h1>

      {/* 1. Total Pasien Terdaftar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="glass-card p-6 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <h3 className="text-lg font-medium text-glass-secondary mb-2">
            Total Pasien Terdaftar
          </h3>
          <p className="text-5xl font-extrabold text-blue-600">
            {analytics.totalPasien}
          </p>
        </motion.div>

        {/* 2. Persentase Pertumbuhan Pasien */}
        <motion.div
          className="glass-card p-6 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <h3 className="text-lg font-medium text-glass-secondary mb-2">
            Pertumbuhan Pasien (MoM)
          </h3>
          <p
            className={`text-5xl font-extrabold ${
              analytics.growth.mom >= 0 ? "text-green-300" : "text-red-300"
            }`}
          >
            {analytics.growth.mom >= 0 ? "+" : ""}
            {analytics.growth.mom}%
          </p>
          <p className="text-sm text-glass-muted mt-2">
            Bulan ini: {analytics.growth.pasienBulanIni} | Bulan lalu:{" "}
            {analytics.growth.pasienBulanLalu}
          </p>
        </motion.div>

        <motion.div
          className="glass-card p-6 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <h3 className="text-lg font-medium text-glass-secondary mb-2">
            Pertumbuhan Pasien (YoY)
          </h3>
          <p
            className={`text-5xl font-extrabold ${
              analytics.growth.yoy >= 0 ? "text-green-300" : "text-red-300"
            }`}
          >
            {analytics.growth.yoy >= 0 ? "+" : ""}
            {analytics.growth.yoy}%
          </p>
          <p className="text-sm text-glass-muted mt-2">
            Tahun ini: {analytics.growth.pasienTahunIni} | Tahun lalu:{" "}
            {analytics.growth.pasienTahunLalu}
          </p>
        </motion.div>
      </div>

      {/* 3. Grafik Pendaftaran Pasien - Tren */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-2xl font-semibold text-glass-primary mb-4 border-b border-white/20 pb-3">
          Tren Pendaftaran Pasien (7 Hari Terakhir)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.dailyRegistrations}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
              name="Jumlah Pasien"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* 4. Grafik Demografi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Jenis Kelamin */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-glass-primary mb-4 border-b border-white/20 pb-3">
            Distribusi Jenis Kelamin
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.demographics.gender}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _id, percent }) =>
                  `${_id}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.demographics.gender.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Usia */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold text-glass-primary mb-4 border-b border-white/20 pb-3">
            Distribusi Usia
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.demographics.age}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" name="Jumlah Pasien" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Provinsi */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold text-glass-primary mb-4 border-b border-white/20 pb-3">
            Distribusi Provinsi (Top 10)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.demographics.province}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ffc658" name="Jumlah Pasien" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Kabupaten */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-glass-primary mb-4 border-b border-white/20 pb-3">
            Distribusi Kabupaten (Top 10)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.demographics.regency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ff7300" name="Jumlah Pasien" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* 5. Top 5 Diagnosis Terbanyak */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-2xl font-semibold text-glass-primary mb-4 border-b border-white/20 pb-3">
          Top 5 Diagnosis Terbanyak
        </h2>
        {analytics.topDiagnoses.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topDiagnoses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Jumlah Diagnosis" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-glass-secondary">Belum ada data diagnosis</p>
        )}
      </motion.div>

      {/* 6. Rata-rata Tensi, Tinggi Badan, Berat Badan */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h2 className="text-2xl font-semibold text-glass-primary mb-4 border-b border-white/20 pb-3">
          Rata-rata Vital Stats
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-glass-secondary mb-2">
              Tensi Sistolik (mmHg)
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {analytics.vitalStats.avgSistolik?.toFixed(1) || "N/A"}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm font-medium text-glass-secondary mb-2">
              Tensi Diastolik (mmHg)
            </h3>
            <p className="text-3xl font-bold text-green-300">
              {analytics.vitalStats.avgDiastolik?.toFixed(1) || "N/A"}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-sm font-medium text-glass-secondary mb-2">
              Tinggi Badan (cm)
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {analytics.vitalStats.avgTinggiBadan?.toFixed(1) || "N/A"}
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <h3 className="text-sm font-medium text-glass-secondary mb-2">
              Berat Badan (kg)
            </h3>
            <p className="text-3xl font-bold text-red-300">
              {analytics.vitalStats.avgBeratBadan?.toFixed(1) || "N/A"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 7. Retensi Pasien */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <h2 className="text-2xl font-semibold text-glass-primary mb-4 border-b border-white/20 pb-3">
          Retensi Pasien
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h3 className="text-sm font-medium text-glass-secondary mb-2">
              Total Pasien Unik
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {analytics.retention.totalUniquePatients}
            </p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-sm font-medium text-glass-secondary mb-2">
              Pasien dengan Konsultasi Berulang
            </h3>
            <p className="text-3xl font-bold text-indigo-600">
              {analytics.retention.retainedPatients}
            </p>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <h3 className="text-sm font-medium text-glass-secondary mb-2">
              Tingkat Retensi
            </h3>
            <p className="text-3xl font-bold text-pink-600">
              {analytics.retention.retentionRate}%
            </p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-glass-secondary">
            Rata-rata konsultasi per pasien:{" "}
            <span className="font-semibold">
              {analytics.retention.avgConsultationsPerPatient}
            </span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Analytics;
