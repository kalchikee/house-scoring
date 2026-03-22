import {
  RadarChart as ReRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import useAppStore from '../store/useAppStore';
import { getScoreColor } from '../scoring/composite';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <div className="font-semibold text-slate-200">{item.payload.fullMark ? item.payload.subject : ''}</div>
      <div className="text-indigo-400 font-bold text-lg">{item.value}</div>
      <div className="text-slate-500">/100</div>
    </div>
  );
};

const CustomAxisTick = ({ x, y, payload }) => {
  const icons = {
    Crime: '🛡️',
    Walk: '🚶',
    Property: '🏠',
    'Trader Joe\'s': '🛒',
  };
  const icon = icons[payload.value] || '';

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={11}
        fontWeight={500}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {icon} {payload.value}
      </text>
    </g>
  );
};

export default function RadarChart() {
  const { scores } = useAppStore();

  if (!scores) return null;

  const data = [
    { subject: 'Crime', score: scores.crime, fullMark: 100 },
    { subject: 'Walk', score: scores.walk, fullMark: 100 },
    { subject: "Trader Joe's", score: scores.proximity, fullMark: 100 },
    { subject: 'Property', score: scores.property, fullMark: 100 },
  ];

  // Gradient color based on composite
  const compositeColor = getScoreColor(scores.composite);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">Score Radar</h3>
        <span className="text-xs text-slate-500">All categories /100</span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ReRadar data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <defs>
            <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={compositeColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={compositeColor} stopOpacity={0.05} />
            </radialGradient>
          </defs>
          <PolarGrid
            stroke="rgba(148,163,184,0.1)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={<CustomAxisTick />}
            tickLine={false}
            axisLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#475569', fontSize: 9 }}
            tickCount={5}
            axisLine={false}
            tickLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={compositeColor}
            strokeWidth={2}
            fill="url(#radarFill)"
            dot={{
              fill: compositeColor,
              r: 4,
              strokeWidth: 2,
              stroke: '#0f172a',
            }}
            activeDot={{
              r: 6,
              fill: compositeColor,
              stroke: '#fff',
              strokeWidth: 2,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
        </ReRadar>
      </ResponsiveContainer>

      {/* Score dots legend */}
      <div className="grid grid-cols-4 gap-2 mt-1">
        {data.map((d) => (
          <div key={d.subject} className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
              style={{
                borderColor: getScoreColor(d.score),
                color: getScoreColor(d.score),
                backgroundColor: `${getScoreColor(d.score)}15`,
              }}
            >
              {d.score}
            </div>
            <span className="text-xs text-slate-500 text-center leading-tight">{d.subject.replace("Trader Joe's", "TJ's")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
