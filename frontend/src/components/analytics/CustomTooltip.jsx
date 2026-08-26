import { formatNumber } from "./chartTheme";

const CustomTooltip = ({ active, payload, label, suffix = "" }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      {label !== undefined && label !== null && (
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color || entry.payload?.fill }}
            />
            <span className="text-xs text-gray-500">{entry.name}</span>
            <span className="ml-auto pl-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
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
