// patient-management-app/frontend/src/pages/RegisterPatient.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import Select from "react-select";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useIndonesiaRegions from "../hooks/useIndonesiaRegions"; // IMPORT HOOK BARU

// Petugas Pendaftaran
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

const jenisKelaminOptions = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
  { value: "Other", label: "Lainnya" },
];

const RegisterPatient = () => {
  const [formData, setFormData] = useState({
    nama: "",
    alamat: { provinsi: "", kabupaten: "", kecamatan: "", kelurahan: "" },
    jenisKelamin: "",
    tanggalLahir: "",
    noHP: "",
    tensi: { sistolik: "", diastolik: "" },
    tinggiBadan: "",
    beratBadan: "",
    petugasPendaftaran: "",
  });

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
  } = useIndonesiaRegions(); // GUNAKAN HOOK

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Trigger fetching regencies when province changes
  useEffect(() => {
    // Cari ID provinsi dari label yang tersimpan di formData
    const selectedProvince = provinces.find(
      (p) => p.label === formData.alamat.provinsi
    );
    if (selectedProvince) {
      fetchRegencies(selectedProvince.value); // Gunakan ID (value) untuk memanggil API
    } else {
      fetchRegencies(""); // Reset jika tidak ada provinsi terpilih
    }
  }, [formData.alamat.provinsi, fetchRegencies, provinces]); // Tambahkan provinces ke dependensi

  // Trigger fetching districts when regency changes
  useEffect(() => {
    const selectedRegency = regencies.find(
      (r) => r.label === formData.alamat.kabupaten
    );
    if (selectedRegency) {
      fetchDistricts(selectedRegency.value);
    } else {
      fetchDistricts("");
    }
  }, [formData.alamat.kabupaten, fetchDistricts, regencies]); // Tambahkan regencies ke dependensi

  // Trigger fetching villages when district changes
  useEffect(() => {
    const selectedDistrict = districts.find(
      (d) => d.label === formData.alamat.kecamatan
    );
    if (selectedDistrict) {
      fetchVillages(selectedDistrict.value);
    } else {
      fetchVillages("");
    }
  }, [formData.alamat.kecamatan, fetchVillages, districts]); // Tambahkan districts ke dependensi

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("alamat.")) {
      const alamatField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        alamat: { ...prev.alamat, [alamatField]: value },
      }));
    } else if (name.startsWith("tensi.")) {
      const tensiField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        tensi: {
          ...prev.tensi,
          [tensiField]: value === "" ? "" : Number(value),
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (selectedOption, { name }) => {
    if (name.startsWith("alamat.")) {
      const alamatField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        alamat: {
          ...prev.alamat,
          [alamatField]: selectedOption ? selectedOption.label : "",
        }, // TETAP SIMPAN LABEL KE formData
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: selectedOption ? selectedOption.value : "",
      }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await api.post("/pasien", formData);
      toast.success(response.data.message);
      setFormData({
        nama: "",
        alamat: { provinsi: "", kabupaten: "", kecamatan: "", kelurahan: "" },
        jenisKelamin: "",
        tanggalLahir: "",
        noHP: "",
        tensi: { sistolik: "", diastolik: "" },
        tinggiBadan: "",
        beratBadan: "",
        petugasPendaftaran: "",
      });
      // Reset hooks regions
      fetchRegencies("");
      fetchDistricts("");
      fetchVillages("");
    } catch (err) {
      console.error("Error mendaftarkan pasien:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        const apiErrors = {};
        err.response.data.errors.forEach((error) => {
          apiErrors[error.field] = error.message;
        });
        setErrors(apiErrors);
        toast.error("Validasi gagal. Mohon periksa kembali input Anda.");
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Terjadi kesalahan saat mendaftarkan pasien.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">
        Pendaftaran Pasien Baru
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nama Pasien */}
        <div>
          <label
            htmlFor="nama"
            className="block text-sm font-medium text-gray-700"
          >
            Nama Lengkap
          </label>
          <input
            type="text"
            id="nama"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.nama ? "border-red-500" : "border-gray-300"
            }`}
            required
            maxLength={100}
            pattern="[a-zA-Z\s]+"
            title="Nama hanya boleh mengandung huruf dan spasi"
          />
          {errors.nama && (
            <p className="mt-1 text-sm text-red-500">{errors.nama}</p>
          )}
        </div>

        {/* Alamat Lengkap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="provinsi"
              className="block text-sm font-medium text-gray-700"
            >
              Provinsi
            </label>
            <Select
              id="provinsi"
              name="alamat.provinsi"
              options={provinces}
              onChange={handleSelectChange}
              value={
                provinces.find(
                  (opt) => opt.label === formData.alamat.provinsi
                ) || null
              }
              className={`mt-1 block w-full ${
                errors["alamat.provinsi"] ? "border-red-500" : ""
              }`}
              classNamePrefix="react-select"
              placeholder="Pilih Provinsi"
              isClearable
              isDisabled={regionsLoading}
              required
            />
            {errors["alamat.provinsi"] && (
              <p className="mt-1 text-sm text-red-500">
                {errors["alamat.provinsi"]}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="kabupaten"
              className="block text-sm font-medium text-gray-700"
            >
              Kabupaten/Kota
            </label>
            <Select
              id="kabupaten"
              name="alamat.kabupaten"
              options={regencies}
              onChange={handleSelectChange}
              value={
                regencies.find(
                  (opt) => opt.label === formData.alamat.kabupaten
                ) || null
              }
              className={`mt-1 block w-full ${
                errors["alamat.kabupaten"] ? "border-red-500" : ""
              }`}
              classNamePrefix="react-select"
              placeholder="Pilih Kabupaten/Kota"
              isClearable
              isDisabled={!formData.alamat.provinsi || regionsLoading}
              required
            />
            {errors["alamat.kabupaten"] && (
              <p className="mt-1 text-sm text-red-500">
                {errors["alamat.kabupaten"]}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="kecamatan"
              className="block text-sm font-medium text-gray-700"
            >
              Kecamatan
            </label>
            <Select
              id="kecamatan"
              name="alamat.kecamatan"
              options={districts}
              onChange={handleSelectChange}
              value={
                districts.find(
                  (opt) => opt.label === formData.alamat.kecamatan
                ) || null
              }
              className={`mt-1 block w-full ${
                errors["alamat.kecamatan"] ? "border-red-500" : ""
              }`}
              classNamePrefix="react-select"
              placeholder="Pilih Kecamatan"
              isClearable
              isDisabled={!formData.alamat.kabupaten || regionsLoading}
              required
            />
            {errors["alamat.kecamatan"] && (
              <p className="mt-1 text-sm text-red-500">
                {errors["alamat.kecamatan"]}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="kelurahan"
              className="block text-sm font-medium text-gray-700"
            >
              Kelurahan/Desa
            </label>
            <Select
              id="kelurahan"
              name="alamat.kelurahan"
              options={villages}
              onChange={handleSelectChange}
              value={
                villages.find(
                  (opt) => opt.label === formData.alamat.kelurahan
                ) || null
              }
              className={`mt-1 block w-full ${
                errors["alamat.kelurahan"] ? "border-red-500" : ""
              }`}
              classNamePrefix="react-select"
              placeholder="Pilih Kelurahan/Desa"
              isClearable
              isDisabled={!formData.alamat.kecamatan || regionsLoading}
              required
            />
            {errors["alamat.kelurahan"] && (
              <p className="mt-1 text-sm text-red-500">
                {errors["alamat.kelurahan"]}
              </p>
            )}
          </div>
        </div>

        {/* Jenis Kelamin & Umur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="jenisKelamin"
              className="block text-sm font-medium text-gray-700"
            >
              Jenis Kelamin
            </label>
            <Select
              id="jenisKelamin"
              name="jenisKelamin"
              options={jenisKelaminOptions}
              onChange={handleSelectChange}
              value={
                jenisKelaminOptions.find(
                  (opt) => opt.value === formData.jenisKelamin
                ) || null
              }
              className={`mt-1 block w-full ${
                errors.jenisKelamin ? "border-red-500" : ""
              }`}
              classNamePrefix="react-select"
              placeholder="Pilih Jenis Kelamin"
              isClearable
              required
            />
            {errors.jenisKelamin && (
              <p className="mt-1 text-sm text-red-500">{errors.jenisKelamin}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="tanggalLahir"
              className="block text-sm font-medium text-gray-700"
            >
              Tanggal Lahir
            </label>
            <input
              type="date"
              id="tanggalLahir"
              name="tanggalLahir"
              value={formData.tanggalLahir}
              onChange={handleChange}
              className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.tanggalLahir ? "border-red-500" : "border-gray-300"
              }`}
              min="0"
              max="150"
              required
            />
            {errors.tanggalLahir && (
              <p className="mt-1 text-sm text-red-500">{errors.tanggalLahir}</p>
            )}
          </div>
        </div>

        {/* No. HP */}
        <div>
          <label
            htmlFor="noHP"
            className="block text-sm font-medium text-gray-700"
          >
            No. HP
          </label>
          <input
            type="text"
            id="noHP"
            name="noHP"
            value={formData.noHP}
            onChange={handleChange}
            className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.noHP ? "border-red-500" : "border-gray-300"
            }`}
            required
            minLength="10"
            maxLength="15"
            pattern="[0-9]+"
            title="No. HP hanya boleh angka, minimal 10 digit, maksimal 15 digit"
          />
          {errors.noHP && (
            <p className="mt-1 text-sm text-red-500">{errors.noHP}</p>
          )}
        </div>

        {/* Tensi, TB, BB */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="tensiSistolik"
              className="block text-sm font-medium text-gray-700"
            >
              Tensi (Sistolik)
            </label>
            <input
              type="number"
              id="tensiSistolik"
              name="tensi.sistolik"
              value={formData.tensi.sistolik}
              onChange={handleChange}
              className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors["tensi.sistolik"] ? "border-red-500" : "border-gray-300"
              }`}
              min="60"
              max="200"
              placeholder="mmHg"
            />
            {errors["tensi.sistolik"] && (
              <p className="mt-1 text-sm text-red-500">
                {errors["tensi.sistolik"]}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="tensiDiastolik"
              className="block text-sm font-medium text-gray-700"
            >
              Tensi (Diastolik)
            </label>
            <input
              type="number"
              id="tensiDiastolik"
              name="tensi.diastolik"
              value={formData.tensi.diastolik}
              onChange={handleChange}
              className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors["tensi.diastolik"] ? "border-red-500" : "border-gray-300"
              }`}
              min="40"
              max="120"
              placeholder="mmHg"
            />
            {errors["tensi.diastolik"] && (
              <p className="mt-1 text-sm text-red-500">
                {errors["tensi.diastolik"]}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="tinggiBadan"
              className="block text-sm font-medium text-gray-700"
            >
              Tinggi Badan (cm)
            </label>
            <input
              type="number"
              id="tinggiBadan"
              name="tinggiBadan"
              value={formData.tinggiBadan}
              onChange={handleChange}
              className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.tinggiBadan ? "border-red-500" : "border-gray-300"
              }`}
              min="50"
              max="250"
              placeholder="cm"
            />
            {errors.tinggiBadan && (
              <p className="mt-1 text-sm text-red-500">{errors.tinggiBadan}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="beratBadan"
              className="block text-sm font-medium text-gray-700"
            >
              Berat Badan (kg)
            </label>
            <input
              type="number"
              id="beratBadan"
              name="beratBadan"
              value={formData.beratBadan}
              onChange={handleChange}
              className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.beratBadan ? "border-red-500" : "border-gray-300"
              }`}
              min="10"
              max="300"
              placeholder="kg"
            />
            {errors.beratBadan && (
              <p className="mt-1 text-sm text-red-500">{errors.beratBadan}</p>
            )}
          </div>
        </div>

        {/* Petugas Pendaftaran */}
        <div>
          <label
            htmlFor="petugasPendaftaran"
            className="block text-sm font-medium text-gray-700"
          >
            Petugas Pendaftaran
          </label>
          <Select
            id="petugasPendaftaran"
            name="petugasPendaftaran"
            options={petugasOptions}
            onChange={handleSelectChange}
            value={
              petugasOptions.find(
                (opt) => opt.value === formData.petugasPendaftaran
              ) || null
            }
            className={`mt-1 block w-full ${
              errors.petugasPendaftaran ? "border-red-500" : ""
            }`}
            classNamePrefix="react-select"
            placeholder="Pilih Petugas"
            isClearable
            required
          />
          {errors.petugasPendaftaran && (
            <p className="mt-1 text-sm text-red-500">
              {errors.petugasPendaftaran}
            </p>
          )}
        </div>

        {/* Tombol Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
            disabled={loading || regionsLoading}
          >
            {loading || regionsLoading ? "Menyimpan..." : "Daftarkan Pasien"}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default RegisterPatient;
