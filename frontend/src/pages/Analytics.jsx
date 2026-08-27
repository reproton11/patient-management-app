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
} from "@heroicons/react/outline";
import api from "../services/api";
import { toast } from "react-toastify";
import StatCard from "../components/analytics/StatCard";
import ChartCard from "../components/analytics/ChartCard";
import CustomTooltip from "../components/analytics/CustomTooltip";
import AnalyticsSkeleton from "../components/analytics/Skeletons";
import EmptyState from "../components/analytics/EmptyState";
import ProgressRing from "../components/analytics/ProgressRing";
import DistributionMap from "../components/analytics/DistributionMap";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
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
  <div className="flex items-end justify-between border-t border-gray-100 pt-3 text-xs">
    <div>
      <p className="text-gray-500">{leftLabel}</p>
      <p className="mt-0.5 font-semibold text-gray-700">{leftValue}</p>
    </div>
    <div className="text-right">
      <p className="text-gray-500">{rightLabel}</p>
      <p className="mt-0.5 font-semibold text-gray-700">{rightValue}</p>
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
      <Icon className="h-7 w-7" aria-hidden="true" />
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
          tick={{ ...AXIS_TICK, fontSize: 12 }}
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
            fontSize={13}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// IMT dari rata-rata tinggi & berat (approximasi, ditandai "±") + kategori WHO
const bmiInfo = (vitalStats) => {
  const tb = Number(vitalStats.avgTinggiBadan);
  const bb = Number(vitalStats.avgBeratBadan);
  if (!tb || !bb) return null;
  const imt = bb / Math.pow(tb / 100, 2);
  let kategori = "Normal";
  let tone = "green";
  if (imt < 18.5) {
    kategori = "Kurus";
    tone = "amber";
  } else if (imt >= 30) {
    kategori = "Obesitas";
    tone = "red";
  } else if (imt >= 25) {
    kategori = "Berlebih";
    tone = "amber";
  }
  return {
    value: imt.toLocaleString("id-ID", { maximumFractionDigits: 1 }),
    kategori,
    tone,
  };
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <ExclamationCircleIcon className="mb-4 h-14 w-14 text-red-300" aria-hidden="true" />
        <h2 className="text-xl font-bold text-gray-900">
          Gagal memuat data analytics
        </h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          Periksa koneksi ke server lalu coba lagi.
        </p>
        <Button icon={RefreshIcon} onClick={fetchAnalytics}>
          Coba Lagi
        </Button>
      </motion.div>
    );
  }

  const growth = analytics.growth ?? {};
  const dailyData = analytics.dailyRegistrations ?? [];
  const genderData = analytics.demographics?.gender ?? [];
  const ageData = sortAgeDistribution(analytics.demographics?.age ?? []);
  const provinceData = analytics.demographics?.province ?? [];
  const regencyByProvince = analytics.demographics?.regencyByProvince ?? [];
  const topDiagnoses = analytics.topDiagnoses ?? [];
  const vitalStats = analytics.vitalStats ?? {};
  const retention = analytics.retention ?? {};
  const genderTotal = genderData.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Analytics & Insight"
        subtitle="Ringkasan performa klinik: pendaftaran, demografi, diagnosis, dan retensi pasien."
        action={
          <Button
            variant="secondary"
            icon={RefreshIcon}
            onClick={fetchAnalytics}
            disabled={loading}
            className={loading ? "[&>svg]:animate-spin" : ""}
          >
            Muat Ulang
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard
          icon={UserGroupIcon}
          label="Total Pasien Terdaftar"
          value={formatNumber(analytics.totalPasien)}
        >
          <p className="text-xs text-gray-500">
            Akumulasi seluruh pasien terdaftar
          </p>
        </StatCard>

        <StatCard
          icon={CalendarIcon}
          label="Pertumbuhan Pasien (MoM)"
          value={<GrowthValue value={growth.mom ?? 0} />}
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
        action={
          <span className="text-xs font-medium text-gray-500">
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
                  <stop offset="0%" stopColor="#0891B2" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0891B2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
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
                cursor={{ stroke: "#67E8F9", strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Pendaftaran"
                stroke="#0891B2"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Distribusi Jenis Kelamin">
          {genderData.length > 0 ? (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
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
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold tracking-tight text-gray-900">
                    {formatNumber(genderTotal)}
                  </span>
                  <span className="text-xs text-gray-500">Total Pasien</span>
                </div>
              </div>
              <ul className="w-full flex-1 space-y-3 sm:w-auto">
                {genderData.map((entry, index) => (
                  <li
                    key={`gender-legend-${index}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
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
                    <span className="w-12 text-right text-xs text-gray-500">
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

        <ChartCard title="Distribusi Usia">
          {ageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={ageData}
                margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                <XAxis
                  dataKey="_id"
                  tick={{ ...AXIS_TICK, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
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
                  fill="#0891B2"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    formatter={formatNumber}
                    fill="#374151"
                    fontSize={13}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Belum ada data usia" icon={InboxIcon} />
          )}
        </ChartCard>

      </div>

      <ChartCard
        title="Peta Distribusi Pasien"
        action={
          <span className="text-xs font-medium text-gray-500">
            Klik provinsi untuk detail kabupaten/kota
          </span>
        }
      >
        <DistributionMap data={provinceData} regencyByProvince={regencyByProvince} />
      </ChartCard>

      <ChartCard title="Top 5 Diagnosis Terbanyak">
        <HorizontalBarList
          data={topDiagnoses}
          color="#F59E0B"
          name="Jumlah Diagnosis"
          emptyMessage="Belum ada data diagnosis"
        />
      </ChartCard>

      <ChartCard title="Rata-rata Vital Stats">
        <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="py-1 pr-6 sm:py-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Tensi Rata-rata
            </p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
              {formatDecimal(vitalStats.avgSistolik)}
              <span className="mx-1 text-gray-300">/</span>
              {formatDecimal(vitalStats.avgDiastolik)}
              <span className="ml-1.5 text-base font-semibold text-gray-500">
                mmHg
              </span>
            </p>
          </div>
          <div className="py-1 sm:px-6 sm:py-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              IMT (dari rata-rata TB &amp; BB)
            </p>
            {(() => {
              const bmi = bmiInfo(vitalStats);
              return (
                <p className="mt-1.5 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
                  {bmi ? `±${bmi.value}` : "N/A"}
                  {bmi ? (
                    <span className="ml-3 inline-block translate-y-[-4px]">
                      <Badge tone={bmi.tone}>{bmi.kategori}</Badge>
                    </span>
                  ) : null}
                </p>
              );
            })()}
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Retensi Pasien">
        <div className="flex flex-col items-center gap-8 py-2 lg:flex-row">
          <ProgressRing value={retention.retentionRate} label="pasien kembali" />
          <dl className="w-full divide-y divide-gray-100">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">Total Pasien Unik</dt>
              <dd className="text-xl font-bold tabular-nums text-gray-900">
                {formatNumber(retention.totalUniquePatients)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">Pasien Konsultasi Berulang</dt>
              <dd className="text-xl font-bold tabular-nums text-gray-900">
                {formatNumber(retention.retainedPatients)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">Rata-rata Konsultasi per Pasien</dt>
              <dd className="text-xl font-bold tabular-nums text-gray-900">
                {formatDecimal(retention.avgConsultationsPerPatient)}
              </dd>
            </div>
          </dl>
        </div>
      </ChartCard>
    </motion.div>
  );
};

export default Analytics;