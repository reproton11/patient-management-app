import { motion } from "framer-motion";
import Card from "../ui/Card";

const ChartCard = ({ title, action, delay = 0, children }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      <Card className="h-full p-6">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {action}
        </div>
        {children}
      </Card>
    </motion.section>
  );
};

export default ChartCard;