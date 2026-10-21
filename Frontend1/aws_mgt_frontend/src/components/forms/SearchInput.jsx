import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 border border-border rounded-lg text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100" aria-label="Clear search">
          <X className="w-4 h-4 text-secondary-text" />
        </button>
      )}
    </div>
  );
}
