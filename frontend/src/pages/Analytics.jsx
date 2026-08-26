import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import {
  UserGroupIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  RefreshIcon,
  ExclamationCircleIcon,
  InboxIcon,
  HeartIcon,
  ArrowDownIcon,
  ArrowsExpandIcon,
  ScaleIcon,
  ChartBarIcon,
  ArrowUpIcon,
} from "@heroicons/react/outline";
import api from "../services/api";
import { toast } from "react-toastify";
import StatCard from "../components/analytics/StatCard";
import ChartCard from "../components/analytics/ChartCard";
import CustomTooltip from "../components/analytics/CustomTooltip";
import AnalyticsSkeleton from "../components/analytics/Skeletons";
import EmptyState from "../components/analytics/EmptyState";
import ProgressRing from "../components/analytics/ProgressRing";
import {
  CHART_COLORS,
  AXIS_TICK,
  GRID_COLOR,
  formatNumber,
  formatPercent,
  truncateLabel,
} from "../components/analytics/chartTheme";

const AGE_ORDER = [
  "0-17 tahun",
  "18-29 tahun",
  "30-44 tahun",
  "45-59 tahun",
  "60+ tahun",
];

const sortAgeDistribution = (data) =>
  [...data].sort((a, b) => {
    const indexA = AGE_ORDER.indexOf(a._id);
    const indexB = AGE_ORDER.indexOf(b._id);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });

const formatDecimal = (value) =>
  value === null || value === undefined
    ? "N/A"
    : Number(value).toLocaleString("id-ID", { maximumFractionDigits: 1 });

const ComparisonFooter = ({ leftLabel, leftValue, rightLabel, rightValue }) => (
  <div className="pt-3 border-t border-gray-100 flex items-end justify-between text-xs">
    <div>
      <p className="text-gray-400">{leftLabel}</p>
      <p className="font-semibold text-gray-700 mt-0.5">{leftValue}</p>
    </div>
    <div className="text-right">
      <p className="text-gray-400">{rightLabel}</p>
      <p className="font-semibold text-gray-700 mt-0.5">{rightValue}</p>
    </div>
  </div>
);

const GrowthValue = ({ value }) => {
  const isPositive = Number(value) >= 0;
  const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
  return (
    <span
      className={`flex items-center gap-2 ${
        isPositive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      <Icon className="h-7 w-7" />
      {formatPercent(value)}
    </span>
  );
};

const HorizontalBarList = ({
  data,
  color,
  name = "Jumlah Pasien",
  emptyMessage,
}) => {
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} icon={InboxIcon} />;
  }
  const height = Math.max(data.length * 38 + 20, 180);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 44, left: 8, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="_id"
          width={120}
          tick={{ ...AXIS_TICK, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => truncateLabel(value, 14)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB" }} />
        <Bar
          dataKey="count"
          name={name}
          fill={color}
          radius={[0, 6, 6, 0]}
          barSize={16}
        >
          <LabelList
            dataKey="count"
            position="right"
            formatter={formatNumber}
            fill="#374151"
            fontSize={12}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const MiniStatTile = ({ icon, tileClass, iconClass, label, value }) => {
  const Icon = icon;
  return (
    <div className={`${tileClass} rounded-lg p-4 flex items-center gap-3`}>
      <Icon className={`h-6 w-6 shrink-0 ${iconClass}`} />
      <div className="min-w-0">
        <p className="text-xs text-gray-500 leading-snug">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">
          {value}
        </p>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

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

  if (loading && !analytics) {
    return <AnalyticsSkeleton />;
  }

  if (!analytics) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <ExclamationCircleIcon className="h-14 w-14 text-red-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">
          Gagal memuat data analytics
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Periksa koneksi ke server lalu coba lagi.
        </p>
        <button
          type="button"
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <RefreshIcon className="h-4 w-4" />
          Coba Lagi
        </button>
      </motion.div>
    );
  }

  const growth = analytics.growth ?? {};
  const dailyData = analytics.dailyRegistrations ?? [];
  const genderData = analytics.demographics?.gender ?? [];
  const ageData = sortAgeDistribution(analytics.demographics?.age ?? []);
  const provinceData = analytics.demographics?.province ?? [];
  const regencyData = analytics.demographics?.regency ?? [];
  const topDiagnoses = analytics.topDiagnoses ?? [];
  const vitalStats = analytics.vitalStats ?? {};
  const retention = analytics.retention ?? {};
  const genderTotal = genderData.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="mb-8 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            Analytics &amp; Insight
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ringkasan performa klinik: pendaftaran, demografi, diagnosis, dan
            retensi pasien.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshIcon
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Muat Ulang
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={UserGroupIcon}
          label="Total Pasien Terdaftar"
          value={formatNumber(analytics.totalPasien)}
          delay={0}
        >
          <p className="text-xs text-gray-400">
            Akumulasi seluruh pasien terdaftar
          </p>
        </StatCard>

        <StatCard
          icon={CalendarIcon}
          label="Pertumbuhan Pasien (MoM)"
          value={<GrowthValue value={growth.mom ?? 0} />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          delay={0.05}
        >
          <ComparisonFooter
            leftLabel="Bulan ini"
            leftValue={formatNumber(growth.pasienBulanIni)}
            rightLabel="Bulan lalu"
            rightValue={formatNumber(growth.pasienBulanLalu)}
          />
        </StatCard>

        <StatCard
          icon={CalendarIcon}
          label="Pertumbuhan Pasien (YoY)"
          value={<GrowthValue value={growth.yoy ?? 0} />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          delay={0.1}
        >
          <ComparisonFooter
            leftLabel="Tahun ini"
            leftValue={formatNumber(growth.pasienTahunIni)}
            rightLabel="Tahun lalu"
            rightValue={formatNumber(growth.pasienTahunLalu)}
          />
        </StatCard>
      </div>

      <ChartCard
        title="Tren Pendaftaran Pasien"
        delay={0.15}
        action={
          <span className="text-xs font-medium text-gray-400">
            7 hari terakhir
          </span>
        }
      >
        {dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={dailyData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="registrationGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                width={36}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#93C5FD", strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Pendaftaran"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#registrationGradient)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            message="Belum ada pendaftaran dalam 7 hari terakhir"
            icon={InboxIcon}
          />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Distribusi Jenis Kelamin" delay={0.25}>
          {genderData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={4}
                      cornerRadius={6}
                      strokeWidth={0}
                    >
                      {genderData.map((entry, index) => (
                        <Cell
                          key={`gender-cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {formatNumber(genderTotal)}
                  </span>
                  <span className="text-xs text-gray-500">Total Pasien</span>
                </div>
              </div>
              <ul className="w-full sm:flex-1 space-y-3">
                {genderData.map((entry, index) => (
                  <li
                    key={`gender-legend-${index}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-gray-600">
                      {entry._id || "Tidak diisi"}
                    </span>
                    <span className="ml-auto font-semibold text-gray-900">
                      {formatNumber(entry.count)}
                    </span>
                    <span className="w-12 text-right text-xs text-gray-400">
                      {genderTotal > 0
                        ? `${Math.round((entry.count / genderTotal) * 100)}%`
                        : "-"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState
              message="Belum ada data jenis kelamin"
              icon={InboxIcon}
            />
          )}
        </ChartCard>

        <ChartCard title="Distribusi Usia" delay={0.3}>
          {ageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={ageData}
                margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                <XAxis
                  dataKey="_id"
                  tick={{ ...AXIS_TICK, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  width={36}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB" }} />
                <Bar
                  dataKey="count"
                  name="Jumlah Pasien"
                  fill="#2563EB"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    formatter={formatNumber}
                    fill="#374151"
                    fontSize={12}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Belum ada data usia" icon={InboxIcon} />
          )}
        </ChartCard>

        <ChartCard title="Distribusi Provinsi (Top 10)" delay={0.4}>
          <HorizontalBarList
            data={provinceData}
            color="#8B5CF6"
            emptyMessage="Belum ada data provinsi"
          />
        </ChartCard>

        <ChartCard title="Distribusi Kabupaten (Top 10)" delay={0.45}>
          <HorizontalBarList
            data={regencyData}
            color="#0EA5E9"
            emptyMessage="Belum ada data kabupaten"
          />
        </ChartCard>
      </div>

      <ChartCard title="Top 5 Diagnosis Terbanyak" delay={0.55}>
        <HorizontalBarList
          data={topDiagnoses}
          color="#F59E0B"
          name="Jumlah Diagnosis"
          emptyMessage="Belum ada data diagnosis"
        />
      </ChartCard>

      <ChartCard title="Rata-rata Vital Stats" delay={0.65}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStatTile
            icon={HeartIcon}
            tileClass="bg-rose-50"
            iconClass="text-rose-600"
            label="Tensi Sistolik (mmHg)"
            value={formatDecimal(vitalStats.avgSistolik)}
          />
          <MiniStatTile
            icon={ArrowDownIcon}
            tileClass="bg-amber-50"
            iconClass="text-amber-600"
            label="Tensi Diastolik (mmHg)"
            value={formatDecimal(vitalStats.avgDiastolik)}
          />
          <MiniStatTile
            icon={ArrowsExpandIcon}
            tileClass="bg-sky-50"
            iconClass="text-sky-600"
            label="Tinggi Badan (cm)"
            value={formatDecimal(vitalStats.avgTinggiBadan)}
          />
          <MiniStatTile
            icon={ScaleIcon}
            tileClass="bg-emerald-50"
            iconClass="text-emerald-600"
            label="Berat Badan (kg)"
            value={formatDecimal(vitalStats.avgBeratBadan)}
          />
        </div>
      </ChartCard>

      <ChartCard title="Retensi Pasien" delay={0.75}>
        <div className="flex flex-col lg:flex-row items-center gap-8 py-2">
          <ProgressRing value={retention.retentionRate} label="pasien kembali" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
            <MiniStatTile
              icon={UserGroupIcon}
              tileClass="bg-violet-50"
              iconClass="text-violet-600"
              label="Total Pasien Unik"
              value={formatNumber(retention.totalUniquePatients)}
            />
            <MiniStatTile
              icon={ArrowUpIcon}
              tileClass="bg-indigo-50"
              iconClass="text-indigo-600"
              label="Pasien Konsultasi Berulang"
              value={formatNumber(retention.retainedPatients)}
            />
            <MiniStatTile
              icon={ChartBarIcon}
              tileClass="bg-pink-50"
              iconClass="text-pink-600"
              label="Rata-rata Konsultasi per Pasien"
              value={formatDecimal(retention.avgConsultationsPerPatient)}
            />
          </div>
        </div>
      </ChartCard>
    </motion.div>
  );
};

export default Analytics;
