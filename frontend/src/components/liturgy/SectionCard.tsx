import { FiTrash2, FiPlus } from "react-icons/fi";
import SubsectionCard, { type SubsectionForm } from "./SubsectionCard";

export interface SectionForm {
  id: string;
  name: string;
  description: string;
  position: number;
  subsections: SubsectionForm[];
  isExpanded: boolean;
}

interface SectionCardProps {
  section: SectionForm;
  onUpdate: (id: string, updates: Partial<SectionForm>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onAddSubsection: (sectionId: string) => void;
  onUpdateSubsection: (sectionId: string, subsectionId: string, updates: Partial<SubsectionForm>) => void;
  onRemoveSubsection: (sectionId: string, subsectionId: string) => void;
}

export default function SectionCard({ section, onUpdate, onRemove, onToggle, onAddSubsection, onUpdateSubsection, onRemoveSubsection }: SectionCardProps) {
  return (
    <div className="collapse collapse-arrow bg-base-200 shadow-lg">
      <input type="checkbox" checked={section.isExpanded} onChange={() => onToggle(section.id)} />
      <div className="collapse-title min-h-0 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">{section.name || "(بدون اسم)"}</h3>
          <button
            type="button"
            className="btn btn-error btn-sm btn-circle z-50"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(section.id);
            }}
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="collapse-content">
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">اسم الفصل *</span>
            </label>
            <input
              type="text"
              placeholder="مثال: صلاة الساعة الأولى"
              className="input input-bordered input-sm w-full lg:w-2/3"
              value={section.name}
              onChange={(e) => onUpdate(section.id, { name: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">الوصف</span>
            </label>
            <textarea
              placeholder="وصف الفصل (اختياري)"
              className="textarea textarea-bordered textarea-sm h-20 w-full lg:w-2/3"
              value={section.description}
              onChange={(e) => onUpdate(section.id, { description: e.target.value })}
            />
          </div>

          <div className="divider">الأقسام</div>

          <div className="flex flex-col gap-2">
            {section.subsections.map((subsection, subIndex) => (
              <SubsectionCard
                key={subsection.id}
                subsection={subsection}
                index={subIndex}
                onUpdate={(id, updates) => onUpdateSubsection(section.id, id, updates)}
                onRemove={(id) => onRemoveSubsection(section.id, id)}
              />
            ))}

            <button type="button" className="btn btn-outline btn-sm w-full gap-2" onClick={() => onAddSubsection(section.id)}>
              <FiPlus className="w-4 h-4" />
              إضافة قسم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
