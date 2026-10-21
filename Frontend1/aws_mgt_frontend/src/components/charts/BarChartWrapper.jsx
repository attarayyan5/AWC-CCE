import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card.jsx';

export default function BarChartWrapper({ data, dataKey, xAxisKey, title, color = '#2563EB', height = 300, barLabel }) {
  return (
    <Card>
      {title && <h3 className="text-sm font-semibold text-primary-text mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#64748B' }} />
          <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} name={barLabel || dataKey} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
