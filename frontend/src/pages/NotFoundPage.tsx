import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-relife-gray">
      <div className="text-center">
        <p className="text-8xl mb-4">📦</p>
        <h1 className="text-4xl font-bold text-relife-navy mb-2">404</h1>
        <p className="text-gray-600 mb-6">This page has been recycled. Let's find it a new home.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
