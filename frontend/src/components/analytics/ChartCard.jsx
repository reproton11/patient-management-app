import { motion } from "framer-motion";

const ChartCard = ({ title, action, delay = 0, children }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </motion.section>
  );
};

export default ChartCard;
