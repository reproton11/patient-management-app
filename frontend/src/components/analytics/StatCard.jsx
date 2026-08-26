import { motion } from "framer-motion";

const StatCard = ({
  icon,
  label,
  value,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  delay = 0,
  children,
}) => {
  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-500">{label}</h3>
      <div className="mt-1 text-4xl font-extrabold text-gray-900">{value}</div>
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  );
};

export default StatCard;
