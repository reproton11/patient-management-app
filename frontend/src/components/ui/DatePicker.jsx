// patient-management-app/frontend/src/components/ui/DatePicker.jsx
// Field tanggal ber-popover: kalender v-calendar-5 (DatePickerCalendar, Base UI)
// dengan trigger bergaya .input. API form-friendly: value/onChange berupa
// string "YYYY-MM-DD" agar drop-in menggantikan <Input type="date" />.

import { useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { CalendarIcon } from "@heroicons/react/outline";
import DatePickerCalendar from "./DatePickerCalendar";

// Parse "YYYY-MM-DD" ke Date lokal — jangan new Date(iso) karena UTC midnight
// dapat bergeser sehari pada zona waktu timur (WITA/WIT).
const parseDateValue = (value) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const DatePicker = ({
  id,
  value,
  onChange,
  error = false,
  placeholder = "Pilih tanggal",
  minDate,
  maxDate,
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const selected = parseDateValue(value);
  const today = new Date();
  const startMonth = minDate ?? new Date(1930, 0, 1);
  const endMonth = maxDate ?? new Date(today.getFullYear() + 10, 11, 1);
  const disabledDays = [
    minDate ? { before: minDate } : null,
    maxDate ? { after: maxDate } : null,
  ].filter(Boolean);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        aria-invalid={error || undefined}
        className={`input flex h-[42px] items-center gap-2 text-left ${error ? "input-error" : ""} ${className}`}
        disabled={disabled}
        id={id}
        type="button"
      >
        <CalendarIcon
          className="h-5 w-5 shrink-0 text-gray-400"
          aria-hidden="true"
        />
        <span
          className={`flex-1 truncate text-sm font-medium ${
            selected ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {selected
            ? format(selected, "d MMMM yyyy", { locale: idLocale })
            : placeholder}
        </span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          align="start"
          className="z-[60]"
          side="bottom"
          sideOffset={6}
        >
          <PopoverPrimitive.Popup className="origin-[var(--transform-origin)] rounded-xl border border-white/70 bg-white/90 text-gray-800 shadow-xl outline-none backdrop-blur-xl transition-[scale,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <DatePickerCalendar
              disabled={disabledDays.length > 0 ? disabledDays : undefined}
              endMonth={endMonth}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, "yyyy-MM-dd"));
                  setOpen(false);
                }
              }}
              selected={selected}
              startMonth={startMonth}
            />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

export default DatePicker;
