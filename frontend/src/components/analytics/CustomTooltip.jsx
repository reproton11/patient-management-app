import { formatNumber } from "./chartTheme";

const CustomTooltip = ({ active, payload, label, suffix = "" }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/60 bg-white/85 px-3.5 py-2.5 shadow-card ring-1 ring-gray-900/5 backdrop-blur-md">
      {label !== undefined && label !== null && (
        <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color || entry.payload?.fill }}
            />
            <span className="text-xs text-gray-500">{entry.name}</span>
            <span className="ml-auto whitespace-nowrap pl-4 text-sm font-semibold text-gray-900">
              {formatNumber(entry.value)}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomTooltip;