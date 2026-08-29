// patient-management-app/frontend/src/layouts/DefaultLayout.jsx
import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardListIcon,
  ChartBarIcon,
  LogoutIcon,
  MenuIcon,
  XIcon,
} from "@heroicons/react/outline";
import { getUser, clearSession } from "../services/auth";

const navGroups = [
  {
    label: "Menu Utama",
    items: [{ name: "Dashboard", path: "/", icon: HomeIcon }],
  },
  {
    label: "Layanan Pasien",
    items: [
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
    ],
  },
  {
    label: "Analitik",
    items: [
      {
        name: "Analytics & Insight",
        path: "/analytics",
        icon: ChartBarIcon,
      },
    ],
  },
];

const DefaultLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen isolate font-sans">
      {/* Latar aurora (lapisan kaca butuh latar berwarna) */}
      <div className="aurora-bg" aria-hidden="true" />

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/60 bg-white/70 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Buka menu navigasi"
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          <img
            src="/clinic-logo.png"
            alt="Klinik Logo"
            className="h-7 mr-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
            }}
          />
          <span className="text-base font-bold text-gray-900">Klinik AZ</span>
        </div>
        <div className="w-10" aria-hidden="true" />
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/40 transition-opacity lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/60 bg-white/70 p-5 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pr-1">
          <div className="flex items-center min-w-0">
            <img
              src="/clinic-logo.png"
              alt="Klinik Logo"
              className="h-10 mr-3 shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/40x40?text=CL";
              }}
            />
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight text-gray-900">
                Klinik AZ
              </h1>
              <p className="truncate text-xs font-medium text-gray-500">
                Sistem Manajemen Pasien
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Tutup menu navigasi"
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex > 0 ? "mt-6" : ""}>
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? "bg-primary-50 text-primary-800"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-600 transition-opacity ${
                            isActive ? "opacity-100" : "opacity-0"
                          }`}
                          aria-hidden="true"
                        />
                        <item.icon
                          className={`mr-3 h-5 w-5 shrink-0 ${
                            isActive
                              ? "text-primary-600"
                              : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-gray-200 pt-4">
          {user && (
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {user.nama}
                </p>
                <p className="truncate text-xs text-gray-500">@{user.username}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar"
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
              >
                <LogoutIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Klinik AZ. All rights reserved.
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DefaultLayout;