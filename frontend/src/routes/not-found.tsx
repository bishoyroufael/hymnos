import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-4xl font-bold mt-4 mb-2">الصفحة غير موجودة</h2>
        <p className="text-xl mb-8">Page Not Found</p>
        <Link to="/" className="btn btn-primary">
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
