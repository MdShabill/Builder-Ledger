import { useState } from "react";

interface Item {
  id: number;
  name: string;
}

interface Props {
  label: string;
  items: Item[];
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
}

const CheckboxDropdown = ({
  label,
  items,
  selectedIds,
  setSelectedIds,
}: Props) => {
  const [open, setOpen] = useState(false);

  const toggleItem = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="position-relative mb-3">
      <button
        type="button"
        className="btn btn-secondary w-100 text-start"
        onClick={() => setOpen(!open)}
      >
        {label} ▼
      </button>

      {open && (
        <div
          className="border bg-white p-2"
          style={{
            position: "absolute",
            width: "100%",
            zIndex: 1000,
            maxHeight: "180px",
            overflowY: "auto",
          }}
        >
          {items.map((item) => (
            <div key={item.id} className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleItem(item.id)}
              />

              <label className="form-check-label">{item.name}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckboxDropdown;
