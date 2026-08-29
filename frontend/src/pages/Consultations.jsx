// patient-management-app/frontend/src/pages/Consultations.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";
import { SearchIcon, CalendarIcon } from "@heroicons/react/outline";
import { toast } from "react-toastify";
import { calculateAge, formatDateSafe } from "../utils/helpers";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import DataTable from "../components/ui/DataTable";
import SelectInput from "../components/ui/SelectInput";

const petugasOptions = [
  { value: "", label: "Semua Petugas" },
  ...[
    { value: "Heni", label: "Heni" },
    { value: "Maria", label: "Maria" },
    { value: "Emy", label: "Emy" },
    { value: "Aziz", label: "Aziz" },
  ].sort((a, b) => a.label.localeCompare(b.label, "id")),
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

  const ITEMS_PER_PAGE = 20; // Jumlah item per halaman
  const SEARCH_DEBOUNCE_MS = 400;

  // Debounce pencarian agar tidak request setiap keystroke
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
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
  }, [debouncedSearchTerm, filterDate, filterGender, filterPetugas, sortBy, sortOrder]); // Refetch saat filter berubah

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

  const resetFilters = () => {
    setSearchTerm("");
    setFilterDate("");
    setFilterGender("");
    setFilterPetugas("");
  };

  const openDeleteModal = (patient) => {
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setPatientToDelete(null);
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    setLoading(true);
    try {
      await api.delete(`/pasien/${patientToDelete._id}`);
      toast.success(`Pasien ${patientToDelete.nama} berhasil dihapus.`);
      closeDeleteModal();
      fetchPatients(currentPage); // Refresh list
    } catch (err) {
      console.error("Error deleting patient:", err);
      toast.error(
        err.response?.data?.message ||
          "Gagal menghapus pasien. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && patients.length === 0)
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-7 w-48 rounded-lg bg-gray-200" />
        <div className="flex flex-wrap gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 flex-1 min-w-[150px] rounded-lg bg-gray-200" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-gray-200" />
      </div>
    );
  if (error)
    return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Konsultasi Pasien"
        subtitle="Cari, filter, dan kelola data pasien yang terdaftar"
      />

      {/* Filter dan Pencarian */}
      <Card className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="search" className="field-label">
            Cari Pasien
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              id="search"
              placeholder="Nama, No. Kartu, No. HP..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filterDate" className="field-label">
            Tanggal Daftar
          </label>
          <div className="relative">
            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="date"
              id="filterDate"
              value={filterDate}
              onChange={handleFilterDateChange}
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filterGender" className="field-label">
            Jenis Kelamin
          </label>
          <SelectInput
            id="filterGender"
            options={jenisKelaminOptions}
            onChange={handleFilterGenderChange}
            value={jenisKelaminOptions.find((opt) => opt.value === filterGender)}
            placeholder="Pilih Gender"
            isClearable
            isSearchable={false}
          />
        </div>

        <div>
          <label htmlFor="filterPetugas" className="field-label">
            Petugas Daftar
          </label>
          <SelectInput
            id="filterPetugas"
            options={petugasOptions}
            onChange={handleFilterPetugasChange}
            value={petugasOptions.find((opt) => opt.value === filterPetugas)}
            placeholder="Pilih Petugas"
            isClearable
            isSearchable={false}
          />
        </div>
      </Card>

      {patients && patients.length > 0 ? (
        <DataTable
          columns={[
            { key: "noKartu", label: "No. Kartu", sortable: true, className: "font-semibold text-gray-900" },
            { key: "nama", label: "Nama Pasien", sortable: true },
            {
              key: "tanggalLahir",
              label: "Tgl. Lahir (Umur)",
              sortable: true,
              render: (patient) => (
                <>
                  {patient.tanggalLahir
                    ? format(new Date(patient.tanggalLahir), "dd MMM yyyy", {
                        locale: id,
                      })
                    : "-"}
                  &nbsp;(
                  <span className="font-semibold">
                    {patient.tanggalLahir ? calculateAge(patient.tanggalLahir) : "-"}
                  </span>
                  th)
                </>
              ),
            },
            { key: "noHP", label: "No. HP" },
            {
              key: "tanggalDaftar",
              label: "Tgl. Daftar",
              sortable: true,
              render: (patient) =>
                formatDateSafe(patient.tanggalDaftar, (date) =>
                  format(date, "dd MMMM yyyy, HH:mm", { locale: id })
                ),
            },
            {
              key: "aksi",
              label: "Aksi",
              align: "center",
              className: "font-medium",
              render: (patient) => (
                <>
                  <Link
                    to={`/consultations/${patient._id}`}
                    className="mr-3 text-primary-600 transition-colors hover:text-primary-800"
                  >
                    Lihat Konsultasi
                  </Link>
                  <button
                    onClick={() => openDeleteModal(patient)}
                    className="text-red-600 transition-colors hover:text-red-800"
                  >
                    Hapus
                  </button>
                </>
              ),
            },
          ]}
          rows={patients}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="Tidak ada pasien yang ditemukan."
          emptyHint="Coba ubah kata kunci pencarian atau filter yang aktif."
          onResetFilters={resetFilters}
          footer={
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => fetchPatients(p)}
            />
          }
        />
      ) : (
        <DataTable
          columns={[{ key: "placeholder", label: "Data" }]}
          rows={[]}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="Tidak ada pasien yang ditemukan."
          emptyHint="Coba ubah kata kunci pencarian atau filter yang aktif."
          onResetFilters={resetFilters}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Konfirmasi Penghapusan"
        description="Aksi ini tidak dapat dibatalkan."
      >
        <p className="text-sm text-gray-700">
          Anda yakin ingin menghapus pasien{" "}
          <span className="font-semibold text-gray-900">{patientToDelete?.nama}</span>{" "}
          ({patientToDelete?.noKartu})? Semua riwayat konsultasi pasien ini juga
          akan terhapus.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={closeDeleteModal}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={handleDeletePatient}
            loading={loading}
            loadingText="Menghapus..."
          >
            Hapus Pasien
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
};

export default Consultations;