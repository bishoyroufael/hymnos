import { FiTrash2 } from "react-icons/fi";

export interface SubsectionForm {
  id: string;
  name: string;
  description: string;
  rubric: string;
}

interface SubsectionCardProps {
  subsection: SubsectionForm;
  index: number;
  onUpdate: (id: string, updates: Partial<SubsectionForm>) => void;
  onRemove: (id: string) => void;
}

export default function SubsectionCard({ subsection, index, onUpdate, onRemove }: SubsectionCardProps) {
  return (
    <div className="collapse collapse-arrow bg-base-200 shadow-sm">
      <input type="checkbox" defaultChecked />
      <div className="collapse-title min-h-0 py-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">
            قسم فرعي {index + 1}
            {subsection.name ? `: ${subsection.name}` : ""}
          </h4>
          <button
            type="button"
            className="btn btn-error btn-sm btn-circle absolute left-12 z-50"
            aria-label="حذف القسم الفرعي"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(subsection.id);
            }}
          >
            <FiTrash2 aria-hidden className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="collapse-content">
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="اسم القسم الفرعي *"
              aria-label="اسم القسم الفرعي"
              className="input input-bordered input-sm w-full lg:w-2/3"
              value={subsection.name}
              onChange={(e) => onUpdate(subsection.id, { name: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <textarea
              placeholder="الوصف (اختياري)"
              aria-label="الوصف"
              className="textarea textarea-bordered textarea-sm h-16 w-full lg:w-2/3"
              value={subsection.description}
              onChange={(e) => onUpdate(subsection.id, { description: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <textarea
              placeholder="التعليمات الليتورجية (rubric) - اختياري"
              aria-label="التعليمات الليتورجية"
              className="textarea textarea-bordered textarea-sm h-16 w-full lg:w-2/3"
              value={subsection.rubric}
              onChange={(e) => onUpdate(subsection.id, { rubric: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
