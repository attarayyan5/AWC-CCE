import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, trend, trendLabel, className = '' }) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-secondary-text';
  const TrendIcon = trendIcon;

  return (
    <div className={`bg-card rounded-xl border border-border shadow-sm p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-text mb-1">{label}</p>
          <p className="text-2xl font-bold text-primary-text">{value}</p>
          {trendLabel && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-blue-light flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary-blue" />
          </div>
        )}
      </div>
    </div>
  );
}
