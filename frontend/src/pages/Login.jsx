import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { LockClosedIcon, UserIcon } from "@heroicons/react/outline";
import api from "../services/api";
import { saveSession } from "../services/auth";
import { toast } from "react-toastify";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      saveSession(res.data.token, res.data.user);
      toast.success(`Selamat datang, ${res.data.user.nama}!`);
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || "Login gagal. Periksa kembali data Anda.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center p-4 font-sans">
      <div className="aurora-bg" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="card w-full max-w-md p-8"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="/clinic-logo.png"
            alt="Logo Klinik AZ"
            className="mb-3 h-14"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
            }}
          />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Klinik AZ
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sistem Manajemen Pasien — silakan masuk untuk melanjutkan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="field-label"
            >
              Username
            </label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Masukkan username"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="field-label"
            >
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Masukkan password"
                className="input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Klinik AZ. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;