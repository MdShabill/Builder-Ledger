import { useState } from "react";

interface Option {
  id: number;
  name: string;
}

interface Props {
  label: string;
  options: Option[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

const MultiSelectDropdown = ({
  label,
  options,
  selectedIds,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  // selected names show
  const selectedNames = options
    .filter((o) => selectedIds.includes(o.id))
    .map((o) => o.name)
    .join(", ");

  return (
    <div className="position-relative">
      <button
        type="button"
        className="btn btn-outline-secondary w-100 text-start"
        onClick={() => setOpen(!open)}
      >
        {selectedNames || label}
      </button>

      {open && (
        <div
          className="border bg-white shadow p-2 position-absolute w-100"
          style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
        >
          {options.map((o) => (
            <div key={o.id} className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={selectedIds.includes(o.id)}
                onChange={() => toggle(o.id)}
                id={`${label}-${o.id}`}
              />

              <label className="form-check-label" htmlFor={`${label}-${o.id}`}>
                {o.name}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
