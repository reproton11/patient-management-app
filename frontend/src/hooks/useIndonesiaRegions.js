// patient-management-app/frontend/src/hooks/useIndonesiaRegions.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const EMSIFA_BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";

const useIndonesiaRegions = () => {
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      console.error("Gagal mengambil data wilayah:", err);
      setError(
        "Gagal memuat data wilayah. Coba periksa koneksi internet Anda."
      );
      toast.error("Gagal memuat data wilayah.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProvinces = useCallback(async () => {
    const data = await fetchData(`${EMSIFA_BASE_URL}/provinces.json`);
    if (data) {
      setProvinces(data.map((item) => ({ value: item.id, label: item.name })));
    } else {
      setProvinces([]);
    }
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
  }, [fetchData]);

  const fetchRegencies = useCallback(
    async (provinceId) => {
      // provinceId HARUS KODE ID
      if (!provinceId) {
        setRegencies([]);
        setDistricts([]);
        setVillages([]);
        return;
      }
      // KOREKSI URL API DI SINI: /regencies/<ID>.json
      const data = await fetchData(
        `${EMSIFA_BASE_URL}/regencies/${provinceId}.json`
      );
      if (data) {
        setRegencies(
          data.map((item) => ({ value: item.id, label: item.name }))
        );
      } else {
        setRegencies([]);
      }
      setDistricts([]);
      setVillages([]);
    },
    [fetchData]
  );

  const fetchDistricts = useCallback(
    async (regencyId) => {
      // regencyId HARUS KODE ID
      if (!regencyId) {
        setDistricts([]);
        setVillages([]);
        return;
      }
      // KOREKSI URL API DI SINI: /districts/<ID>.json
      const data = await fetchData(
        `${EMSIFA_BASE_URL}/districts/${regencyId}.json`
      );
      if (data) {
        setDistricts(
          data.map((item) => ({ value: item.id, label: item.name }))
        );
      } else {
        setDistricts([]);
      }
      setVillages([]);
    },
    [fetchData]
  );

  const fetchVillages = useCallback(
    async (districtId) => {
      // districtId HARUS KODE ID
      if (!districtId) {
        setVillages([]);
        return;
      }
      // KOREKSI URL API DI SINI: /villages/<ID>.json
      const data = await fetchData(
        `${EMSIFA_BASE_URL}/villages/${districtId}.json`
      );
      if (data) {
        setVillages(data.map((item) => ({ value: item.id, label: item.name })));
      } else {
        setVillages([]);
      }
    },
    [fetchData]
  );

  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  return {
    provinces,
    regencies,
    districts,
    villages,
    loading,
    error,
    fetchProvinces,
    fetchRegencies,
    fetchDistricts,
    fetchVillages,
  };
};

export default useIndonesiaRegions;
