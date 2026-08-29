// patient-management-app/frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

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
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-7 w-56 rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-xl bg-gray-200" />
          <div className="h-72 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  if (error)
    return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <PageHeader
        title="Dashboard Klinik"
        subtitle="Ringkasan aktivitas pendaftaran dan layanan hari ini"
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard title="Pasien Baru Hari Ini" value={stats.today} />
        <StatCard title="Pasien Baru Minggu Ini" value={stats.week} />
        <StatCard title="Pasien Baru Bulan Ini" value={stats.month} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <Card.Header
            title="Pasien Baru Hari Ini"
            action={
              <Badge tone="blue">{recentPatients.length} pasien</Badge>
            }
          />
          {recentPatients.length > 0 ? (
            <ul className="space-y-2">
              {recentPatients.map((patient) => (
                <li key={patient._id}>
                  <Link
                    to={`/consultations/${patient._id}`}
                    className="group flex items-center rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-primary-100 hover:bg-primary-50"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-primary-700">
                      {patient.nama}
                    </span>
                    <span className="mx-2 text-gray-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-sm text-gray-500">{patient.noKartu}</span>
                    {patient.tanggalDaftar && (
                      <span className="ml-auto text-xs font-medium text-gray-500">
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
            <p className="py-4 text-center text-sm text-gray-500">
              Tidak ada pasien baru hari ini.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <Card.Header title="Log Aktivitas Petugas" />
          {activityLogs.length > 0 ? (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {activityLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex flex-col rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold text-primary-700">
                        {log.oleh}
                      </span>{" "}
                      {(log.aksi || "").toLowerCase()}{" "}
                      {(log.type || "").toLowerCase()}{" "}
                      <span className="font-semibold">{log.entityName}</span> (
                      {log.noKartu})
                    </p>
                    {log.catatan ? (
                      <p className="mt-0.5 text-sm text-gray-500">{log.catatan}</p>
                    ) : null}
                  </div>
                  {log.pada && (
                    <span className="mt-2 flex-shrink-0 text-xs text-gray-500 sm:ml-4 sm:mt-0">
                      {format(new Date(log.pada), "dd-MM-yyyy HH:mm", {
                        locale: id,
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500">
              Tidak ada aktivitas terbaru.
            </p>
          )}
        </Card>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value }) => (
  <motion.div
    className="card card-hover p-6"
    whileHover={{ y: -2 }}
    transition={{ duration: 0.15 }}
  >
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="mt-2 text-4xl font-bold tracking-tight text-primary-600">
      {value.toLocaleString("id-ID")}
    </p>
  </motion.div>
);

export default Dashboard;