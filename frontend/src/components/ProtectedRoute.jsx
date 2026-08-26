import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../services/auth";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

export default ProtectedRoute;
