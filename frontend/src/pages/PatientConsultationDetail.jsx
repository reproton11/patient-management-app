// patient-management-app/frontend/src/pages/PatientConsultationDetail.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "react-toastify";
import Select from "react-select";
import { Dialog } from "@headlessui/react";
import {
  DocumentTextIcon,
  UploadIcon,
  PrinterIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/outline";

// jspdf & html2canvas di-import dinamis saat tombol cetak diklik (code splitting)

import PatientMedicalRecordTemplate from "../components/PatientMedicalRecordTemplate";
import useIndonesiaRegions from "../hooks/useIndonesiaRegions";
import { calculateAge, toTitleCase } from "../utils/helpers";

const AUTOSAVE_DELAY_MS = 3000;

const petugasOptions = [
  { value: "Heni", label: "Heni" },
  { value: "Maria", label: "Maria" },
  { value: "Emy", label: "Emy" },
  { value: "Aziz", label: "Aziz" },
];

const buildSoapSnapshot = (soapForm, therapy) =>
  JSON.stringify({ soapForm, therapy });

const PatientConsultationDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [printConsultations, setPrintConsultations] = useState([]);
  const [displayedConsultations, setDisplayedConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeConsultationId, setActiveConsultationId] = useState(null);
  const [isNewConsultation, setIsNewConsultation] = useState(false);
  const [totalKonsultasi, setTotalKonsultasi] = useState(0);

  // Form state untuk SOAP
  const [soapForm, setSoapForm] = useState({
    S: "",
    O: {
      tensi: { sistolik: "", diastolik: "" },
      tinggiBadan: "",
      beratBadan: "",
      tambahan: "",
    },
    A: "",
    P: "",
  });
  const [therapy, setTherapy] = useState("");
  const [petugasKonsultasi, setPetugasKonsultasi] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Auto-save SOAP state
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Upload file state (Update:Sudah dihapus dalam update fitur 25/9/2025)

  // Edit Patient State
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState({});
  const [editPatientErrors, setEditPatientErrors] = useState({});
  const [editPatientLoading, setEditPatientLoading] = useState(false);
  const [petugasEditPasien, setPetugasEditPasien] = useState("");

  const {
    provinces,
    regencies,
    districts,
    villages,
    fetchRegencies,
    fetchDistricts,
    fetchVillages,
    loading: regionsLoading,
  } = useIndonesiaRegions();

  // Untuk riwayat kunjungan (pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Ref untuk PDF export
  const componentRef = useRef();

  // state untuk print layout
  const [isPrintLayoutVisible, setIsPrintLayoutVisible] = useState(false);

  // === Auto-save SOAP (debounce 3 detik setelah berhenti mengetik) ===
  const soapBaselineRef = useRef("");
  const soapStateRef = useRef({ soapForm, therapy });
  soapStateRef.current = { soapForm, therapy };
  const activeIdRef = useRef(activeConsultationId);
  activeIdRef.current = activeConsultationId;
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  const performAutoSave = useCallback(async () => {
    if (savingRef.current) {
      pendingSaveRef.current = true;
      return;
    }
    const konsulId = activeIdRef.current;
    if (!konsulId || isNewConsultation) return;

    const current = soapStateRef.current;
    const snapshot = buildSoapSnapshot(current.soapForm, current.therapy);
    if (snapshot === soapBaselineRef.current) {
      setAutoSaveStatus("idle");
      return;
    }

    savingRef.current = true;
    setAutoSaveStatus("saving");
    try {
      await api.put(`/konsultasi/${konsulId}`, {
        pasienId: patientId,
        soap: current.soapForm,
        therapy: current.therapy,
      });
      if (activeIdRef.current === konsulId) {
        soapBaselineRef.current = snapshot;
        setLastSavedAt(new Date());
        setAutoSaveStatus("saved");
      }
    } catch (err) {
      console.error("Autosave gagal:", err);
      if (activeIdRef.current === konsulId) {
        setAutoSaveStatus("error");
        toast.error("Auto-save gagal. Klik Simpan untuk mencoba lagi.");
      }
    } finally {
      savingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        performAutoSave();
      }
    }
  }, [patientId, isNewConsultation]);

  useEffect(() => {
    if (isNewConsultation || !activeConsultationId || !patient) return;

    const snapshot = buildSoapSnapshot(soapForm, therapy);
    if (snapshot === soapBaselineRef.current) return;

    setAutoSaveStatus("dirty");
    const timer = setTimeout(() => {
      performAutoSave();
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [soapForm, therapy, isNewConsultation, activeConsultationId, patient, performAutoSave]);

  // Pindahkan deklarasi fungsi-fungsi ini ke ATAS, sebelum `fetchPatientData`
  const fillFormWithConsultationData = useCallback((consultation) => {
    setSoapForm({
      S: consultation.soap?.S || "",
      O: {
        tensi: consultation.soap?.O?.tensi || { sistolik: "", diastolik: "" },
        tinggiBadan: consultation.soap?.O?.tinggiBadan || "",
        beratBadan: consultation.soap?.O?.beratBadan || "",
        tambahan: consultation.soap?.O?.tambahan || "",
      },
      A: consultation.soap?.A || "",
      P: consultation.soap?.P || "",
    });
    setTherapy(consultation.therapy || "");
    setPetugasKonsultasi(consultation.petugasKonsultasi || "");
    setFormErrors({});
    soapBaselineRef.current = buildSoapSnapshot(
      {
        S: consultation.soap?.S || "",
        O: {
          tensi: consultation.soap?.O?.tensi || { sistolik: "", diastolik: "" },
          tinggiBadan: consultation.soap?.O?.tinggiBadan || "",
          beratBadan: consultation.soap?.O?.beratBadan || "",
          tambahan: consultation.soap?.O?.tambahan || "",
        },
        A: consultation.soap?.A || "",
        P: consultation.soap?.P || "",
      },
      consultation.therapy || ""
    );
    setAutoSaveStatus("idle");
  }, []);

  const resetFormForNewConsultation = useCallback((patientData) => {
    const emptyForm = {
      S: "",
      O: {
        tensi: patientData.tensi || { sistolik: "", diastolik: "" },
        tinggiBadan: patientData.tinggiBadan || "",
        beratBadan: patientData.beratBadan || "",
        tambahan: "N ",
      },
      A: "",
      P: "",
    };
    setSoapForm(emptyForm);
    setTherapy("");
    setPetugasKonsultasi("");
    setFormErrors({});
    setIsNewConsultation(true);
    setActiveConsultationId(null);
    soapBaselineRef.current = buildSoapSnapshot(emptyForm, "");
    setAutoSaveStatus("idle");
  }, []);

  // === Mulai handleGeneratePdf (jspdf & html2canvas dimuat on-demand) ===
  const handleGeneratePdf = useCallback(async () => {
    if (!patient) {
      toast.error("Data pasien belum lengkap untuk dicetak.");
      return;
    }

    setLoading(true);
    try {
      // Ambil seluruh riwayat konsultasi hanya saat cetak
      let consultations = [];
      try {
        const res = await api.get(`/konsultasi/pasien/${patientId}`, {
          params: { limit: 100 },
        });
        consultations = res.data.konsultasi || [];
      } catch (err) {
        if (err.response?.status !== 404) throw err;
      }
      setPrintConsultations(consultations);
    } catch (err) {
      console.error("Error fetching consultations for print:", err);
      toast.error("Gagal memuat riwayat konsultasi untuk cetak.");
      setLoading(false);
      return;
    }

    setIsPrintLayoutVisible(true); // Render komponen cetak agar bisa ditangkap html2canvas

    // Beri waktu React untuk merender komponen ke DOM
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      if (!componentRef.current) {
        console.error("componentRef.current is null when generating PDF.");
        toast.error(
          "Gagal membuat PDF: Komponen cetak tidak ditemukan. Coba lagi."
        );
        return;
      }

      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const element = componentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Peningkatan resolusi untuk kualitas PDF yang lebih baik
        useCORS: true, // Penting jika ada gambar dari domain lain (misal logo)
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4"); // 'p' for portrait, 'mm' for units, 'a4' for size
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `Rekam_Medis_${patient.noKartu}_${format(new Date(), "dd-MM-yyyy")}.pdf`
      );
      toast.success("Rekam medis berhasil diekspor ke PDF!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Terjadi kesalahan saat membuat PDF. Coba lagi.");
    } finally {
      setLoading(false);
      setIsPrintLayoutVisible(false); // Sembunyikan kembali komponen cetak
    }
  }, [patient, patientId]);
  // === Akhir handleGeneratePdf ===

  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      const patientRes = await api.get(`/pasien/${patientId}`);
      setPatient(patientRes.data);

      const patientData = patientRes.data;
      setEditPatientForm({
        nama: patientData.nama,
        alamat: patientData.alamat,
        jenisKelamin: patientData.jenisKelamin,
        tanggalLahir: patientData.tanggalLahir
          ? format(new Date(patientData.tanggalLahir), "yyyy-MM-dd")
          : "",
        noHP: patientData.noHP,
        tensi: patientData.tensi || { sistolik: "", diastolik: "" },
        tinggiBadan: patientData.tinggiBadan || "",
        beratBadan: patientData.beratBadan || "",
        petugasPendaftaran: patientData.petugasPendaftaran,
      });

      // Fetch PAGINATED consultations for UI display
      let paginatedData = {
        konsultasi: [],
        totalItems: 0,
        totalPages: 1,
      };
      try {
        const paginatedConsultationsRes = await api.get(
          `/konsultasi/pasien/${patientId}`,
          {
            params: { page: currentPage, limit: ITEMS_PER_PAGE },
          }
        );
        paginatedData = paginatedConsultationsRes.data;
      } catch (err) {
        if (err.response?.status !== 404) throw err;
      }

      setDisplayedConsultations(paginatedData.konsultasi || []);
      setTotalPages(paginatedData.totalPages || 1);
      setTotalKonsultasi(paginatedData.totalItems || 0);

      // Logic untuk menentukan konsultasi aktif
      // Jika kita sedang dalam mode 'konsultasi baru', jangan override
      // Jika bukan mode baru dan ada konsultasi, set yang terbaru sebagai aktif
      if (!isNewConsultation && paginatedData.konsultasi.length > 0) {
        setActiveConsultationId(paginatedData.konsultasi[0]._id);
        fillFormWithConsultationData(paginatedData.konsultasi[0]);
      } else if (isNewConsultation && paginatedData.konsultasi.length === 0) {
        // Jika sedang mode baru, tapi ternyata tidak ada konsultasi sama sekali,
        // maka set up form kosong dengan data awal pasien
        resetFormForNewConsultation(patientRes.data);
      } else if (paginatedData.konsultasi.length === 0) {
        // Jika tidak ada konsultasi sama sekali, bahkan sebelum klik "Mulai Konsultasi Baru"
        resetFormForNewConsultation(patientRes.data);
        setIsNewConsultation(true); // Pastikan ini juga diatur ke true
      }
    } catch (err) {
      console.error("Error fetching patient data or consultations:", err);
      setError("Gagal memuat data pasien atau riwayat konsultasi.");
      toast.error("Gagal memuat data pasien atau riwayat konsultasi.");
    } finally {
      setLoading(false);
    }
  }, [
    patientId,
    currentPage,
    isNewConsultation,
    navigate,
    fillFormWithConsultationData,
    resetFormForNewConsultation,
  ]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  // Handle region fetching for Edit Patient Modal (tetap sama)
  useEffect(() => {
    if (isEditPatientModalOpen && editPatientForm.alamat?.provinsi) {
      const selectedProvince = provinces.find(
        (p) => p.label === editPatientForm.alamat.provinsi
      );
      if (selectedProvince) {
        fetchRegencies(selectedProvince.value);
      }
    } else if (isEditPatientModalOpen && !editPatientForm.alamat?.provinsi) {
      fetchRegencies("");
    }
  }, [
    editPatientForm.alamat?.provinsi,
    isEditPatientModalOpen,
    provinces,
    fetchRegencies,
  ]);

  useEffect(() => {
    if (isEditPatientModalOpen && editPatientForm.alamat?.kabupaten) {
      const selectedRegency = regencies.find(
        (r) => r.label === editPatientForm.alamat.kabupaten
      );
      if (selectedRegency) {
        fetchDistricts(selectedRegency.value);
      }
    } else if (isEditPatientModalOpen && !editPatientForm.alamat?.kabupaten) {
      fetchDistricts("");
    }
  }, [
    editPatientForm.alamat?.kabupaten,
    isEditPatientModalOpen,
    regencies,
    fetchDistricts,
  ]);

  useEffect(() => {
    if (isEditPatientModalOpen && editPatientForm.alamat?.kecamatan) {
      const selectedDistrict = districts.find(
        (d) => d.label === editPatientForm.alamat.kecamatan
      );
      if (selectedDistrict) {
        fetchVillages(selectedDistrict.value);
      }
    } else if (isEditPatientModalOpen && !editPatientForm.alamat?.kecamatan) {
      fetchVillages("");
    }
  }, [
    editPatientForm.alamat?.kecamatan,
    isEditPatientModalOpen,
    districts,
    fetchVillages,
  ]);

  // handleConsultationSelect, handleSoapChange, handleSaveConsultation, dll. tetap di tempatnya

  const handleConsultationSelect = (consultation) => {
    setActiveConsultationId(consultation._id);
    fillFormWithConsultationData(consultation);
    setIsNewConsultation(false);
  };

  const handleSoapChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("O.tensi.")) {
      const field = name.split(".")[2];
      setSoapForm((prev) => ({
        ...prev,
        O: {
          ...prev.O,
          tensi: {
            ...prev.O.tensi,
            [field]: value === "" ? "" : Number(value),
          },
        },
      }));
    } else if (name.startsWith("O.")) {
      const field = name.split(".")[1];
      setSoapForm((prev) => ({
        ...prev,
        O: {
          ...prev.O,
          [field]:
            value === ""
              ? ""
              : field === "tinggiBadan" || field === "beratBadan"
              ? Number(value)
              : value,
        },
      }));
    } else {
      setSoapForm((prev) => ({ ...prev, [name]: value }));
    }
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSaveConsultation = async () => {
    if (!petugasKonsultasi) {
      toast.error("Petugas konsultasi wajib dipilih.");
      return;
    }
    setLoading(true);
    setFormErrors({});
    try {
      const dataToSave = {
        pasienId: patientId,
        soap: soapForm,
        therapy,
        petugasKonsultasi,
      };

      if (isNewConsultation) {
        await api.post("/konsultasi", dataToSave);
        toast.success("Konsultasi baru berhasil ditambahkan!");
      } else {
        await api.put(`/konsultasi/${activeConsultationId}`, dataToSave);
        toast.success("Konsultasi berhasil diupdate!");
      }
      soapBaselineRef.current = buildSoapSnapshot(soapForm, therapy);
      setLastSavedAt(new Date());
      setAutoSaveStatus("saved");
      setIsNewConsultation(false);
      // Setelah simpan, refresh data pasien dan konsultasi
      fetchPatientData();
    } catch (err) {
      console.error("Error saving consultation:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        const apiErrors = {};
        err.response.data.errors.forEach((error) => {
          apiErrors[error.field] = error.message;
        });
        setFormErrors(apiErrors);
        toast.error("Validasi gagal. Mohon periksa kembali input Anda.");
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Gagal menyimpan konsultasi.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- File Upload Logic --- (Update:Sudah dihapus dalam update fitur 25/9/2025)

  // --- Edit Patient Logic ---
  const openEditPatientModal = () => {
    const patientData = patient;
    setEditPatientForm({
      nama: patientData.nama,
      alamat: patientData.alamat,
      jenisKelamin: patientData.jenisKelamin,
      tanggalLahir: patientData.tanggalLahir
        ? format(new Date(patientData.tanggalLahir), "yyyy-MM-dd")
        : "",
      noHP: patientData.noHP,
      tensi: patientData.tensi || { sistolik: "", diastolik: "" },
      tinggiBadan: patientData.tinggiBadan || "",
      beratBadan: patientData.beratBadan || "",
    });
    setPetugasEditPasien("");
    setEditPatientErrors({});
    setIsEditPatientModalOpen(true);
  };

  const closeEditPatientModal = () => {
    setIsEditPatientModalOpen(false);
    setPetugasEditPasien("");
    setEditPatientErrors({});
    fetchRegencies("");
    fetchDistricts("");
    fetchVillages("");
  };

  const handleEditPatientChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("alamat.")) {
      const alamatField = name.split(".")[1];
      setEditPatientForm((prev) => ({
        ...prev,
        alamat: { ...prev.alamat, [alamatField]: value },
      }));
    } else if (name.startsWith("tensi.")) {
      const tensiField = name.split(".")[1];
      setEditPatientForm((prev) => ({
        ...prev,
        tensi: {
          ...prev.tensi,
          [tensiField]: value === "" ? "" : Number(value),
        },
      }));
    } else {
      setEditPatientForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setEditPatientErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEditPatientSelectChange = (selectedOption, { name }) => {
    if (name.startsWith("alamat.")) {
      const alamatField = name.split(".")[1];
      setEditPatientForm((prev) => ({
        ...prev,
        alamat: {
          ...prev.alamat,
          [alamatField]: selectedOption ? selectedOption.label : "",
        },
      }));
    } else {
      setEditPatientForm((prev) => ({
        ...prev,
        [name]: selectedOption ? selectedOption.value : "",
      }));
    }
    setEditPatientErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleUpdatePatient = async () => {
    if (!petugasEditPasien) {
      toast.error("Petugas yang mengedit wajib dipilih.");
      return;
    }
    setEditPatientLoading(true);
    setEditPatientErrors({});
    try {
      const payload = {
        ...editPatientForm,
        nama: editPatientForm.nama ? toTitleCase(editPatientForm.nama) : "",
        petugasPendaftaran: petugasEditPasien,
      };
      await api.put(`/pasien/${patientId}`, payload);
      toast.success("Data pasien berhasil diupdate!");
      closeEditPatientModal();
      fetchPatientData();
    } catch (err) {
      console.error("Error updating patient:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        const apiErrors = {};
        err.response.data.errors.forEach((error) => {
          apiErrors[error.field] = error.message;
        });
        setEditPatientErrors(apiErrors);
        toast.error("Validasi gagal. Mohon periksa kembali input Anda.");
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Gagal mengupdate data pasien.");
      }
    } finally {
      setEditPatientLoading(false);
    }
  };

  if (loading && !patient)
    return <div className="text-center py-8">Memuat data pasien...</div>;
  if (error)
    return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!patient)
    return <div className="text-center py-8">Pasien tidak ditemukan.</div>;

  const activeConsultation = displayedConsultations.find(
    (c) => c._id === activeConsultationId
  ) || { files: [] };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-4">
        Konsultasi Pasien: {patient.nama}
      </h1>

      {/* Patient Info Card */}
      <motion.div
        className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4 no-print">
          <h2 className="text-2xl font-semibold text-gray-800">
            Detail Pasien
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={openEditPatientModal}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-200"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Data Pasien
            </button>
            <button
              onClick={handleGeneratePdf} // Panggil fungsi generate PDF yang baru
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
              disabled={!patient || loading || totalKonsultasi === 0}
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Cetak Rekam Medis
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700">
          <div>
            <p className="font-medium">No. Kartu:</p>
            <p className="font-bold text-lg text-blue-600">{patient.noKartu}</p>
          </div>
          <div>
            <p className="font-medium">Nama:</p>
            <p>{patient.nama}</p>
          </div>
          <div>
            <p className="font-medium">Jenis Kelamin:</p>
            <p>{patient.jenisKelamin}</p>
          </div>
          <div>
            <p className="font-medium">Tanggal Lahir:</p>
            <p>
              {patient.tanggalLahir
                ? format(new Date(patient.tanggalLahir), "dd MMMM yyyy", {
                    locale: id,
                  })
                : "-"}
            </p>
          </div>
          <div>
            <p className="font-medium">Umur:</p>
            <p>
              {patient.tanggalLahir ? calculateAge(patient.tanggalLahir) : "-"}{" "}
              tahun
            </p>
          </div>
          <div>
            <p className="font-medium">No. HP:</p>
            <p>{patient.noHP}</p>
          </div>
          <div>
            <p className="font-medium">Alamat:</p>
            <p>
              {patient.alamat
                ? `${patient.alamat.kelurahan || "-"}, ${
                    patient.alamat.kecamatan || "-"
                  }, ${patient.alamat.kabupaten || "-"}, ${
                    patient.alamat.provinsi || "-"
                  }`
                : "-"}
            </p>
          </div>
          <div>
            <p className="font-medium">Tgl. Daftar:</p>
            <p>
              {patient.tanggalDaftar
                ? format(new Date(patient.tanggalDaftar), "dd MMMM yyyy, HH:mm", {
                    locale: id,
                  })
                : "-"}
            </p>
          </div>
          <div>
            <p className="font-medium">Terakhir di Update:</p>
            <p>
              {patient.terakhirDiUpdate
                ? format(
                    new Date(patient.terakhirDiUpdate),
                    "dd MMMM yyyy, HH:mm",
                    { locale: id }
                  )
                : "-"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Consultations History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200 no-print h-fit"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">
            Riwayat Konsultasi
          </h2>
          <button
            onClick={() => resetFormForNewConsultation(patient)}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 mb-4"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Mulai Konsultasi Baru
          </button>
          {displayedConsultations.length > 0 ? (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {displayedConsultations.map((consultation) => (
                <li key={consultation._id}>
                  <button
                    onClick={() => handleConsultationSelect(consultation)}
                    className={`w-full text-left p-3 rounded-lg border transition duration-200
                      ${
                        activeConsultationId === consultation._id
                          ? "bg-blue-100 border-blue-500 text-blue-800 shadow-md"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-blue-300"
                      }`}
                  >
                    <p className="font-medium">
                      Konsultasi pada:{" "}
                      {format(
                        new Date(consultation.tanggalKonsultasi),
                        "dd MMMM yyyy, HH:mm",
                        { locale: id }
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Oleh: {consultation.petugasKonsultasi}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Belum ada riwayat konsultasi.</p>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Berikutnya
                </button>
              </nav>
            </div>
          )}
        </motion.div>

        {/* SOAP Form & File Upload */}
        <motion.div
          className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200 no-print"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b">
            <h2 className="text-2xl font-semibold text-gray-800">
              {isNewConsultation
                ? "Konsultasi Baru"
                : `Detail Konsultasi #${activeConsultation?._id?.slice(-5)}`}
            </h2>
            <AutoSaveIndicator status={autoSaveStatus} lastSavedAt={lastSavedAt} />
          </div>

          {isNewConsultation && (
            <p className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              Konsultasi baru perlu disimpan manual sekali dengan tombol Simpan.
              Setelah tersimpan, perubahan akan ter-auto-save otomatis 3 detik
              setelah berhenti mengetik.
            </p>
          )}

          <div className="space-y-4">
            {/* Subjective */}
            <div>
              <label
                htmlFor="S"
                className="block text-sm font-medium text-gray-700"
              >
                S (Subjective - Keluhan Pasien)
              </label>
              <textarea
                id="S"
                name="S"
                value={soapForm.S}
                onChange={handleSoapChange}
                rows="3"
                className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.S ? "border-red-500" : "border-gray-300"
                }`}
              ></textarea>
              {formErrors.S && (
                <p className="mt-1 text-sm text-red-500">{formErrors.S}</p>
              )}
            </div>

            {/* Objective */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                O (Objective)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                <div>
                  <label
                    htmlFor="tensiSistolikO"
                    className="block text-xs font-medium text-gray-600"
                  >
                    Tensi (Sistolik)
                  </label>
                  <input
                    type="number"
                    id="tensiSistolikO"
                    name="O.tensi.sistolik"
                    value={soapForm.O.tensi.sistolik}
                    onChange={handleSoapChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      formErrors["O.tensi.sistolik"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="mmHg"
                  />
                  {formErrors["O.tensi.sistolik"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors["O.tensi.sistolik"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="tensiDiastolikO"
                    className="block text-xs font-medium text-gray-600"
                  >
                    Tensi (Diastolik)
                  </label>
                  <input
                    type="number"
                    id="tensiDiastolikO"
                    name="O.tensi.diastolik"
                    value={soapForm.O.tensi.diastolik}
                    onChange={handleSoapChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      formErrors["O.tensi.diastolik"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="mmHg"
                  />
                  {formErrors["O.tensi.diastolik"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors["O.tensi.diastolik"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="tinggiBadanO"
                    className="block text-xs font-medium text-gray-600"
                  >
                    Tinggi Badan (cm)
                  </label>
                  <input
                    type="number"
                    id="tinggiBadanO"
                    name="O.tinggiBadan"
                    value={soapForm.O.tinggiBadan}
                    onChange={handleSoapChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      formErrors["O.tinggiBadan"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="cm"
                  />
                  {formErrors["O.tinggiBadan"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors["O.tinggiBadan"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="beratBadanO"
                    className="block text-xs font-medium text-gray-600"
                  >
                    Berat Badan (kg)
                  </label>
                  <input
                    type="number"
                    id="beratBadanO"
                    name="O.beratBadan"
                    value={soapForm.O.beratBadan}
                    onChange={handleSoapChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      formErrors["O.beratBadan"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="kg"
                  />
                  {formErrors["O.beratBadan"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors["O.beratBadan"]}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <label
                  htmlFor="tambahanO"
                  className="block text-xs font-medium text-gray-600"
                >
                  Tambahan (Observasi Manual)
                </label>
                <textarea
                  id="tambahanO"
                  name="O.tambahan"
                  value={soapForm.O.tambahan}
                  onChange={handleSoapChange}
                  rows="2"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    formErrors["O.tambahan"]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                ></textarea>
                {formErrors["O.tambahan"] && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors["O.tambahan"]}
                  </p>
                )}
              </div>
            </div>

            {/* Assessment */}
            <div>
              <label
                htmlFor="A"
                className="block text-sm font-medium text-gray-700"
              >
                A (Assessment - Diagnosis Dokter)
              </label>
              <textarea
                id="A"
                name="A"
                value={soapForm.A}
                onChange={handleSoapChange}
                rows="3"
                className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.A ? "border-red-500" : "border-gray-300"
                }`}
              ></textarea>
              {formErrors.A && (
                <p className="mt-1 text-sm text-red-500">{formErrors.A}</p>
              )}
            </div>

            {/* Plan */}
            <div>
              <label
                htmlFor="P"
                className="block text-sm font-medium text-gray-700"
              >
                P (Plan - Rencana Tindakan)
              </label>
              <textarea
                id="P"
                name="P"
                value={soapForm.P}
                onChange={handleSoapChange}
                rows="3"
                className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.P ? "border-red-500" : "border-gray-300"
                }`}
              ></textarea>
              {formErrors.P && (
                <p className="mt-1 text-sm text-red-500">{formErrors.P}</p>
              )}
            </div>

            {/* Therapy */}
            <div>
              <label
                htmlFor="therapy"
                className="block text-sm font-medium text-gray-700"
              >
                Therapy (Resep Obat, Tindakan Medis)
              </label>
              <textarea
                id="therapy"
                name="therapy"
                value={therapy}
                onChange={(e) => setTherapy(e.target.value)}
                rows="3"
                className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.therapy ? "border-red-500" : "border-gray-300"
                }`}
              ></textarea>
              {formErrors.therapy && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.therapy}
                </p>
              )}
            </div>

            {/* Petugas Konsultasi (dipilih manual, terkunci setelah tersimpan) */}
            <div>
              <label
                htmlFor="petugasKonsultasi"
                className="block text-sm font-medium text-gray-700"
              >
                Petugas Konsultasi
              </label>
              <Select
                id="petugasKonsultasi"
                name="petugasKonsultasi"
                options={petugasOptions}
                onChange={(selected) =>
                  setPetugasKonsultasi(selected ? selected.value : "")
                }
                value={
                  petugasOptions.find(
                    (opt) => opt.value === petugasKonsultasi
                  ) || null
                }
                className={`mt-1 block w-full ${
                  formErrors.petugasKonsultasi ? "border-red-500" : ""
                }`}
                classNamePrefix="react-select"
                placeholder="Pilih Petugas Konsultasi"
                isClearable
                required={isNewConsultation}
              />
              {formErrors.petugasKonsultasi && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.petugasKonsultasi}
                </p>
              )}
              {!isNewConsultation && (
                <p className="mt-1 text-xs text-gray-400">
                  Perubahan petugas hanya berlaku melalui tombol Simpan.
                </p>
              )}
            </div>

            {/* File Upload Section (Update:Sudah dihapus dalam update fitur 25/9/2025) */}

            {/* Tombol Save */}
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleSaveConsultation}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                disabled={loading}
              >
                {loading
                  ? "Menyimpan..."
                  : isNewConsultation
                  ? "Simpan Konsultasi Baru"
                  : "Update Konsultasi"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Upload File Modal (Update:Sudah dihapus dalam update fitur 25/9/2025) */}

      {/* Preview File Modal (Update:Sudah dihapus dalam update fitur 25/9/2025) */}

      {/* Edit Patient Modal */}
      <Dialog
        open={isEditPatientModalOpen}
        onClose={closeEditPatientModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl my-8 font-sans">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
              Edit Data Pasien
            </Dialog.Title>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdatePatient();
              }}
              className="space-y-4"
            >
              {/* Nama Pasien */}
              <div>
                <label
                  htmlFor="editNama"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="editNama"
                  name="nama"
                  value={editPatientForm.nama || ""}
                  onChange={handleEditPatientChange}
                  className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    editPatientErrors.nama
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                  pattern="[a-zA-Z\s]+"
                  title="Nama hanya boleh mengandung huruf dan spasi"
                />
                {editPatientErrors.nama && (
                  <p className="mt-1 text-sm text-red-500">
                    {editPatientErrors.nama}
                  </p>
                )}
              </div>

              {/* Alamat Lengkap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="editProvinsi"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Provinsi
                  </label>
                  <Select
                    id="editProvinsi"
                    name="alamat.provinsi"
                    options={provinces}
                    onChange={handleEditPatientSelectChange}
                    value={
                      provinces.find(
                        (opt) => opt.label === editPatientForm.alamat?.provinsi
                      ) || null
                    }
                    className={`mt-1 block w-full ${
                      editPatientErrors["alamat.provinsi"]
                        ? "border-red-500"
                        : ""
                    }`}
                    classNamePrefix="react-select"
                    placeholder="Pilih Provinsi"
                    isClearable
                    isDisabled={regionsLoading}
                    required
                  />
                  {editPatientErrors["alamat.provinsi"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors["alamat.provinsi"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="editKabupaten"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Kabupaten/Kota
                  </label>
                  <Select
                    id="editKabupaten"
                    name="alamat.kabupaten"
                    options={regencies}
                    onChange={handleEditPatientSelectChange}
                    value={
                      regencies.find(
                        (opt) => opt.label === editPatientForm.alamat?.kabupaten
                      ) || null
                    }
                    className={`mt-1 block w-full ${
                      editPatientErrors["alamat.kabupaten"]
                        ? "border-red-500"
                        : ""
                    }`}
                    classNamePrefix="react-select"
                    placeholder="Pilih Kabupaten/Kota"
                    isClearable
                    isDisabled={
                      !editPatientForm.alamat?.provinsi || regionsLoading
                    }
                    required
                  />
                  {editPatientErrors["alamat.kabupaten"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors["alamat.kabupaten"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="editKecamatan"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Kecamatan
                  </label>
                  <Select
                    id="editKecamatan"
                    name="alamat.kecamatan"
                    options={districts}
                    onChange={handleEditPatientSelectChange}
                    value={
                      districts.find(
                        (opt) => opt.label === editPatientForm.alamat?.kecamatan
                      ) || null
                    }
                    className={`mt-1 block w-full ${
                      editPatientErrors["alamat.kecamatan"]
                        ? "border-red-500"
                        : ""
                    }`}
                    classNamePrefix="react-select"
                    placeholder="Pilih Kecamatan"
                    isClearable
                    isDisabled={
                      !editPatientForm.alamat?.kabupaten || regionsLoading
                    }
                    required
                  />
                  {editPatientErrors["alamat.kecamatan"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors["alamat.kecamatan"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="editKelurahan"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Kelurahan/Desa
                  </label>
                  <Select
                    id="editKelurahan"
                    name="alamat.kelurahan"
                    options={villages}
                    onChange={handleEditPatientSelectChange}
                    value={
                      villages.find(
                        (opt) => opt.label === editPatientForm.alamat?.kelurahan
                      ) || null
                    }
                    className={`mt-1 block w-full ${
                      editPatientErrors["alamat.kelurahan"]
                        ? "border-red-500"
                        : ""
                    }`}
                    classNamePrefix="react-select"
                    placeholder="Pilih Kelurahan/Desa"
                    isClearable
                    isDisabled={
                      !editPatientForm.alamat?.kecamatan || regionsLoading
                    }
                    required
                  />
                  {editPatientErrors["alamat.kelurahan"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors["alamat.kelurahan"]}
                    </p>
                  )}
                </div>
              </div>

              {/* Jenis Kelamin & Umur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="editJenisKelamin"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Jenis Kelamin
                  </label>
                  <Select
                    id="editJenisKelamin"
                    name="jenisKelamin"
                    options={[
                      { value: "Laki-laki", label: "Laki-laki" },
                      { value: "Perempuan", label: "Perempuan" },
                      { value: "Other", label: "Lainnya" },
                    ]}
                    onChange={handleEditPatientSelectChange}
                    value={
                      [
                        { value: "Laki-laki", label: "Laki-laki" },
                        { value: "Perempuan", label: "Perempuan" },
                        { value: "Other", label: "Lainnya" },
                      ].find(
                        (opt) => opt.value === editPatientForm.jenisKelamin
                      ) || null
                    }
                    className={`mt-1 block w-full ${
                      editPatientErrors.jenisKelamin ? "border-red-500" : ""
                    }`}
                    classNamePrefix="react-select"
                    placeholder="Pilih Jenis Kelamin"
                    isClearable
                    required
                  />
                  {editPatientErrors.jenisKelamin && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors.jenisKelamin}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="editTanggalLahir"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    id="editTanggalLahir"
                    name="tanggalLahir"
                    value={editPatientForm.tanggalLahir || ""}
                    onChange={handleEditPatientChange}
                    className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      editPatientErrors.tanggalLahir
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    min="0"
                    max="150"
                    required
                  />
                  {editPatientErrors.tanggalLahir && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors.tanggalLahir}
                    </p>
                  )}
                </div>
              </div>

              {/* No. HP */}
              <div>
                <label
                  htmlFor="editNoHP"
                  className="block text-sm font-medium text-gray-700"
                >
                  No. HP
                </label>
                <input
                  type="text"
                  id="editNoHP"
                  name="noHP"
                  value={editPatientForm.noHP || ""}
                  onChange={handleEditPatientChange}
                  className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    editPatientErrors.noHP
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                  minLength="10"
                  maxLength="15"
                  pattern="[0-9]+"
                  title="No. HP hanya boleh angka, minimal 10 digit, maksimal 15 digit"
                />
                {editPatientErrors.noHP && (
                  <p className="mt-1 text-sm text-red-500">
                    {editPatientErrors.noHP}
                  </p>
                )}
              </div>

              {/* Tensi, TB, BB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="editTensiSistolik"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tensi (Sistolik)
                  </label>
                  <input
                    type="number"
                    id="editTensiSistolik"
                    name="tensi.sistolik"
                    value={editPatientForm.tensi?.sistolik || ""}
                    onChange={handleEditPatientChange}
                    className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      editPatientErrors["tensi.sistolik"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    min="60"
                    max="200"
                    placeholder="mmHg"
                  />
                  {editPatientErrors["tensi.sistolik"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors["tensi.sistolik"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="editTensiDiastolik"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tensi (Diastolik)
                  </label>
                  <input
                    type="number"
                    id="editTensiDiastolik"
                    name="tensi.diastolik"
                    value={editPatientForm.tensi?.diastolik || ""}
                    onChange={handleEditPatientChange}
                    className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      editPatientErrors["tensi.diastolik"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    min="40"
                    max="120"
                    placeholder="mmHg"
                  />
                  {editPatientErrors["tensi.diastolik"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors["tensi.diastolik"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="editTinggiBadan"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tinggi Badan (cm)
                  </label>
                  <input
                    type="number"
                    id="editTinggiBadan"
                    name="tinggiBadan"
                    value={editPatientForm.tinggiBadan || ""}
                    onChange={handleEditPatientChange}
                    className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      editPatientErrors.tinggiBadan
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    min="50"
                    max="250"
                    placeholder="cm"
                  />
                  {editPatientErrors.tinggiBadan && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors.tinggiBadan}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="editBeratBadan"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Berat Badan (kg)
                  </label>
                  <input
                    type="number"
                    id="editBeratBadan"
                    name="beratBadan"
                    value={editPatientForm.beratBadan || ""}
                    onChange={handleEditPatientChange}
                    className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      editPatientErrors.beratBadan
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    min="10"
                    max="300"
                    placeholder="kg"
                  />
                  {editPatientErrors.beratBadan && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors.beratBadan}
                    </p>
                  )}
                </div>
              </div>

              {/* Petugas yang Mengedit */}
              <div>
                <label
                  htmlFor="petugasEditPasien"
                  className="block text-sm font-medium text-gray-700"
                >
                  Petugas yang Mengedit:
                </label>
                <Select
                  id="petugasEditPasien"
                  name="petugasEditPasien"
                  options={petugasOptions}
                  onChange={(selected) =>
                    setPetugasEditPasien(selected ? selected.value : "")
                  }
                  value={
                    petugasOptions.find(
                      (opt) => opt.value === petugasEditPasien
                    ) || null
                  }
                  classNamePrefix="react-select"
                  placeholder="Pilih Petugas"
                  isClearable
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditPatientModal}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  disabled={
                    editPatientLoading || regionsLoading || !petugasEditPasien
                  }
                >
                  {editPatientLoading || regionsLoading
                    ? "Menyimpan..."
                    : "Update Data Pasien"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Komponen Cetak: Dirender secara kondisional */}
      {patient && (
        <div
          className="print-area-wrapper"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "0px",
            height: "0px",
            overflow: "hidden",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
            display: isPrintLayoutVisible ? "block" : "none",
          }}
        >
          <PatientMedicalRecordTemplate
            ref={componentRef}
            patient={patient}
            consultations={printConsultations}
          />
        </div>
      )}
    </motion.div>
  );
};

const AutoSaveIndicator = ({ status, lastSavedAt }) => {
  const base = "text-xs font-medium inline-flex items-center gap-1.5";
  switch (status) {
    case "dirty":
      return <span className={`${base} text-gray-400`}>Perubahan belum disimpan...</span>;
    case "saving":
      return (
        <span className={`${base} text-blue-600`} data-testid="autosave-saving">
          <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
          Menyimpan...
        </span>
      );
    case "saved":
      return (
        <span className={`${base} text-green-600`} data-testid="autosave-saved">
          ✓ Tersimpan
          {lastSavedAt ? ` ${format(lastSavedAt, "HH:mm")}` : ""}
        </span>
      );
    case "error":
      return <span className={`${base} text-red-600`}>Auto-save gagal</span>;
    default:
      return null;
  }
};

export default PatientConsultationDetail;
