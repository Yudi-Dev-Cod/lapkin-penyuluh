import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';

interface ActivityPieChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#D4AF37', '#800000', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626'];

export default function ActivityPieChart({ data }: ActivityPieChartProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">
        Jenis Kegiatan
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                fontSize: '13px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
