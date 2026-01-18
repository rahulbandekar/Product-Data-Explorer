import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );
}