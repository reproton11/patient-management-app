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

// Import jspdf dan html2canvas
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import PatientMedicalRecordTemplate from "../components/PatientMedicalRecordTemplate";
import useIndonesiaRegions from "../hooks/useIndonesiaRegions";

const petugasOptions = [
  { value: "Arif", label: "Arif" },
  { value: "Rani", label: "Rani" },
  { value: "Nunung", label: "Nunung" },
  { value: "Heni", label: "Heni" },
  { value: "Maria", label: "Maria" },
  { value: "Emy", label: "Emy" },
  { value: "Fadil", label: "Fadil" },
  { value: "Rayhan", label: "Rayhan" },
];

const PatientConsultationDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [allConsultations, setAllConsultations] = useState([]);
  const [displayedConsultations, setDisplayedConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeConsultationId, setActiveConsultationId] = useState(null);
  const [isNewConsultation, setIsNewConsultation] = useState(false);

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

  // Upload file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [fileUploadLoading, setLoadingFileUpload] = useState(false);
  const [petugasUpload, setPetugasUpload] = useState("");

  // Edit Patient State
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState({});
  const [editPatientErrors, setEditPatientErrors] = useState({});
  const [editPatientLoading, setEditPatientLoading] = useState(false);
  const [petugasEditPasien, setPetugasEditPasien] = useState("");

  // Hook untuk data wilayah
  const {
    provinces,
    regencies,
    districts,
    villages,
    fetchRegencies,
    fetchDistricts,
    fetchVillages,
    loading: regionsLoading,
    error: regionsError,
  } = useIndonesiaRegions();

  // Untuk riwayat kunjungan (pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Ref untuk PDF export
  const componentRef = useRef();

  // state untuk print layout
  const [isPrintLayoutVisible, setIsPrintLayoutVisible] = useState(false);

  // Pindahkan deklarasi fungsi-fungsi ini ke ATAS, sebelum `fetchPatientData`
  const fillFormWithConsultationData = useCallback((consultation) => {
    setSoapForm({
      S: consultation.soap.S || "",
      O: {
        tensi: consultation.soap.O.tensi || { sistolik: "", diastolik: "" },
        tinggiBadan: consultation.soap.O.tinggiBadan || "",
        beratBadan: consultation.soap.O.beratBadan || "",
        tambahan: consultation.soap.O.tambahan || "",
      },
      A: consultation.soap.A || "",
      P: consultation.soap.P || "",
    });
    setTherapy(consultation.therapy || "");
    setPetugasKonsultasi(consultation.petugasKonsultasi || "");
    setFormErrors({});
  }, []);

  const resetFormForNewConsultation = useCallback((patientData) => {
    setSoapForm({
      S: "",
      O: {
        tensi: patientData.tensi || { sistolik: "", diastolik: "" },
        tinggiBadan: patientData.tinggiBadan || "",
        beratBadan: patientData.beratBadan || "",
        tambahan: "Data awal dari pendaftaran",
      },
      A: "",
      P: "",
    });
    setTherapy("");
    setPetugasKonsultasi("");
    setFormErrors({});
    setSelectedFile(null);
    setFileType("");
    setPetugasUpload("");
    setIsNewConsultation(true);
    setActiveConsultationId(null);
  }, []);

  // === Mulai Pemindahan handleGeneratePdf ke sini ===
  const handleGeneratePdf = useCallback(async () => {
    if (!patient || !allConsultations) {
      toast.error("Data pasien belum lengkap untuk dicetak.");
      return;
    }

    setLoading(true); // Tampilkan loading
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

      const element = componentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Peningkatan resolusi untuk kualitas PDF yang lebih baik
        useCORS: true, // Penting jika ada gambar dari domain lain (misal logo)
        logging: true, // Untuk debugging html2canvas
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
  }, [patient, allConsultations]);
  // === Akhir Pemindahan handleGeneratePdf ===

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
        umur: patientData.umur,
        noHP: patientData.noHP,
        tensi: patientData.tensi || { sistolik: "", diastolik: "" },
        tinggiBadan: patientData.tinggiBadan || "",
        beratBadan: patientData.beratBadan || "",
        petugasPendaftaran: patientData.petugasPendaftaran,
      });

      // Fetch ALL consultations for this patient for printing
      const allConsultationsRes = await api.get(
        `/konsultasi/pasien/${patientId}`,
        {
          params: { limit: 9999 },
        }
      );
      setAllConsultations(allConsultationsRes.data.konsultasi);

      // Fetch PAGINATED consultations for UI display
      const paginatedConsultationsRes = await api.get(
        `/konsultasi/pasien/${patientId}`,
        {
          params: { page: currentPage, limit: ITEMS_PER_PAGE },
        }
      );
      setDisplayedConsultations(paginatedConsultationsRes.data.konsultasi);
      setTotalPages(paginatedConsultationsRes.data.totalPages);

      if (paginatedConsultationsRes.data.konsultasi.length > 0) {
        if (!isNewConsultation) {
          setActiveConsultationId(
            paginatedConsultationsRes.data.konsultasi[0]._id
          );
          fillFormWithConsultationData(
            paginatedConsultationsRes.data.konsultasi[0]
          );
          setIsNewConsultation(false);
        }
      } else {
        resetFormForNewConsultation(patientData);
        setIsNewConsultation(true);
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
    setLoading(true);
    setFormErrors({});
    try {
      const dataToSave = {
        pasienId: patientId,
        soap: soapForm,
        therapy,
        petugasKonsultasi,
      };

      let res;
      if (isNewConsultation) {
        res = await api.post("/konsultasi", dataToSave);
        toast.success("Konsultasi baru berhasil ditambahkan!");
      } else {
        res = await api.put(`/konsultasi/${activeConsultationId}`, {
          ...dataToSave,
          petugasUpdate: petugasKonsultasi,
        });
        toast.success("Konsultasi berhasil diupdate!");
      }
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

  // --- File Upload Logic ---
  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setFileType("");
    setPetugasUpload("");
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error("Pilih file PDF untuk diupload.");
      return;
    }
    if (!fileType) {
      toast.error("Pilih jenis file (laboratorium/resep).");
      return;
    }
    if (!petugasUpload) {
      toast.error("Pilih petugas yang mengupload file.");
      return;
    }
    if (!activeConsultationId) {
      toast.error(
        "Pilih konsultasi yang akan diupload filenya atau simpan konsultasi baru terlebih dahulu."
      );
      return;
    }
    if (selectedFile.type !== "application/pdf") {
      toast.error("Hanya file PDF yang diizinkan!");
      return;
    }
    if (selectedFile.size > 2 * 1024 * 1024) {
      // 2MB
      toast.error("Ukuran file maksimal 2MB!");
      return;
    }

    setLoadingFileUpload(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("pasienId", patientId);
    formData.append("tipe", fileType);
    formData.append("petugasUpload", petugasUpload);

    try {
      await api.post(`/upload/${activeConsultationId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("File berhasil diupload!");
      closeUploadModal();
      fetchPatientData();
    } catch (err) {
      console.error("Error uploading file:", err);
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Gagal mengupload file.");
      }
    } finally {
      setLoadingFileUpload(false);
    }
  };

  const openPreviewModal = (fileGridFsId) => {
    const fileUrl = `${api.defaults.baseURL}/upload/file/${fileGridFsId}`;
    setPreviewFileUrl(fileUrl);
    setIsPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewFileUrl("");
  };

  const handleDeleteFile = async (fileGridFsId, fileName) => {
    const petugas = prompt(
      `Anda yakin ingin menghapus file "${fileName}"? Masukkan nama petugas yang menghapus:`
    );
    if (petugas) {
      setLoading(true);
      try {
        await api.delete(
          `/upload/file/${activeConsultationId}/${fileGridFsId}`,
          { data: { petugasPenghapus: petugas } }
        );
        toast.success("File berhasil dihapus!");
        fetchPatientData();
      } catch (err) {
        console.error("Error deleting file:", err);
        toast.error("Gagal menghapus file.");
      } finally {
        setLoading(false);
      }
    } else if (petugas !== null) {
      toast.error("Penghapusan dibatalkan atau nama petugas tidak diisi.");
    }
  };

  // --- Edit Patient Logic ---
  const openEditPatientModal = () => {
    const patientData = patient;
    setEditPatientForm({
      nama: patientData.nama,
      alamat: patientData.alamat,
      jenisKelamin: patientData.jenisKelamin,
      umur: patientData.umur,
      noHP: patientData.noHP,
      tensi: patientData.tensi || { sistolik: "", diastolik: "" },
      tinggiBadan: patientData.tinggiBadan || "",
      beratBadan: patientData.beratBadan || "",
      petugasPendaftaran: patientData.petugasPendaftaran,
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
      toast.error("Nama petugas yang mengedit wajib diisi.");
      return;
    }
    setEditPatientLoading(true);
    setEditPatientErrors({});
    try {
      const dataToUpdate = {
        ...editPatientForm,
        petugasUpdate: petugasEditPasien,
      };
      const res = await api.put(`/pasien/${patientId}`, dataToUpdate);
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
              disabled={
                !patient ||
                loading ||
                !allConsultations ||
                allConsultations.length === 0
              }
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
            <p className="font-medium">Umur:</p>
            <p>{patient.umur} tahun</p>
          </div>
          <div>
            <p className="font-medium">No. HP:</p>
            <p>{patient.noHP}</p>
          </div>
          <div>
            <p className="font-medium">Alamat:</p>
            <p>
              {patient.alamat.kelurahan}, {patient.alamat.kecamatan},{" "}
              {patient.alamat.kabupaten}, {patient.alamat.provinsi}
            </p>
          </div>
          <div>
            <p className="font-medium">Tgl. Daftar:</p>
            <p>
              {format(new Date(patient.tanggalDaftar), "dd MMMM yyyy, HH:mm", {
                locale: id,
              })}
            </p>
          </div>
          <div>
            <p className="font-medium">Terakhir di Update:</p>
            <p>
              {format(
                new Date(patient.terakhirDiUpdate),
                "dd MMMM yyyy, HH:mm",
                { locale: id }
              )}
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
                  Previous
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
                  Next
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">
            {isNewConsultation
              ? "Konsultasi Baru"
              : `Detail Konsultasi #${activeConsultation?._id?.slice(-5)}`}
          </h2>

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

            {/* Petugas Konsultasi */}
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
                required
              />
              {formErrors.petugasKonsultasi && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.petugasKonsultasi}
                </p>
              )}
            </div>

            {/* File Upload Section */}
            <div className="mt-6 border-t pt-4 border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Dokumen Pendukung (PDF)
                </h3>
                <button
                  onClick={openUploadModal}
                  className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                  disabled={!activeConsultationId}
                >
                  <UploadIcon className="h-5 w-5 mr-2" />
                  Upload PDF
                </button>
              </div>
              {activeConsultationId &&
              activeConsultation.files &&
              activeConsultation.files.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeConsultation.files.map((file) => (
                    <li
                      key={file.gridFsId}
                      className="flex items-center p-3 border rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition duration-200"
                    >
                      <DocumentTextIcon className="h-6 w-6 text-blue-500 mr-3" />
                      <span className="flex-1 truncate">
                        {file.namaFile} ({file.tipe})
                      </span>
                      <button
                        onClick={() => openPreviewModal(file.gridFsId)}
                        className="ml-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteFile(file.gridFsId, file.namaFile)
                        }
                        className="ml-3 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">
                  Belum ada dokumen yang diupload untuk konsultasi ini.
                </p>
              )}
            </div>

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

      {/* Upload File Modal */}
      <Dialog
        open={isUploadModalOpen}
        onClose={closeUploadModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Upload Dokumen PDF
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="file-upload"
                  className="block text-sm font-medium text-gray-700"
                >
                  Pilih File (PDF, max 2MB)
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Terpilih: {selectedFile.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="fileType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Jenis File
                </label>
                <Select
                  id="fileType"
                  name="fileType"
                  options={[
                    { value: "laboratorium", label: "Hasil Laboratorium" },
                    { value: "resep", label: "Resep Obat" },
                  ]}
                  onChange={(selected) =>
                    setFileType(selected ? selected.value : "")
                  }
                  value={
                    fileType
                      ? {
                          value: fileType,
                          label:
                            fileType === "laboratorium"
                              ? "Hasil Laboratorium"
                              : "Resep Obat",
                        }
                      : null
                  }
                  className="mt-1 block w-full"
                  classNamePrefix="react-select"
                  placeholder="Pilih Jenis File"
                  isClearable
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="petugasUpload"
                  className="block text-sm font-medium text-gray-700"
                >
                  Petugas Pengunggah
                </label>
                <Select
                  id="petugasUpload"
                  name="petugasUpload"
                  options={petugasOptions}
                  onChange={(selected) =>
                    setPetugasUpload(selected ? selected.value : "")
                  }
                  value={
                    petugasOptions.find((opt) => opt.value === petugasUpload) ||
                    null
                  }
                  className="mt-1 block w-full"
                  classNamePrefix="react-select"
                  placeholder="Pilih Petugas"
                  isClearable
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeUploadModal}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
              >
                Batal
              </button>
              <button
                onClick={handleUploadFile}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                disabled={
                  fileUploadLoading ||
                  !selectedFile ||
                  !fileType ||
                  !petugasUpload
                }
              >
                {fileUploadLoading ? "Mengupload..." : "Upload"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Preview File Modal */}
      <Dialog
        open={isPreviewModalOpen}
        onClose={closePreviewModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-5xl h-[90vh] rounded-lg bg-white p-6 shadow-xl flex flex-col">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
              Preview Dokumen PDF
            </Dialog.Title>
            <div className="flex-grow overflow-hidden flex justify-center items-center bg-gray-100 rounded-md">
              {previewFileUrl ? (
                <iframe
                  src={previewFileUrl}
                  className="w-full h-full border-none"
                  title="PDF Preview"
                ></iframe>
              ) : (
                <p className="text-gray-500">Tidak ada file untuk dipreview.</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closePreviewModal}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
              >
                Tutup
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog
        open={isEditPatientModalOpen}
        onClose={closeEditPatientModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl my-8">
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
                    htmlFor="editUmur"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Umur
                  </label>
                  <input
                    type="number"
                    id="editUmur"
                    name="umur"
                    value={editPatientForm.umur || ""}
                    onChange={handleEditPatientChange}
                    className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      editPatientErrors.umur
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    min="0"
                    max="150"
                    required
                  />
                  {editPatientErrors.umur && (
                    <p className="mt-1 text-sm text-red-500">
                      {editPatientErrors.umur}
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

              {/* Petugas Edit */}
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
                  className={`mt-1 block w-full ${
                    editPatientErrors.petugasEditPasien ? "border-red-500" : ""
                  }`}
                  classNamePrefix="react-select"
                  placeholder="Pilih Petugas"
                  isClearable
                  required
                />
                {editPatientErrors.petugasEditPasien && (
                  <p className="mt-1 text-sm text-red-500">
                    {editPatientErrors.petugasEditPasien}
                  </p>
                )}
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
            consultations={allConsultations}
          />
        </div>
      )}
    </motion.div>
  );
};

export default PatientConsultationDetail;
