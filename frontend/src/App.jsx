import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DefaultLayout from "./layouts/DefaultLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const RegisterPatient = React.lazy(() => import("./pages/RegisterPatient"));
const Consultations = React.lazy(() => import("./pages/Consultations"));
const PatientConsultationDetail = React.lazy(
  () => import("./pages/PatientConsultationDetail")
);
const Analytics = React.lazy(() => import("./pages/Analytics"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-pulse space-y-3 w-full max-w-md">
      <div className="h-6 w-1/3 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 rounded-xl bg-gray-200" />
        <div className="h-24 rounded-xl bg-gray-200" />
        <div className="h-24 rounded-xl bg-gray-200" />
      </div>
      <div className="h-64 rounded-xl bg-gray-200" />
    </div>
  </div>
);

const NotFound = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <p className="text-5xl font-bold text-gray-300">404</p>
    <h1 className="mt-2 text-xl font-semibold text-gray-900">
      Halaman Tidak Ditemukan
    </h1>
    <p className="mt-1 text-sm text-gray-500">
      Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
    </p>
  </div>
);

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        theme="light"
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DefaultLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="register-patient"
            element={
              <Suspense fallback={<PageLoader />}>
                <RegisterPatient />
              </Suspense>
            }
          />
          <Route
            path="consultations"
            element={
              <Suspense fallback={<PageLoader />}>
                <Consultations />
              </Suspense>
            }
          />
          <Route
            path="consultations/:patientId"
            element={
              <Suspense fallback={<PageLoader />}>
                <PatientConsultationDetail />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;