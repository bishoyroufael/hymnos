import { FiBook } from "react-icons/fi";

interface BookInfoCardProps {
  bookName: string;
  setBookName: (value: string) => void;
  bookAuthor: string;
  setBookAuthor: (value: string) => void;
  bookDescription: string;
  setBookDescription: (value: string) => void;
  isbn: string;
  setIsbn: (value: string) => void;
}

export default function BookInfoCard({
  bookName,
  setBookName,
  bookAuthor,
  setBookAuthor,
  bookDescription,
  setBookDescription,
  isbn,
  setIsbn,
}: BookInfoCardProps) {
  return (
    <div className="collapse collapse-arrow bg-base-200 shadow-lg">
      <input type="checkbox" defaultChecked />
      <div className="collapse-title text-xl font-bold flex items-center gap-2">
        <FiBook className="w-5 h-5" />
        معلومات الكتاب
      </div>
      <div className="collapse-content">
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">اسم الكتاب *</span>
            </label>
            <input
              type="text"
              placeholder="مثال: الأجبية، الخولاجي"
              className="input input-bordered w-full lg:w-1/2"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">المؤلف</span>
            </label>
            <input
              type="text"
              placeholder="اسم المؤلف (اختياري)"
              className="input input-bordered w-full lg:w-1/2"
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">الوصف</span>
            </label>
            <textarea
              placeholder="وصف مختصر للكتاب (اختياري)"
              className="textarea textarea-bordered h-24 w-full lg:w-1/2"
              value={bookDescription}
              onChange={(e) => setBookDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text">رقم ISBN</span>
            </label>
            <input
              type="text"
              placeholder="978-XXXXXXXXXX (اختياري)"
              className="input input-bordered w-full lg:w-1/2"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
