import { AlertCircle } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-error" />
      </div>
      <h3 className="text-lg font-medium text-primary-text mb-1">Error</h3>
      <p className="text-sm text-secondary-text mb-4 max-w-sm">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try Again</Button>}
    </div>
  );
}
