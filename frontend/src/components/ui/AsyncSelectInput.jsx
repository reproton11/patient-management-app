// patient-management-app/frontend/src/components/ui/AsyncSelectInput.jsx
import AsyncSelect from "react-select/async";
import { buildStyles } from "./selectStyles";
import SelectDropdownIndicator from "./SelectDropdownIndicator";

// Versi async dari SelectInput: opsi diambil per ketikan lewat loadOptions.
const AsyncSelectInput = ({ error = false, ...props }) => (
  <AsyncSelect
    styles={buildStyles(error)}
    components={{ DropdownIndicator: SelectDropdownIndicator }}
    menuPortalTarget={document.body}
    menuPosition="fixed"
    menuShouldScrollIntoView={false}
    noOptionsMessage={() => "Tidak ada hasil"}
    loadingMessage={() => "Memuat..."}
    {...props}
  />
);

export default AsyncSelectInput;
