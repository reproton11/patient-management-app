// patient-management-app/frontend/src/pages/Consultations.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";
import { SearchIcon, CalendarIcon, UserIcon } from "@heroicons/react/outline";
import Select from "react-select"; // Untuk dropdown filter
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react"; // Untuk modal konfirmasi hapus

// Fungsi untuk menghitung umur dari tanggal lahir
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

const petugasOptions = [
  { value: "", label: "Semua Petugas" },
  { value: "Arif", label: "Arif" },
  { value: "Rani", label: "Rani" },
  { value: "Nunung", label: "Nunung" },
  { value: "Heni", label: "Heni" },
  { value: "Maria", label: "Maria" },
  { value: "Emy", label: "Emy" },
  { value: "Fadil", label: "Fadil" },
  { value: "Rayhan", label: "Rayhan" },
];

const jenisKelaminOptions = [
  { value: "", label: "Semua Jenis Kelamin" },
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
];

const Consultations = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterPetugas, setFilterPetugas] = useState("");

  const [sortBy, setSortBy] = useState("createdAt"); // Default sort by createdAt
  const [sortOrder, setSortOrder] = useState("desc"); // Default descending order

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [petugasPenghapus, setPetugasPenghapus] = useState(""); // Siapa yang menghapus

  const ITEMS_PER_PAGE = 10; // Jumlah item per halaman

  const fetchPatients = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        sortBy,
        sortOrder,
      };
      if (searchTerm) params.search = searchTerm;
      if (filterDate) params.tanggalDaftar = filterDate; // Format YYYY-MM-DD
      if (filterGender) params.jenisKelamin = filterGender;
      if (filterPetugas) params.petugasPendaftaran = filterPetugas;

      const res = await api.get("/pasien", { params });
      setPatients(res.data.pasien || []);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.currentPage);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Gagal memuat data pasien. Silakan coba lagi.");
      toast.error("Gagal memuat data pasien.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, filterDate, filterGender, filterPetugas, sortBy, sortOrder]); // Refetch saat filter berubah

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterDateChange = (e) => {
    setFilterDate(e.target.value);
  };

  const handleFilterGenderChange = (selectedOption) => {
    setFilterGender(selectedOption ? selectedOption.value : "");
  };

  const handleFilterPetugasChange = (selectedOption) => {
    setFilterPetugas(selectedOption ? selectedOption.value : "");
  };

  const openDeleteModal = (patient) => {
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setPatientToDelete(null);
    setPetugasPenghapus("");
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete || !petugasPenghapus) {
      toast.error("Nama petugas penghapus wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/pasien/${patientToDelete._id}`, {
        data: { petugasPenghapus },
      });
      toast.success(`Pasien ${patientToDelete.nama} berhasil dihapus.`);
      closeDeleteModal();
      fetchPatients(currentPage); // Refresh list
    } catch (err) {
      console.error("Error deleting patient:", err);
      toast.error(
        "Gagal menghapus pasien. Pastikan tidak ada data terkait atau coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && patients.length === 0)
    return <div className="text-center py-8">Memuat daftar pasien...</div>;
  if (error)
    return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-4">
        Konsultasi Pasien
      </h1>

      {/* Filter dan Pencarian */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-wrap gap-4 items-end mb-8">
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Cari Pasien
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              placeholder="Nama, No. Kartu, No. HP..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label
            htmlFor="filterDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tanggal Daftar
          </label>
          <div className="relative">
            <input
              type="date"
              id="filterDate"
              value={filterDate}
              onChange={handleFilterDateChange}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label
            htmlFor="filterGender"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Jenis Kelamin
          </label>
          <Select
            id="filterGender"
            options={jenisKelaminOptions}
            onChange={handleFilterGenderChange}
            value={jenisKelaminOptions.find(
              (opt) => opt.value === filterGender
            )}
            classNamePrefix="react-select"
            placeholder="Pilih Gender"
            isClearable
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label
            htmlFor="filterPetugas"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Petugas Daftar
          </label>
          <Select
            id="filterPetugas"
            options={petugasOptions}
            onChange={handleFilterPetugasChange}
            value={petugasOptions.find((opt) => opt.value === filterPetugas)}
            classNamePrefix="react-select"
            placeholder="Pilih Petugas"
            isClearable
          />
        </div>

        {/* <button
          onClick={() => fetchPatients(1)} // Muat ulang dengan filter baru
          className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
        >
          <SearchIcon className="h-5 w-5 mr-2" />
          Terapkan Filter
        </button> */}
      </div>

      {patients && patients.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  cursor-pointer"
                  onClick={() => handleSort("noKartu")}
                >
                  No. Kartu
                  {sortBy === "noKartu" && (
                    <span className="ml-2">
                      {sortOrder === "asc" ? " ▲" : " ▼"}
                    </span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  cursor-pointer"
                  onClick={() => handleSort("nama")}
                >
                  Nama Pasien
                  {sortBy === "nama" && (
                    <span className="ml-2">
                      {sortOrder === "asc" ? " ▲" : " ▼"}
                    </span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  cursor-pointer"
                  onClick={() => handleSort("tanggalLahir")}
                >
                  Tgl. Lahir (Umur)
                  {sortBy === "tanggalLahir" && (
                    <span className="ml-2">
                      {sortOrder === "asc" ? " ▲" : " ▼"}
                    </span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  No. HP
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  cursor-pointer"
                  onClick={() => handleSort("tanggalDaftar")}
                >
                  Tgl. Daftar
                  {sortBy === "tanggalDaftar" && (
                    <span className="ml-2">
                      {sortOrder === "asc" ? " ▲" : " ▼"}
                    </span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <motion.tr
                  key={patient._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {patient.noKartu}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {patient.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {patient.tanggalLahir
                      ? format(new Date(patient.tanggalLahir), "dd MMM yyyy", {
                          locale: id,
                        })
                      : "-"}
                    &nbsp;(
                    <span className="font-bold">
                      {patient.tanggalLahir
                        ? calculateAge(patient.tanggalLahir)
                        : "-"}
                    </span>
                    th)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {patient.noHP}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {format(
                      new Date(patient.tanggalDaftar),
                      "dd MMMM yyyy, HH:mm",
                      { locale: id }
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <Link
                      to={`/consultations/${patient._id}`}
                      className="text-blue-600 hover:text-blue-900 mr-3 transition duration-200"
                    >
                      Lihat/Konsultasi
                    </Link>
                    <button
                      onClick={() => openDeleteModal(patient)}
                      className="text-red-600 hover:text-red-900 transition duration-200"
                    >
                      Hapus
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          Tidak ada pasien yang ditemukan.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => fetchPatients(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchPatients(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => fetchPatients(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-red-600 mb-4">
              Konfirmasi Penghapusan
            </Dialog.Title>
            <p className="text-gray-700 mb-4">
              Anda yakin ingin menghapus pasien{" "}
              <span className="font-semibold">{patientToDelete?.nama}</span> (
              {patientToDelete?.noKartu})? Semua riwayat konsultasi pasien ini
              juga akan terhapus. Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="mb-4">
              <label
                htmlFor="petugasPenghapus"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nama Petugas yang Menghapus:
              </label>
              <Select
                id="petugasPenghapus"
                name="petugasPenghapus"
                options={petugasOptions.filter((opt) => opt.value !== "")} // Tanpa opsi "Semua Petugas"
                onChange={(selected) =>
                  setPetugasPenghapus(selected ? selected.value : "")
                }
                value={
                  petugasOptions.find(
                    (opt) => opt.value === petugasPenghapus
                  ) || null
                }
                classNamePrefix="react-select"
                placeholder="Pilih Petugas"
                isClearable
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
              >
                Batal
              </button>
              <button
                onClick={handleDeletePatient}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                disabled={loading || !petugasPenghapus}
              >
                {loading ? "Menghapus..." : "Hapus Pasien"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </motion.div>
  );
};

export default Consultations;
