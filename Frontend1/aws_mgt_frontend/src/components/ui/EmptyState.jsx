import { Inbox } from 'lucide-react';
import Button from './Button.jsx';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data found', description = '', action, actionLabel = 'Create New' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-secondary-text" />
      </div>
      <h3 className="text-lg font-medium text-primary-text mb-1">{title}</h3>
      {description && <p className="text-sm text-secondary-text mb-4 max-w-sm">{description}</p>}
      {action && <Button onClick={action}>{actionLabel}</Button>}
    </div>
  );
}
