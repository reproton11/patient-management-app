import { motion } from "framer-motion";

const StatCard = ({
  icon,
  label,
  value,
  iconBg = "bg-primary-50",
  iconColor = "text-primary-600",
  delay = 0,
  children,
}) => {
  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ y: -2 }}
      className="card card-hover p-6"
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-3 ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
        </div>
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-500">{label}</h3>
      <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  );
};

export default StatCard;