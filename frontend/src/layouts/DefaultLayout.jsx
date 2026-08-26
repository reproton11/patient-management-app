// patient-management-app/frontend/src/layouts/DefaultLayout.jsx
import React from "react";
import { motion } from "framer-motion";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardListIcon,
  ChartBarIcon,
  LogoutIcon,
} from "@heroicons/react/outline";
import { getUser, clearSession } from "../services/auth";

const navItems = [
  { name: "Dashboard", path: "/", icon: HomeIcon },
  {
    name: "Pendaftaran Pasien",
    path: "/register-patient",
    icon: UserGroupIcon,
  },
  {
    name: "Konsultasi Pasien",
    path: "/consultations",
    icon: ClipboardListIcon,
  },
  {
    name: "Analytics & Insight",
    path: "/analytics",
    icon: ChartBarIcon,
  },
  // { name: 'Settings', path: '/settings', icon: CogIcon }, // Contoh untuk fitur tambahan
];

const DefaultLayout = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -200 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-64 bg-white shadow-lg p-6 flex flex-col fixed h-full z-20"
      >
        <div className="flex items-center justify-center mb-10 mt-4">
          <img
            src="/clinic-logo.png"
            alt="Klinik Logo"
            className="h-10 mr-3"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/40x40?text=CL";
            }}
          />
          <h1 className="text-2xl font-bold text-gray-800">Klinik AZ</h1>
        </div>
        <nav className="flex-grow">
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className="mb-3">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg text-lg transition-all duration-200
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-200 hover:text-blue-600"
                    }`
                  }
                >
                  <item.icon className="h-6 w-6 mr-3" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-200">
          {user && (
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user.nama}
                </p>
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar"
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogoutIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Klinik AZ. All rights reserved.
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 p-8 md:p-10 lg:p-12 ml-64 overflow-auto" // Sesuaikan ml-64 dengan lebar sidebar
      >
        <Outlet /> {/* Ini akan merender konten dari rute anak */}
      </motion.main>
    </div>
  );
};

export default DefaultLayout;
