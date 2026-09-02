// patient-management-app/frontend/src/components/ui/DatePickerCalendar.jsx
// Port "Calendar with Custom Select Dropdown" (v-calendar-5) oleh cnippet.dev
// (sumber: 21st.dev & ui.cnippet.dev — MIT), dibangun di atas react-day-picker v9.
// Diadaptasi: JSX polos, token desain Klinik AZ (Tailwind 3, aksen cyan),
// locale id-ID, ikon Heroicons v1, dan dropdown bulan/tahun via Base UI
// (DatePickerSelect) agar bisa lompat cepat antar tahun (1930–sekarang).

import { ChevronLeftIcon, ChevronRightIcon, SelectorIcon } from "@heroicons/react/outline";
import { id } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "./DatePickerSelect";

// Dropdown bulan/tahun: react-day-picker mengoper nilai number + onChange
// berupa event ala <select> — dijembatani ke API Base UI Select.
const CalendarDropdown = ({
  options,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}) => {
  const handleValueChange = (newValue) => {
    if (onChange && newValue) {
      onChange({ target: { value: String(newValue) } });
    }
  };

  const items = (options ?? []).map((option) => ({
    disabled: option.disabled,
    label: option.label,
    value: String(option.value),
  }));

  return (
    <Select
      disabled={disabled}
      items={items}
      onValueChange={handleValueChange}
      value={value != null ? String(value) : undefined}
    >
      <SelectTrigger aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem
            disabled={item.disabled}
            key={item.value}
            value={item.value}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
};

const Chevron = ({ className, orientation, ...props }) => {
  if (orientation === "left") {
    return (
      <ChevronLeftIcon className={className} {...props} aria-hidden="true" />
    );
  }
  if (orientation === "right") {
    return (
      <ChevronRightIcon className={className} {...props} aria-hidden="true" />
    );
  }
  return <SelectorIcon className={className} {...props} aria-hidden="true" />;
};

const navButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 outline-none transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:pointer-events-none disabled:opacity-40";

const dayButtonClass =
  "relative flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-gray-700 outline-none transition-colors hover:bg-primary-50 hover:text-primary-800 focus-visible:z-[1] focus-visible:ring-[3px] focus-visible:ring-primary-500/30";

// Atribut state (data-selected/data-today/dll.) dipasang react-day-picker pada
// <td> hari — styling tombolnya dijangkau lewat descendant selector.
const dayClass = [
  "h-9 w-9 p-0 text-sm align-middle",
  "[&[data-outside]>button]:text-gray-400",
  "[&[data-selected]>button]:bg-primary-600",
  "[&[data-selected]>button]:text-white",
  "[&[data-selected]>button]:hover:bg-primary-700",
  "[&[data-selected][data-outside]>button]:text-white",
  "[&[data-today]>button]:after:absolute",
  "[&[data-today]>button]:after:bottom-[5px]",
  "[&[data-today]>button]:after:left-1/2",
  "[&[data-today]>button]:after:-translate-x-1/2",
  "[&[data-today]>button]:after:h-1",
  "[&[data-today]>button]:after:w-1",
  "[&[data-today]>button]:after:rounded-full",
  "[&[data-today]>button]:after:bg-primary-500",
  "[&[data-today]>button]:after:content-['']",
  "[&[data-today][data-selected]>button]:after:bg-white",
  "[&[data-disabled]>button]:pointer-events-none",
  "[&[data-disabled]>button]:text-gray-300",
  "[&[data-disabled]>button]:line-through",
].join(" ");

const calendarClassNames = {
  button_next: navButtonClass,
  button_previous: navButtonClass,
  caption_label: "flex h-full items-center gap-2 text-sm font-medium",
  chevron: "h-4 w-4",
  day: dayClass,
  day_button: dayButtonClass,
  dropdowns:
    "flex w-full items-center justify-center gap-1.5 [&>*]:min-w-0 [&>*]:flex-1",
  footer: "",
  hidden: "invisible",
  month: "w-full",
  month_caption:
    "relative z-[2] mx-9 mb-1 flex h-9 items-center justify-center",
  month_grid: "w-full border-collapse",
  months: "relative flex w-fit flex-col p-3",
  nav: "absolute inset-x-3 top-3 z-[1] flex items-center justify-between",
  outside: "",
  range_end: "",
  range_middle: "",
  range_start: "",
  root: "",
  selected: "",
  today: "",
  week: "",
  week_number: "w-9 p-0 text-xs font-medium text-gray-400",
  weekday: "h-9 w-9 p-0 text-xs font-medium text-gray-500",
  weekdays: "",
};

const DatePickerCalendar = ({
  selected,
  onSelect,
  startMonth,
  endMonth,
  mode = "single",
  disabled,
  ...props
}) => {
  const today = new Date();

  return (
    <DayPicker
      captionLayout="dropdown"
      classNames={calendarClassNames}
      components={{ Chevron, Dropdown: CalendarDropdown }}
      locale={id}
      showOutsideDays
      {...props}
      disabled={disabled}
      endMonth={endMonth ?? new Date(today.getFullYear() + 10, 11, 1)}
      mode={mode}
      onSelect={onSelect}
      selected={selected}
      startMonth={startMonth ?? new Date(1930, 0, 1)}
    />
  );
};

export default DatePickerCalendar;
