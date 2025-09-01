// src/pages/PatientDetail.jsx
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function PatientDetail({ patient, consultations }) {
  const printRef = useRef(); // 1. buat ref

  // 2. hook react-to-print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Rekam-Medis-${patient.noKartu}`,
  });

  return (
    <div>
      {/* Bagian yang ingin dicetak */}
      <div ref={printRef} className="print-area">
        <h2>Rekam Medis</h2>
        <p>
          <strong>Nama:</strong> {patient.nama}
        </p>
        <p>
          <strong>No Kartu:</strong> {patient.noKartu}
        </p>

        <table border="1" cellPadding="4" cellSpacing="0" width="100%">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keluhan</th>
              <th>Diagnosis</th>
              <th>Terapi</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((c) => (
              <tr key={c._id}>
                <td>{new Date(c.tanggalKonsultasi).toLocaleDateString()}</td>
                <td>{c.soap?.S}</td>
                <td>{c.soap?.A}</td>
                <td>{c.therapy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tombol cetak */}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4 no-print"
        onClick={handlePrint}
      >
        Cetak Rekam Medis
      </button>
    </div>
  );
}
