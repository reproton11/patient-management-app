const EmptyState = ({ message = "Belum ada data", icon }) => {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="h-10 w-10 text-gray-300 mb-3" />}
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
};

export default EmptyState;
