import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import LoadingSkeleton from '../ui/LoadingSkeleton.jsx';
import EmptyState from '../ui/EmptyState.jsx';

export default function DataTable({ columns, data, loading = false, emptyMessage = 'No data found', sortBy, sortOrder, onSort }) {
  if (loading) return <div className="p-4"><LoadingSkeleton rows={8} columns={columns.length} /></div>;
  if (!data || data.length === 0) return <EmptyState title={emptyMessage} />;

  const handleSort = (col) => {
    if (!col.sortable || !onSort) return;
    const newOrder = sortBy === col.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(col.key, newOrder);
  };

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortBy === col.key) return sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
    return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left font-medium text-secondary-text whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-primary-text' : ''}`}
                onClick={() => handleSort(col)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  <SortIcon col={col} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || row.id || i} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-primary-text whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
