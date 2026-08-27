// patient-management-app/frontend/src/pages/PatientConsultationDetail.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "react-toastify";
import {
  DocumentTextIcon,
  PrinterIcon,
  PencilIcon,
} from "@heroicons/react/outline";

// jspdf & html2canvas di-import dinamis saat tombol cetak diklik (code splitting)

import PatientMedicalRecordTemplate from "../components/PatientMedicalRecordTemplate";
import useIndonesiaRegions from "../hooks/useIndonesiaRegions";
import { calculateAge, toTitleCase } from "../utils/helpers";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Field, { Input, Textarea } from "../components/ui/Field";
import Pagination from "../components/ui/Pagination";
import SelectInput from "../components/ui/SelectInput";

const AUTOSAVE_DELAY_MS = 3000;

const petugasOptions = [
  { value: "Heni", label: "Heni" },
  { value: "Maria", label: "Maria" },
  { value: "Emy", label: "Emy" },
  { value: "Aziz", label: "Aziz" },
].sort((a, b) => a.label.localeCompare(b.label, "id"));

const jenisKelaminOptions = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
  { value: "Other", label: "Lainnya" },
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
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-7 w-64 rounded-lg bg-gray-200" />
        <div className="h-40 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-96 rounded-xl bg-gray-200" />
          <div className="h-96 rounded-xl bg-gray-200 lg:col-span-2" />
        </div>
      </div>
    );
  if (error)
    return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!patient)
    return <div className="text-center py-8">Pasien tidak ditemukan.</div>;

  const activeConsultation = displayedConsultations.find(
    (c) => c._id === activeConsultationId
  ) || { files: [] };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title={`Konsultasi Pasien: ${patient.nama}`}
        subtitle={`No. Kartu ${patient.noKartu} â€¢ ${patient.jenisKelamin} â€¢ ${
          patient.tanggalLahir ? `${calculateAge(patient.tanggalLahir)} tahun` : "-"
        }`}
        breadcrumb={[{ label: "Konsultasi Pasien", to: "/consultations" }, { label: patient.nama }]}
      />

      {/* Patient Info Card */}
      <Card className="p-6 no-print">
        <Card.Header
          title="Detail Pasien"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={PencilIcon}
                onClick={openEditPatientModal}
              >
                Edit Data Pasien
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={PrinterIcon}
                onClick={handleGeneratePdf}
                disabled={!patient || loading || totalKonsultasi === 0}
              >
                Cetak Rekam Medis
              </Button>
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="No. Kartu" valueClassName="font-bold text-lg text-primary-600">
            {patient.noKartu}
          </InfoItem>
          <InfoItem label="Nama">{patient.nama}</InfoItem>
          <InfoItem label="Jenis Kelamin">{patient.jenisKelamin}</InfoItem>
          <InfoItem label="Tanggal Lahir">
            {patient.tanggalLahir
              ? format(new Date(patient.tanggalLahir), "dd MMMM yyyy", {
                  locale: id,
                })
              : "-"}
          </InfoItem>
          <InfoItem label="Umur">
            {patient.tanggalLahir ? `${calculateAge(patient.tanggalLahir)} tahun` : "-"}
          </InfoItem>
          <InfoItem label="No. HP">{patient.noHP}</InfoItem>
          <InfoItem label="Alamat">
            {patient.alamat
              ? `${patient.alamat.kelurahan || "-"}, ${
                  patient.alamat.kecamatan || "-"
                }, ${patient.alamat.kabupaten || "-"}, ${
                  patient.alamat.provinsi || "-"
                }`
              : "-"}
          </InfoItem>
          <InfoItem label="Tgl. Daftar">
            {patient.tanggalDaftar
              ? format(new Date(patient.tanggalDaftar), "dd MMMM yyyy, HH:mm", {
                  locale: id,
                })
              : "-"}
          </InfoItem>
          <InfoItem label="Terakhir di Update">
            {patient.terakhirDiUpdate
              ? format(
                  new Date(patient.terakhirDiUpdate),
                  "dd MMMM yyyy, HH:mm",
                  { locale: id }
                )
              : "-"}
          </InfoItem>
        </div>
      </Card>

      {/* Consultations History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="h-fit p-6 no-print lg:sticky lg:top-8 lg:self-start">
          <Card.Header
            title="Riwayat Konsultasi"
            action={
              <span className="text-xs font-medium text-gray-500">
                {totalKonsultasi} total
              </span>
            }
          />
          <Button
            variant="success"
            className="mb-4 w-full"
            icon={DocumentTextIcon}
            onClick={() => resetFormForNewConsultation(patient)}
          >
            Mulai Konsultasi Baru
          </Button>
          {displayedConsultations.length > 0 ? (
            <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {displayedConsultations.map((consultation) => (
                <li key={consultation._id}>
                  <button
                    type="button"
                    onClick={() => handleConsultationSelect(consultation)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors duration-150 ${
                      activeConsultationId === consultation._id
                        ? "border-primary-600 bg-primary-50 text-primary-900 shadow-sm"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary-300 hover:bg-gray-100"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      Konsultasi pada{" "}
                      {format(
                        new Date(consultation.tanggalKonsultasi),
                        "dd MMMM yyyy, HH:mm",
                        { locale: id }
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Oleh: {consultation.petugasKonsultasi}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500">
              Belum ada riwayat konsultasi.
            </p>
          )}
          <div className="mt-4">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </Card>

        {/* SOAP Form */}
        <Card className="h-fit p-6 no-print lg:col-span-2">
          <div className="mb-4 flex flex-col gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {isNewConsultation
                ? "Konsultasi Baru"
                : `Detail Konsultasi #${activeConsultation?._id?.slice(-5)}`}
            </h2>
            <AutoSaveIndicator status={autoSaveStatus} lastSavedAt={lastSavedAt} />
          </div>

          {isNewConsultation && (
            <p className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-800">
              Konsultasi baru perlu disimpan manual sekali dengan tombol Simpan.
              Setelah tersimpan, perubahan akan ter-auto-save otomatis 3 detik
              setelah berhenti mengetik.
            </p>
          )}

          <div className="space-y-4">
            {/* Subjective */}
            <Field label="S (Subjective - Keluhan Pasien)" htmlFor="S" error={formErrors.S}>
              <Textarea
                id="S"
                name="S"
                value={soapForm.S}
                onChange={handleSoapChange}
                rows="3"
                error={Boolean(formErrors.S)}
              />
            </Field>

            {/* Objective */}
            <div>
              <p className="field-label">O (Objective)</p>
              <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Tensi (Sistolik)"
                  htmlFor="tensiSistolikO"
                  error={formErrors["O.tensi.sistolik"]}
                >
                  <Input
                    type="number"
                    id="tensiSistolikO"
                    name="O.tensi.sistolik"
                    value={soapForm.O.tensi.sistolik}
                    onChange={handleSoapChange}
                    error={Boolean(formErrors["O.tensi.sistolik"])}
                    placeholder="mmHg"
                  />
                </Field>
                <Field
                  label="Tensi (Diastolik)"
                  htmlFor="tensiDiastolikO"
                  error={formErrors["O.tensi.diastolik"]}
                >
                  <Input
                    type="number"
                    id="tensiDiastolikO"
                    name="O.tensi.diastolik"
                    value={soapForm.O.tensi.diastolik}
                    onChange={handleSoapChange}
                    error={Boolean(formErrors["O.tensi.diastolik"])}
                    placeholder="mmHg"
                  />
                </Field>
                <Field
                  label="Tinggi Badan (cm)"
                  htmlFor="tinggiBadanO"
                  error={formErrors["O.tinggiBadan"]}
                >
                  <Input
                    type="number"
                    id="tinggiBadanO"
                    name="O.tinggiBadan"
                    value={soapForm.O.tinggiBadan}
                    onChange={handleSoapChange}
                    error={Boolean(formErrors["O.tinggiBadan"])}
                    placeholder="cm"
                  />
                </Field>
                <Field
                  label="Berat Badan (kg)"
                  htmlFor="beratBadanO"
                  error={formErrors["O.beratBadan"]}
                >
                  <Input
                    type="number"
                    id="beratBadanO"
                    name="O.beratBadan"
                    value={soapForm.O.beratBadan}
                    onChange={handleSoapChange}
                    error={Boolean(formErrors["O.beratBadan"])}
                    placeholder="kg"
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field
                  label="Tambahan (Observasi Manual)"
                  htmlFor="tambahanO"
                  error={formErrors["O.tambahan"]}
                >
                  <Textarea
                    id="tambahanO"
                    name="O.tambahan"
                    value={soapForm.O.tambahan}
                    onChange={handleSoapChange}
                    rows="2"
                    error={Boolean(formErrors["O.tambahan"])}
                  />
                </Field>
              </div>
            </div>

            {/* Assessment */}
            <Field label="A (Assessment - Diagnosis Dokter)" htmlFor="A" error={formErrors.A}>
              <Textarea
                id="A"
                name="A"
                value={soapForm.A}
                onChange={handleSoapChange}
                rows="3"
                error={Boolean(formErrors.A)}
              />
            </Field>

            {/* Plan */}
            <Field label="P (Plan - Rencana Tindakan)" htmlFor="P" error={formErrors.P}>
              <Textarea
                id="P"
                name="P"
                value={soapForm.P}
                onChange={handleSoapChange}
                rows="3"
                error={Boolean(formErrors.P)}
              />
            </Field>

            {/* Therapy */}
            <Field
              label="Therapy (Resep Obat, Tindakan Medis)"
              htmlFor="therapy"
              error={formErrors.therapy}
            >
              <Textarea
                id="therapy"
                name="therapy"
                value={therapy}
                onChange={(e) => setTherapy(e.target.value)}
                rows="3"
                error={Boolean(formErrors.therapy)}
              />
            </Field>

            {/* Petugas Konsultasi (dipilih manual, terkunci setelah tersimpan) */}
            <Field
              label="Petugas Konsultasi"
              htmlFor="petugasKonsultasi"
              error={formErrors.petugasKonsultasi}
              hint={
                !isNewConsultation
                  ? "Perubahan petugas hanya berlaku melalui tombol Simpan."
                  : undefined
              }
            >
              <SelectInput
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
                error={Boolean(formErrors.petugasKonsultasi)}
                classNamePrefix="react-select"
                placeholder="Pilih Petugas Konsultasi"
                isClearable
                required={isNewConsultation}
              />
            </Field>

            {/* Tombol Save */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveConsultation}
                loading={loading}
                loadingText="Menyimpan..."
                className="px-6 py-2.5"
              >
                {isNewConsultation ? "Simpan Konsultasi Baru" : "Update Konsultasi"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Patient Modal */}
      <Modal
        open={isEditPatientModalOpen}
        onClose={closeEditPatientModal}
        title="Edit Data Pasien"
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdatePatient();
          }}
          className="space-y-4"
        >
          {/* Nama Pasien */}
          <Field
            label="Nama Lengkap"
            htmlFor="editNama"
            error={editPatientErrors.nama}
          >
            <Input
              type="text"
              id="editNama"
              name="nama"
              value={editPatientForm.nama || ""}
              onChange={handleEditPatientChange}
              error={Boolean(editPatientErrors.nama)}
              required
              pattern="[a-zA-Z\s]+"
              title="Nama hanya boleh mengandung huruf dan spasi"
            />
          </Field>

          {/* Alamat Lengkap */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Provinsi"
              htmlFor="editProvinsi"
              error={editPatientErrors["alamat.provinsi"]}
            >
              <SelectInput
                id="editProvinsi"
                name="alamat.provinsi"
                options={provinces}
                onChange={handleEditPatientSelectChange}
                value={
                  provinces.find(
                    (opt) => opt.label === editPatientForm.alamat?.provinsi
                  ) || null
                }
                error={Boolean(editPatientErrors["alamat.provinsi"])}
                classNamePrefix="react-select"
                placeholder="Pilih Provinsi"
                isClearable
                isDisabled={regionsLoading}
                required
              />
            </Field>
            <Field
              label="Kabupaten/Kota"
              htmlFor="editKabupaten"
              error={editPatientErrors["alamat.kabupaten"]}
            >
              <SelectInput
                id="editKabupaten"
                name="alamat.kabupaten"
                options={regencies}
                onChange={handleEditPatientSelectChange}
                value={
                  regencies.find(
                    (opt) => opt.label === editPatientForm.alamat?.kabupaten
                  ) || null
                }
                error={Boolean(editPatientErrors["alamat.kabupaten"])}
                classNamePrefix="react-select"
                placeholder="Pilih Kabupaten/Kota"
                isClearable
                isDisabled={
                  !editPatientForm.alamat?.provinsi || regionsLoading
                }
                required
              />
            </Field>
            <Field
              label="Kecamatan"
              htmlFor="editKecamatan"
              error={editPatientErrors["alamat.kecamatan"]}
            >
              <SelectInput
                id="editKecamatan"
                name="alamat.kecamatan"
                options={districts}
                onChange={handleEditPatientSelectChange}
                value={
                  districts.find(
                    (opt) => opt.label === editPatientForm.alamat?.kecamatan
                  ) || null
                }
                error={Boolean(editPatientErrors["alamat.kecamatan"])}
                classNamePrefix="react-select"
                placeholder="Pilih Kecamatan"
                isClearable
                isDisabled={
                  !editPatientForm.alamat?.kabupaten || regionsLoading
                }
                required
              />
            </Field>
            <Field
              label="Kelurahan/Desa"
              htmlFor="editKelurahan"
              error={editPatientErrors["alamat.kelurahan"]}
            >
              <SelectInput
                id="editKelurahan"
                name="alamat.kelurahan"
                options={villages}
                onChange={handleEditPatientSelectChange}
                value={
                  villages.find(
                    (opt) => opt.label === editPatientForm.alamat?.kelurahan
                  ) || null
                }
                error={Boolean(editPatientErrors["alamat.kelurahan"])}
                classNamePrefix="react-select"
                placeholder="Pilih Kelurahan/Desa"
                isClearable
                isDisabled={
                  !editPatientForm.alamat?.kecamatan || regionsLoading
                }
                required
              />
            </Field>
          </div>

          {/* Jenis Kelamin & Tanggal Lahir */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Jenis Kelamin"
              htmlFor="editJenisKelamin"
              error={editPatientErrors.jenisKelamin}
            >
              <SelectInput
                id="editJenisKelamin"
                name="jenisKelamin"
                options={jenisKelaminOptions}
                onChange={handleEditPatientSelectChange}
                value={
                  jenisKelaminOptions.find(
                    (opt) => opt.value === editPatientForm.jenisKelamin
                  ) || null
                }
                error={Boolean(editPatientErrors.jenisKelamin)}
                classNamePrefix="react-select"
                placeholder="Pilih Jenis Kelamin"
                isClearable
                required
              />
            </Field>
            <Field
              label="Tanggal Lahir"
              htmlFor="editTanggalLahir"
              error={editPatientErrors.tanggalLahir}
            >
              <Input
                type="date"
                id="editTanggalLahir"
                name="tanggalLahir"
                value={editPatientForm.tanggalLahir || ""}
                onChange={handleEditPatientChange}
                error={Boolean(editPatientErrors.tanggalLahir)}
                required
              />
            </Field>
          </div>

          {/* No. HP */}
          <Field label="No. HP" htmlFor="editNoHP" error={editPatientErrors.noHP}>
            <Input
              type="text"
              id="editNoHP"
              name="noHP"
              value={editPatientForm.noHP || ""}
              onChange={handleEditPatientChange}
              error={Boolean(editPatientErrors.noHP)}
              required
              minLength="10"
              maxLength="15"
              pattern="[0-9]+"
              title="No. HP hanya boleh angka, minimal 10 digit, maksimal 15 digit"
            />
          </Field>

          {/* Tensi, TB, BB */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Tensi (Sistolik)"
              htmlFor="editTensiSistolik"
              error={editPatientErrors["tensi.sistolik"]}
            >
              <Input
                type="number"
                id="editTensiSistolik"
                name="tensi.sistolik"
                value={editPatientForm.tensi?.sistolik || ""}
                onChange={handleEditPatientChange}
                error={Boolean(editPatientErrors["tensi.sistolik"])}
                min="60"
                max="200"
                placeholder="mmHg"
              />
            </Field>
            <Field
              label="Tensi (Diastolik)"
              htmlFor="editTensiDiastolik"
              error={editPatientErrors["tensi.diastolik"]}
            >
              <Input
                type="number"
                id="editTensiDiastolik"
                name="tensi.diastolik"
                value={editPatientForm.tensi?.diastolik || ""}
                onChange={handleEditPatientChange}
                error={Boolean(editPatientErrors["tensi.diastolik"])}
                min="40"
                max="120"
                placeholder="mmHg"
              />
            </Field>
            <Field
              label="Tinggi Badan (cm)"
              htmlFor="editTinggiBadan"
              error={editPatientErrors.tinggiBadan}
            >
              <Input
                type="number"
                id="editTinggiBadan"
                name="tinggiBadan"
                value={editPatientForm.tinggiBadan || ""}
                onChange={handleEditPatientChange}
                error={Boolean(editPatientErrors.tinggiBadan)}
                min="50"
                max="250"
                placeholder="cm"
              />
            </Field>
            <Field
              label="Berat Badan (kg)"
              htmlFor="editBeratBadan"
              error={editPatientErrors.beratBadan}
            >
              <Input
                type="number"
                id="editBeratBadan"
                name="beratBadan"
                value={editPatientForm.beratBadan || ""}
                onChange={handleEditPatientChange}
                error={Boolean(editPatientErrors.beratBadan)}
                min="10"
                max="300"
                placeholder="kg"
              />
            </Field>
          </div>

          {/* Petugas yang Mengedit */}
          <Field label="Petugas yang Mengedit:" htmlFor="petugasEditPasien">
            <SelectInput
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
          </Field>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={closeEditPatientModal}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                editPatientLoading || regionsLoading || !petugasEditPasien
              }
              loading={editPatientLoading || regionsLoading}
              loadingText="Menyimpan..."
            >
              Update Data Pasien
            </Button>
          </div>
        </form>
      </Modal>

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

const InfoItem = ({ label, valueClassName = "", children }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className={`mt-0.5 text-sm text-gray-900 ${valueClassName}`}>{children}</p>
  </div>
);

const AutoSaveIndicator = ({ status, lastSavedAt }) => {
  const toneMap = {
    dirty: "bg-gray-100 text-gray-600 ring-gray-500/10",
    saving: "bg-primary-50 text-primary-700 ring-primary-600/20",
    saved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    error: "bg-red-50 text-red-700 ring-red-600/20",
  };
  if (!toneMap[status]) return null;
  return (
    <span
      className={`badge ring-1 ring-inset ${toneMap[status]}`}
      data-testid={`autosave-${status}`}
    >
      {status === "saving" && (
        <span
          className="h-3 w-3 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"
          aria-hidden="true"
        />
      )}
      {status === "dirty" && "Perubahan belum disimpan..."}
      {status === "saving" && "Menyimpan..."}
      {status === "saved" &&
        `Tersimpan${lastSavedAt ? ` ${format(lastSavedAt, "HH:mm")}` : ""}`}
      {status === "error" && "Auto-save gagal"}
    </span>
  );
};

export default PatientConsultationDetail;