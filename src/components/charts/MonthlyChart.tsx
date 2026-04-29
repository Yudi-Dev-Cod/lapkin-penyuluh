import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';

interface MonthlyChartProps {
  data: { month: string; count: number }[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">
        Kegiatan Per Bulan
      </h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                fontSize: '13px',
              }}
            />
            <Bar dataKey="count" name="Kegiatan" fill="#800000" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
