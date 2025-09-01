// patient-management-app/frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify"; // Untuk notifikasi toast
import DefaultLayout from "./layouts/DefaultLayout";
import Dashboard from "./pages/Dashboard";
import RegisterPatient from "./pages/RegisterPatient";
import Consultations from "./pages/Consultations";
import PatientConsultationDetail from "./pages/PatientConsultationDetail";

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
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="register-patient" element={<RegisterPatient />} />
          <Route path="consultations" element={<Consultations />} />
          <Route
            path="consultations/:patientId"
            element={<PatientConsultationDetail />}
          />
          {/* Tambahkan rute lain di sini */}
          <Route path="*" element={<div>404 - Halaman Tidak Ditemukan</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
