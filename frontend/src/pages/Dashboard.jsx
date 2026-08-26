// patient-management-app/frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [recentPatients, setRecentPatients] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/pasien/stats");
        setStats(res.data.stats || { today: 0, week: 0, month: 0 });
        setRecentPatients(res.data.recentPatients || []);
        setActivityLogs(res.data.recentActivity || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Gagal memuat data dashboard. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return <div className="text-center py-8">Memuat data dashboard...</div>;
  if (error)
    return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-4">
        Dashboard Klinik
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Pasien Baru Hari Ini" value={stats.today} />
        <StatCard title="Pasien Baru Minggu Ini" value={stats.week} />
        <StatCard title="Pasien Baru Bulan Ini" value={stats.month} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">
            Pasien Baru Hari Ini
          </h2>
          {recentPatients.length > 0 ? (
            <ul className="space-y-3">
              {recentPatients.map((patient) => (
                <li
                  key={patient._id}
                  className="flex items-center p-3 bg-blue-50 rounded-lg text-blue-800 hover:bg-blue-100 transition duration-200 cursor-pointer"
                >
                  <Link
                    to={`/consultations/${patient._id}`}
                    className="flex items-center flex-1"
                  >
                    <span className="font-medium mr-2">{patient.nama}</span> -{" "}
                    {patient.noKartu}
                    {patient.tanggalDaftar && (
                      <span className="ml-auto text-sm text-blue-600">
                        {format(new Date(patient.tanggalDaftar), "HH:mm", {
                          locale: id,
                        })}{" "}
                        WIB
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Tidak ada pasien baru hari ini.</p>
          )}
        </motion.div>

        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">
            Log Aktivitas Petugas
          </h2>
          {activityLogs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {activityLogs.map((log, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">
                      <span className="text-blue-600">{log.oleh}</span>{" "}
                      {(log.aksi || "").toLowerCase()}{" "}
                      {(log.type || "").toLowerCase()}{" "}
                      <span className="font-semibold">{log.entityName}</span> (
                      {log.noKartu})
                    </p>
                    <p className="text-sm text-gray-500">{log.catatan}</p>
                  </div>
                  {log.pada && (
                    <span className="text-xs text-gray-500 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                      {format(new Date(log.pada), "dd-MM-yyyy HH:mm", {
                        locale: id,
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Tidak ada aktivitas terbaru.</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value }) => (
  <motion.div
    className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    <h3 className="text-lg font-medium text-gray-600 mb-2">{title}</h3>
    <p className="text-5xl font-extrabold text-blue-600">{value}</p>
  </motion.div>
);

export default Dashboard;
