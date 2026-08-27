// patient-management-app/frontend/src/components/ui/SelectInput.jsx
import React from "react";
import Select, { components } from "react-select";
import { ChevronDownIcon } from "@heroicons/react/outline";

// Tema penuh react-select sesuai design system Klinik AZ.
// Menu di-portal ke document.body (z-65) agar tidak pernah tertutup
// kartu kaca lain, tabel, maupun modal (z-50).
const buildStyles = (error) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    fontSize: 16,
    borderColor: error ? "#ef4444" : state.isFocused ? "#0891b2" : "#d1d5db",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    boxShadow: state.isFocused
      ? error
        ? "0 0 0 3px rgb(239 68 68 / 0.15)"
        : "0 0 0 3px rgb(8 145 178 / 0.15)"
      : "0 1px 2px 0 rgb(16 24 40 / 0.05)",
    "&:hover": {
      borderColor: error ? "#ef4444" : state.isFocused ? "#0891b2" : "#9ca3af",
    },
  }),
  placeholder: (base) => ({ ...base, color: "#9ca3af" }),
  singleValue: (base) => ({ ...base, color: "#111827" }),
  input: (base) => ({ ...base, color: "#111827", fontSize: 16 }),
  menu: (base) => ({
    ...base,
    zIndex: 65,
    marginTop: 6,
    padding: 4,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgb(229 231 235)",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 8px 24px -6px rgb(16 24 40 / 0.14), 0 0 0 1px rgb(16 24 40 / 0.04)",
  }),
  menuList: (base) => ({ ...base, padding: 0, maxHeight: 280 }),
  option: (base, state) => ({
    ...base,
    cursor: "pointer",
    fontSize: 15,
    borderRadius: 8,
    padding: "8px 10px",
    color:
      state.isSelected || state.isFocused ? "#155e75" : "#374151",
    backgroundColor:
      state.isSelected || state.isFocused ? "#ecfeff" : "transparent",
    "&:active": { backgroundColor: "#cffafe" },
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    padding: 4,
    color: state.isFocused ? "#0891b2" : "#9ca3af",
    transition: "transform 150ms ease, color 150ms ease",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "none",
    "&:hover": { color: "#0891b2" },
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: 4,
    color: "#9ca3af",
    "&:hover": { color: "#ef4444" },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (base) => ({ ...base, zIndex: 65 }),
});

const DropdownIndicator = (props) => {
  const Indicator = components.DropdownIndicator;
  return (
    <Indicator {...props}>
      <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
    </Indicator>
  );
};

const SelectInput = ({ error = false, ...props }) => (
  <Select
    styles={buildStyles(error)}
    components={{ DropdownIndicator }}
    menuPortalTarget={document.body}
    menuPosition="fixed"
    menuShouldScrollIntoView={false}
    noOptionsMessage={() => "Tidak ada hasil"}
    loadingMessage={() => "Memuat..."}
    {...props}
  />
);

export default SelectInput;