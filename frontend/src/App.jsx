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
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
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
          <Route path="*" element={<div>404 - Halaman Tidak Ditemukan</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
