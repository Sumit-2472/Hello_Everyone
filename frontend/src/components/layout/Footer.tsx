import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-relife-navy text-gray-400 py-8 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="text-relife-green w-5 h-5" />
          <span className="text-white font-semibold">Amazon ReLife</span>
        </div>
        <p className="text-sm">AI-Powered Circular Commerce Ecosystem</p>
        <p className="text-xs mt-1">Prevent. Process. Reuse. 🌱</p>
      </div>
    </footer>
  );
}
