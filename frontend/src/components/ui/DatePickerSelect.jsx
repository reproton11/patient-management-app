// patient-management-app/frontend/src/components/ui/DatePickerSelect.jsx
// Port komponen Select dari Cnippet UI (ui.cnippet.dev — MIT), bagian dari
// kalender "v-calendar-5" (21st.dev). Dibangun di atas Base UI.
// Diadaptasi: JSX polos + token desain Klinik AZ (Tailwind 3, aksen cyan).

import { Select as SelectPrimitive } from "@base-ui/react/select";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SelectorIcon,
} from "@heroicons/react/outline";

const Select = ({ children, ...props }) => (
  <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>
);

const SelectTrigger = ({ className = "", children, ...props }) => (
  <SelectPrimitive.Trigger
    className={`relative inline-flex h-8 w-full select-none items-center justify-between gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-left text-sm font-medium text-gray-700 shadow-sm outline-none transition-colors hover:border-gray-300 focus-visible:border-primary-500 focus-visible:ring-[3px] focus-visible:ring-primary-500/20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon>
      <SelectorIcon
        className="h-4 w-4 shrink-0 text-gray-400"
        aria-hidden="true"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

const SelectValue = ({ className = "", ...props }) => (
  <SelectPrimitive.Value
    className={`min-w-0 flex-1 truncate ${className}`}
    {...props}
  />
);

const SelectPopup = ({ className = "", children, ...props }) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Positioner
      align="start"
      alignItemWithTrigger
      className="z-[70] select-none"
      side="bottom"
      sideOffset={4}
    >
      <SelectPrimitive.Popup className="text-gray-800 outline-none" {...props}>
        <SelectPrimitive.ScrollUpArrow className="top-0 z-[1] flex h-6 w-full cursor-default items-center justify-center">
          <ChevronUpIcon className="relative h-4 w-4" aria-hidden="true" />
        </SelectPrimitive.ScrollUpArrow>
        <div className="relative min-w-[var(--anchor-width,8rem)] rounded-xl border border-gray-200 bg-white p-1 shadow-[0_8px_24px_-6px_rgb(16_24_40/0.14),0_0_0_1px_rgb(16_24_40/0.04)]">
          <SelectPrimitive.List
            className={`max-h-[min(var(--available-height,280px),280px)] overflow-y-auto p-1 ${className}`}
          >
            {children}
          </SelectPrimitive.List>
        </div>
        <SelectPrimitive.ScrollDownArrow className="bottom-0 z-[1] flex h-6 w-full cursor-default items-center justify-center">
          <ChevronDownIcon className="relative h-4 w-4" aria-hidden="true" />
        </SelectPrimitive.ScrollDownArrow>
      </SelectPrimitive.Popup>
    </SelectPrimitive.Positioner>
  </SelectPrimitive.Portal>
);

const SelectItem = ({ className = "", children, ...props }) => (
  <SelectPrimitive.Item
    className={`grid min-h-8 cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-1 ps-2 pe-4 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-800 ${className}`}
    {...props}
  >
    <SelectPrimitive.ItemIndicator className="col-start-1 text-primary-600">
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
      </svg>
    </SelectPrimitive.ItemIndicator>
    <SelectPrimitive.ItemText className="col-start-2 min-w-0">
      {children}
    </SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);

export { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue };
