// patient-management-app/frontend/src/layouts/DefaultLayout.jsx
import React from "react";
import { motion } from "framer-motion";
import { NavLink, Outlet } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardListIcon,
  ChartBarIcon,
  CogIcon,
} from "@heroicons/react/outline"; // Untuk ikon

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
  return (
    <div className="flex min-h-screen font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -200 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-64 glass p-6 flex flex-col fixed h-full z-20"
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
          <h1 className="text-2xl font-bold text-glass-primary">Klinik AZ</h1>
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
                        ? "bg-white/30 text-white shadow-md backdrop-blur-md"
                        : "text-glass-secondary hover:bg-white/20 hover:text-white"
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
        <div className="text-center text-sm text-glass-muted mt-auto pt-6 border-t border-white/20">
          &copy; {new Date().getFullYear()} Klinik AZ. All rights reserved.
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
