export default function Card({ children, className = '', padding = 'md' }) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div className={`bg-card rounded-xl border border-border shadow-sm ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
