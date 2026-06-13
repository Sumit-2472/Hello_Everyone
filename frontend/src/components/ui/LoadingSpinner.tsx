interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" role="status" aria-label="Loading">
      <div className={`${sizes[size]} border-4 border-relife-green border-t-transparent rounded-full animate-spin`} />
      {message && <p className="text-sm text-gray-500 animate-pulse">{message}</p>}
    </div>
  );
}
