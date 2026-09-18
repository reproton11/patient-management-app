import { components } from "react-select";
import { ChevronDownIcon } from "@heroicons/react/outline";

const SelectDropdownIndicator = (props) => {
  const Indicator = components.DropdownIndicator;
  return (
    <Indicator {...props}>
      <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
    </Indicator>
  );
};

export default SelectDropdownIndicator;
