// patient-management-app/frontend/src/components/ui/Pagination.jsx
import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/outline";

const pageNumbers = (current, total) => {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  sorted.forEach((p) => {
    if (p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  });
  return result;
};

const Pagination = ({ page, totalPages, onPageChange, totalItems = null }) => {
  if (totalPages <= 1) return null;

  const baseBtn =
    "relative inline-flex items-center px-3.5 py-2 text-sm font-medium transition-colors";
  const navBtn = `${baseBtn} border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`;
  const pageBtn = (active) =>
    `${baseBtn} border ${
      active
        ? "z-10 border-primary-600 bg-primary-600 text-white"
        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {totalItems !== null ? (
        <p className="text-sm text-gray-500">
          Menampilkan {totalItems > 0 ? (page - 1) * 20 + 1 : 0}–{Math.min(page * 20, totalItems)}{" "}
          dari {totalItems.toLocaleString("id-ID")} data
        </p>
      ) : (
        <span />
      )}
      <nav className="inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Paginasi">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${navBtn} rounded-l-lg`}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {pageNumbers(page, totalPages).map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`e-${i}`}
              className={`${baseBtn} border border-gray-300 bg-white text-gray-400`}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={pageBtn(p === page)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${navBtn} rounded-r-lg`}
          aria-label="Halaman berikutnya"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;