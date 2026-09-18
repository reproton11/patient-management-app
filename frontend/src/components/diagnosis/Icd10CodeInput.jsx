// patient-management-app/frontend/src/components/diagnosis/Icd10CodeInput.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";
import AsyncSelectInput from "../ui/AsyncSelectInput";

// 8 besar diagnosis klinik (hasil analisis histori soap.A) sebagai fallback
// bila GET /icd10/populer gagal diambil
const DEFAULT_QUICK_CODES = [
  "K30",
  "K76.0",
  "I10",
  "K21.9",
  "I25.1",
  "B18.1",
  "K59.0",
  "K29.7",
];

const fetchIcd10 = async (q) => {
  const { data } = await api.get("/icd10/search", { params: { q } });
  return (data.hasil || []).map((item) => ({
    value: item.kode,
    label: `${item.kode} - ${item.nama}`,
    nama: item.nama,
  }));
};

const Icd10CodeInput = ({ onAppend }) => {
  const [loadError, setLoadError] = useState(false);
  const [quickCodes, setQuickCodes] = useState(DEFAULT_QUICK_CODES);

  useEffect(() => {
    api
      .get("/icd10/populer")
      .then(({ data }) => {
        const kode = (data.hasil || []).map((item) => item.kode);
        if (kode.length) setQuickCodes(kode);
      })
      .catch(() => {});
  }, []);

  const loadOptions = async (input) => {
    const q = input.trim();
    if (q.length < 2) return [];
    try {
      const options = await fetchIcd10(q);
      setLoadError(false);
      return options;
    } catch (err) {
      console.error("Gagal memuat katalog ICD-10:", err);
      setLoadError(true);
      return [];
    }
  };

  const appendExact = (options, kode) => {
    const exact = options.find((opt) => opt.value === kode);
    if (exact) {
      onAppend(exact.value, exact.nama);
    } else {
      toast.error(`Kode ${kode} tidak ditemukan di katalog.`);
    }
  };

  const handleQuickCode = async (kode) => {
    try {
      appendExact(await fetchIcd10(kode), kode);
    } catch (err) {
      console.error("Gagal memuat katalog ICD-10:", err);
      toast.error("Gagal memuat katalog ICD-10.");
    }
  };

  return (
    <div>
      <label htmlFor="icd10Code" className="field-label">
        Kode ICD-10
      </label>
      <AsyncSelectInput
        inputId="icd10Code"
        classNamePrefix="react-select"
        placeholder="Ketik kode atau nama penyakit (contoh: K21.9 atau GERD)"
        loadOptions={loadOptions}
        onChange={(option) => option && onAppend(option.value, option.nama)}
        value={null}
        defaultOptions={false}
        cacheOptions
        isClearable
        noOptionsMessage={() =>
          loadError ? "Gagal memuat katalog, coba lagi" : "Kode tidak ditemukan"
        }
      />
      <p className="mt-1.5 text-xs text-gray-500">
        Pilih dari daftar, deskripsi otomatis ditambahkan ke Assessment.
      </p>

      <div className="mt-3">
        <p className="text-xs font-semibold text-gray-600">
          Kode sering digunakan
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {quickCodes.map((kode) => (
            <button
              key={kode}
              type="button"
              onClick={() => handleQuickCode(kode)}
              aria-label={`Tambahkan diagnosis ${kode} ke Assessment`}
              className="inline-flex min-h-[44px] items-center rounded-full bg-primary-50 px-4 text-sm font-semibold text-primary-700 ring-1 ring-inset ring-primary-600/20 transition-colors hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1"
            >
              {kode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Icd10CodeInput;
