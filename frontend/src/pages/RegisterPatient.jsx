// patient-management-app/frontend/src/pages/RegisterPatient.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import Select from "react-select";
import { toast } from "react-toastify";
import useIndonesiaRegions from "../hooks/useIndonesiaRegions";
import { toTitleCase } from "../utils/helpers";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Field, { Input } from "../components/ui/Field";

const petugasOptions = [
  { value: "Heni", label: "Heni" },
  { value: "Maria", label: "Maria" },
  { value: "Emy", label: "Emy" },
  { value: "Aziz", label: "Aziz" },
];

const jenisKelaminOptions = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
  { value: "Other", label: "Lainnya" },
];

const selectStyles = (error = false) => ({
  control: (base) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    borderColor: error ? "#ef4444" : "#d1d5db",
    boxShadow: "none",
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    "&:hover": { borderColor: error ? "#ef4444" : "#9ca3af" },
  }),
  menu: (base) => ({ ...base, fontSize: 16 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#eff6ff" : "transparent",
    color: state.isFocused ? "#1d4ed8" : "#374151",
  }),
});

const emptyForm = {
  nama: "",
  alamat: { provinsi: "", kabupaten: "", kecamatan: "", kelurahan: "" },
  jenisKelamin: "",
  tanggalLahir: "",
  noHP: "",
  tensi: { sistolik: "", diastolik: "" },
  tinggiBadan: "",
  beratBadan: "",
  petugasPendaftaran: "",
};

const RegisterPatient = () => {
  const [formData, setFormData] = useState(emptyForm);

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
      // Normalisasi nama ke Title Case sebelum dikirim
      const payload = { ...formData, nama: toTitleCase(formData.nama) };
      const response = await api.post("/pasien", payload);
      toast.success(response.data.message);
      setFormData(emptyForm);
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <PageHeader
        title="Pendaftaran Pasien Baru"
        subtitle="Lengkapi data pasien di bawah ini untuk mendaftarkan pasien"
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Pasien */}
          <Field
            label="Nama Lengkap"
            htmlFor="nama"
            required
            error={errors.nama}
          >
            <Input
              type="text"
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              error={Boolean(errors.nama)}
              required
              maxLength={100}
              pattern="[a-zA-Z\s]+"
              title="Nama hanya boleh mengandung huruf dan spasi"
            />
          </Field>

          {/* Alamat Lengkap */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Alamat Lengkap
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Provinsi"
                htmlFor="provinsi"
                required
                error={errors["alamat.provinsi"]}
              >
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
                  styles={selectStyles(Boolean(errors["alamat.provinsi"]))}
                  classNamePrefix="react-select"
                  placeholder="Pilih Provinsi"
                  isClearable
                  isDisabled={regionsLoading}
                  required
                />
              </Field>
              <Field
                label="Kabupaten/Kota"
                htmlFor="kabupaten"
                required
                error={errors["alamat.kabupaten"]}
              >
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
                  styles={selectStyles(Boolean(errors["alamat.kabupaten"]))}
                  classNamePrefix="react-select"
                  placeholder="Pilih Kabupaten/Kota"
                  isClearable
                  isDisabled={!formData.alamat.provinsi || regionsLoading}
                  required
                />
              </Field>
              <Field
                label="Kecamatan"
                htmlFor="kecamatan"
                required
                error={errors["alamat.kecamatan"]}
              >
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
                  styles={selectStyles(Boolean(errors["alamat.kecamatan"]))}
                  classNamePrefix="react-select"
                  placeholder="Pilih Kecamatan"
                  isClearable
                  isDisabled={!formData.alamat.kabupaten || regionsLoading}
                  required
                />
              </Field>
              <Field
                label="Kelurahan/Desa"
                htmlFor="kelurahan"
                required
                error={errors["alamat.kelurahan"]}
              >
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
                  styles={selectStyles(Boolean(errors["alamat.kelurahan"]))}
                  classNamePrefix="react-select"
                  placeholder="Pilih Kelurahan/Desa"
                  isClearable
                  isDisabled={!formData.alamat.kecamatan || regionsLoading}
                  required
                />
              </Field>
            </div>
          </div>

          {/* Jenis Kelamin & Tanggal Lahir */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Identitas
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Jenis Kelamin"
                htmlFor="jenisKelamin"
                required
                error={errors.jenisKelamin}
              >
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
                  styles={selectStyles(Boolean(errors.jenisKelamin))}
                  classNamePrefix="react-select"
                  placeholder="Pilih Jenis Kelamin"
                  isClearable
                  required
                />
              </Field>
              <Field
                label="Tanggal Lahir"
                htmlFor="tanggalLahir"
                required
                error={errors.tanggalLahir}
              >
                <Input
                  type="date"
                  id="tanggalLahir"
                  name="tanggalLahir"
                  value={formData.tanggalLahir}
                  onChange={handleChange}
                  error={Boolean(errors.tanggalLahir)}
                  required
                />
              </Field>
            </div>
          </div>

          {/* No. HP */}
          <Field label="No. HP" htmlFor="noHP" required error={errors.noHP}>
            <Input
              type="text"
              id="noHP"
              name="noHP"
              value={formData.noHP}
              onChange={handleChange}
              error={Boolean(errors.noHP)}
              required
              minLength="10"
              maxLength="15"
              pattern="[0-9]+"
              title="No. HP hanya boleh angka, minimal 10 digit, maksimal 15 digit"
            />
          </Field>

          {/* Tensi, TB, BB */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Data Antropometri
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Tensi (Sistolik)"
                htmlFor="tensiSistolik"
                error={errors["tensi.sistolik"]}
              >
                <Input
                  type="number"
                  id="tensiSistolik"
                  name="tensi.sistolik"
                  value={formData.tensi.sistolik}
                  onChange={handleChange}
                  error={Boolean(errors["tensi.sistolik"])}
                  min="60"
                  max="200"
                  placeholder="mmHg"
                />
              </Field>
              <Field
                label="Tensi (Diastolik)"
                htmlFor="tensiDiastolik"
                error={errors["tensi.diastolik"]}
              >
                <Input
                  type="number"
                  id="tensiDiastolik"
                  name="tensi.diastolik"
                  value={formData.tensi.diastolik}
                  onChange={handleChange}
                  error={Boolean(errors["tensi.diastolik"])}
                  min="40"
                  max="120"
                  placeholder="mmHg"
                />
              </Field>
              <Field
                label="Tinggi Badan (cm)"
                htmlFor="tinggiBadan"
                error={errors.tinggiBadan}
              >
                <Input
                  type="number"
                  id="tinggiBadan"
                  name="tinggiBadan"
                  value={formData.tinggiBadan}
                  onChange={handleChange}
                  error={Boolean(errors.tinggiBadan)}
                  min="50"
                  max="250"
                  placeholder="cm"
                />
              </Field>
              <Field
                label="Berat Badan (kg)"
                htmlFor="beratBadan"
                error={errors.beratBadan}
              >
                <Input
                  type="number"
                  id="beratBadan"
                  name="beratBadan"
                  value={formData.beratBadan}
                  onChange={handleChange}
                  error={Boolean(errors.beratBadan)}
                  min="10"
                  max="300"
                  placeholder="kg"
                />
              </Field>
            </div>
          </div>

          {/* Petugas Pendaftaran */}
          <Field
            label="Petugas Pendaftaran"
            htmlFor="petugasPendaftaran"
            required
            error={errors.petugasPendaftaran}
          >
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
              styles={selectStyles(Boolean(errors.petugasPendaftaran))}
              classNamePrefix="react-select"
              placeholder="Pilih Petugas"
              isClearable
              required
            />
          </Field>

          {/* Tombol Submit */}
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <Button
              type="submit"
              className="px-6 py-2.5"
              loading={loading || regionsLoading}
              loadingText="Menyimpan..."
            >
              Daftarkan Pasien
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default RegisterPatient;