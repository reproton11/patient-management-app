// patient-management-app/frontend/src/components/PatientMedicalRecordTemplate.jsx
import React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Fungsi calculateAge yang sama
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const PatientMedicalRecordTemplate = React.forwardRef(
  ({ patient, consultations }, ref) => {
    if (!patient) {
      return null;
    }

    return (
      <div
        ref={ref}
        className="p-8 bg-white text-gray-800 print-content-area"
        style={{
          fontFamily: "var(--Google Sans, sans-serif)",
          lineHeight: 1.6,
          fontSize: "12px",
          width: "210mm",
          minHeight: "297mm",
          margin: "auto",
          boxSizing: "border-box",
        }}
      >
        {/* Semua style inline di bawah ini sudah diperbaiki */}

        <div
          className="header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "3px solid #3b82f6",
            paddingBottom: "10px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src="/clinic-logo.png"
              alt="Klinik Logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/40x40?text=CL";
              }}
              style={{ height: "40px", marginRight: "10px" }}
            />
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1a202c",
                margin: 0,
              }}
            >
              Rekam Medis Pasien
            </h1>
          </div>
          <div>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                textAlign: "right",
                margin: 0,
              }}
            >
              Praktek dr. Andi Zainal, Sp.PD-KGEH, FINASIM
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                textAlign: "right",
                margin: 0,
              }}
            >
              Jl. Jend. Ahmad Yani No.171A, Pekanbaru
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                textAlign: "right",
                margin: 0,
              }}
            >
              Telp: (0761) 36691
            </p>
          </div>
        </div>

        <div
          className="section-title"
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#3b82f6",
            marginBottom: "10px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "5px",
          }}
        >
          Informasi Pasien
        </div>
        <div
          className="info-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              No. Kartu:
            </span>
            <span
              className="info-value"
              style={{
                color: "#2d3748",
                fontWeight: "bold",
                fontSize: "1.1em",
              }}
            >
              {patient.noKartu}
            </span>
          </div>
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              Nama:
            </span>
            <span className="info-value" style={{ color: "#2d3748" }}>
              {patient.nama}
            </span>
          </div>
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              Jenis Kelamin:
            </span>
            <span className="info-value" style={{ color: "#2d3748" }}>
              {patient.jenisKelamin}
            </span>
          </div>
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              Tanggal Lahir:
            </span>
            <span className="info-value" style={{ color: "#2d3748" }}>
              {patient.tanggalLahir
                ? format(new Date(patient.tanggalLahir), "dd MMMM yyyy", {
                    locale: id,
                  })
                : "-"}
            </span>
          </div>
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              Umur:
            </span>
            <span className="info-value" style={{ color: "#2d3748" }}>
              {patient.tanggalLahir ? calculateAge(patient.tanggalLahir) : "-"}{" "}
              tahun
            </span>
          </div>
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              No. HP:
            </span>
            <span className="info-value" style={{ color: "#2d3748" }}>
              {patient.noHP}
            </span>
          </div>
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              Alamat:
            </span>
            <span
              className="info-value"
              style={{ color: "#2d3748" }}
            >{`${patient.alamat.kelurahan}, ${patient.alamat.kecamatan}, ${patient.alamat.kabupaten}, ${patient.alamat.provinsi}`}</span>
          </div>
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              Tgl. Daftar:
            </span>
            <span className="info-value" style={{ color: "#2d3748" }}>
              {format(new Date(patient.tanggalDaftar), "dd MMMM yyyy, HH:mm", {
                locale: id,
              })}
            </span>
          </div>
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              Terakhir Update:
            </span>
            <span className="info-value" style={{ color: "#2d3748" }}>
              {format(
                new Date(patient.terakhirDiUpdate),
                "dd MMMM yyyy, HH:mm",
                { locale: id }
              )}
            </span>
          </div>
          <div
            className="info-item"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <span
              className="info-label"
              style={{ fontWeight: "bold", color: "#4a5568" }}
            >
              Petugas Pendaftaran:
            </span>
            <span className="info-value" style={{ color: "#2d3748" }}>
              {patient.petugasPendaftaran}
            </span>
          </div>
        </div>

        {consultations && consultations.length > 0 && (
          <>
            <div style={{ pageBreakBefore: "always" }}></div>{" "}
            <div
              className="section-title"
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#3b82f6",
                marginBottom: "10px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "5px",
              }}
            >
              Riwayat Konsultasi
            </div>
            {consultations.map((consultation, index) => (
              <div
                key={consultation._id}
                style={{
                  marginBottom: "20px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "15px",
                  backgroundColor: "#fdfdfd",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#1a202c",
                    marginBottom: "8px",
                    borderBottom: "1px dotted #e2e8f0",
                    paddingBottom: "5px",
                  }}
                >
                  Konsultasi #{consultations.length - index} -{" "}
                  {consultation.tanggalKonsultasi
                    ? format(
                        new Date(consultation.tanggalKonsultasi),
                        "dd MMMM yyyy, HH:mm",
                        { locale: id }
                      )
                    : "-"}{" "}
                  ({consultation.petugasKonsultasi})
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "10px",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <span
                      className="info-label"
                      style={{ fontWeight: "bold", color: "#4a5568" }}
                    >
                      S (Subjective):
                    </span>{" "}
                    <span className="info-value" style={{ color: "#2d3748" }}>
                      {consultation.soap?.S || "-"}
                    </span>
                  </p>
                  <p style={{ margin: 0 }}>
                    <span
                      className="info-label"
                      style={{ fontWeight: "bold", color: "#4a5568" }}
                    >
                      A (Assessment):
                    </span>{" "}
                    <span className="info-value" style={{ color: "#2d3748" }}>
                      {consultation.soap?.A || "-"}
                    </span>
                  </p>
                  <p style={{ margin: 0 }}>
                    <span
                      className="info-label"
                      style={{ fontWeight: "bold", color: "#4a5568" }}
                    >
                      P (Plan):
                    </span>{" "}
                    <span className="info-value" style={{ color: "#2d3748" }}>
                      {consultation.soap?.P || "-"}
                    </span>
                  </p>
                  <p style={{ margin: 0 }}>
                    <span
                      className="info-label"
                      style={{ fontWeight: "bold", color: "#4a5568" }}
                    >
                      Therapy:
                    </span>{" "}
                    <span className="info-value" style={{ color: "#2d3748" }}>
                      {consultation.therapy || "-"}
                    </span>
                  </p>
                </div>

                <p
                  style={{
                    marginTop: "10px",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#4a5568",
                  }}
                >
                  <span className="info-label">O (Objective):</span>
                </p>
                <ul
                  style={{
                    marginLeft: "20px",
                    listStyleType: "disc",
                    color: "#2d3748",
                    margin: "0 0 0 20px",
                  }}
                >
                  <li>
                    Tensi: {consultation.soap?.O?.tensi?.sistolik || "-"} /{" "}
                    {consultation.soap?.O?.tensi?.diastolik || "-"} mmHg
                  </li>
                  <li>
                    Tinggi Badan: {consultation.soap?.O?.tinggiBadan || "-"} cm
                  </li>
                  <li>
                    Berat Badan: {consultation.soap?.O?.beratBadan || "-"} kg
                  </li>
                  {consultation.soap?.O?.tambahan && (
                    <li>Tambahan: {consultation.soap?.O?.tambahan}</li>
                  )}
                </ul>

                {index < consultations.length - 1 && (
                  <div
                    style={{
                      borderBottom: "1px dashed #e2e8f0",
                      margin: "20px 0",
                    }}
                  ></div>
                )}
              </div>
            ))}
          </>
        )}

        <div
          className="footer"
          style={{
            textAlign: "center",
            marginTop: "30px",
            fontSize: "10px",
            color: "#718096",
            borderTop: "1px dashed #e2e8f0",
            paddingTop: "10px",
          }}
        >
          Dokumen ini dihasilkan secara otomatis dari Sistem Manajemen Pasien
          pada{" "}
          {format(new Date(), "dd MMMM yyyy, HH:mm:ss", { locale: id })}.
        </div>
      </div>
    );
  }
);

export default PatientMedicalRecordTemplate;
