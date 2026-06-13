import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerThunk, clearError } from '../../store/slices/authSlice';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(registerThunk(form));
    if (registerThunk.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-relife-gray px-4">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Leaf className="text-relife-green w-6 h-6" />
          <span className="text-xl font-bold text-relife-navy">Amazon <span className="text-relife-orange">ReLife</span></span>
        </div>

        <h1 className="text-2xl font-bold text-relife-navy text-center mb-6">Create Account</h1>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input id="name" type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-relife-orange focus:border-transparent"
              placeholder="John Doe" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-relife-orange focus:border-transparent"
              placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input id="password" type="password" required minLength={8} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-relife-orange focus:border-transparent"
              placeholder="Min. 8 characters" />
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-2.5">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-relife-orange font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
