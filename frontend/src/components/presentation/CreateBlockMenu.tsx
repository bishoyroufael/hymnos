import { BlockType } from "../../db/models";

interface BlockTypeOption {
  type: BlockType;
  label: string;
  icon: string;
}

interface CreateBlockMenuProps {
  onSelectBlockType: (blockType: BlockType) => void;
}

const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  {
    type: BlockType.h1,
    label: "عنوان رئيسي",
    icon: "H1",
  },
  {
    type: BlockType.h2,
    label: "عنوان فرعي",
    icon: "H2",
  },
  {
    type: BlockType.h3,
    label: "عنوان صغير",
    icon: "H3",
  },
  {
    type: BlockType.paragraph,
    label: "فقرة",
    icon: "P",
  },
];

export default function CreateBlockMenu({ onSelectBlockType }: CreateBlockMenuProps) {
  return (
    <ul className="menu bg-base-100 rounded-box shadow-lg w-56">
      <li className="menu-title">اختر نوع الكتلة</li>
      {BLOCK_TYPE_OPTIONS.map((option) => (
        <li key={option.type}>
          <button onClick={() => onSelectBlockType(option.type)} className="flex items-center gap-2">
            <span className="badge badge-primary">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
