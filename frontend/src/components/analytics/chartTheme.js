export const CHART_COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#F43F5E",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#EC4899",
];

export const AXIS_TICK = { fill: "#6B7280", fontSize: 12 };

export const GRID_COLOR = "#F3F4F6";

export const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toLocaleString("id-ID");
};

export const formatPercent = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
};

export const truncateLabel = (value, max = 14) => {
  const str = String(value ?? "-");
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
};
