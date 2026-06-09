import { usePGlite } from '@electric-sql/pglite-react';

export default function PackCreatePage() {
  const db = usePGlite();

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">إنشاء حزمة جديدة</h1>
      <p className="text-lg">Pack Create Page</p>
      <p className="text-sm opacity-70 mt-4">
        Database: {db ? '✅ Connected' : '❌ Not Connected'}
      </p>
    </div>
  );
}
