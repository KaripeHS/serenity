import { useMemo } from 'react';
import { Card } from './Card';

export type ChartType = 'line' | 'bar' | 'area';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartProps {
  type?: ChartType;
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  width?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  showValues?: boolean;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
}

export function Chart({
  type = 'line',
  data,
  title,
  height = 200,
  width = 400,
  showGrid = true,
  showAxes = true,
  showValues = false,
  color = '#3b82f6',
  gradientFrom = '#3b82f6',
  gradientTo = '#60a5fa',
  className = ''
}: ChartProps) {
  const { maxValue, minValue, normalizedData } = useMemo(() => {
    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    return {
      maxValue: max,
      minValue: min,
      normalizedData: data.map(d => ({
        ...d,
        normalizedValue: ((d.value - min) / range)
      }))
    };
  }, [data]);

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xStep = chartWidth / (data.length - 1 || 1);
  const barWidth = chartWidth / data.length * 0.7;

  // Generate line path
  const linePath = useMemo(() => {
    if (data.length === 0) return '';

    return normalizedData.map((d, i) => {
      const x = padding.left + (i * xStep);
      const y = padding.top + chartHeight - (d.normalizedValue * chartHeight);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [normalizedData, xStep, chartHeight, padding]);

  // Generate area path
  const areaPath = useMemo(() => {
    if (data.length === 0) return '';

    const topPath = normalizedData.map((d, i) => {
      const x = padding.left + (i * xStep);
      const y = padding.top + chartHeight - (d.normalizedValue * chartHeight);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const bottomPath = `L ${padding.left + (data.length - 1) * xStep} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

    return topPath + ' ' + bottomPath;
  }, [normalizedData, xStep, chartHeight, padding, data.length]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const gridCount = 5;

    for (let i = 0; i <= gridCount; i++) {
      const y = padding.top + (chartHeight / gridCount) * i;
      lines.push(
        <line
          key={`grid-${i}`}
          x1={padding.left}
          y1={y}
          x2={padding.left + chartWidth}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      );
    }

    return lines;
  }, [chartHeight, chartWidth, padding]);

  // Y-axis labels
  const yAxisLabels = useMemo(() => {
    const labels = [];
    const gridCount = 5;

    for (let i = 0; i <= gridCount; i++) {
      const value = minValue + ((maxValue - minValue) / gridCount) * (gridCount - i);
      const y = padding.top + (chartHeight / gridCount) * i;

      labels.push(
        <text
          key={`y-label-${i}`}
          x={padding.left - 10}
          y={y + 4}
          textAnchor="end"
          fontSize="12"
          fill="#6b7280"
        >
          {Math.round(value)}
        </text>
      );
    }

    return labels;
  }, [minValue, maxValue, chartHeight, padding]);

  return (
    <Card className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} stopOpacity="0.8" />
            <stop offset="100%" stopColor={gradientTo} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {showGrid && gridLines}

        {/* Y-axis */}
        {showAxes && (
          <>
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="#9ca3af"
              strokeWidth="2"
            />
            {yAxisLabels}
          </>
        )}

        {/* X-axis */}
        {showAxes && (
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="#9ca3af"
            strokeWidth="2"
          />
        )}

        {/* Chart content */}
        {type === 'bar' && normalizedData.map((d, i) => {
          const x = padding.left + (i * chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
          const barHeight = d.normalizedValue * chartHeight;
          const y = padding.top + chartHeight - barHeight;

          return (
            <g key={`bar-${i}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={d.color || color}
                rx="4"
                className="transition-all hover:opacity-80 cursor-pointer"
              />
              {showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#374151"
                >
                  {d.value}
                </text>
              )}
            </g>
          );
        })}

        {type === 'area' && (
          <>
            <path
              d={areaPath}
              fill="url(#chartGradient)"
              className="transition-all"
            />
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all"
            />
          </>
        )}

        {type === 'line' && (
          <>
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all"
            />
            {normalizedData.map((d, i) => {
              const x = padding.left + (i * xStep);
              const y = padding.top + chartHeight - (d.normalizedValue * chartHeight);

              return (
                <circle
                  key={`point-${i}`}
                  cx={x}
                  cy={y}
                  r="5"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all hover:r-7 cursor-pointer"
                />
              );
            })}
          </>
        )}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const x = type === 'bar'
            ? padding.left + (i * chartWidth / data.length) + (chartWidth / data.length) / 2
            : padding.left + (i * xStep);

          return (
            <text
              key={`x-label-${i}`}
              x={x}
              y={padding.top + chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </Card>
  );
}

// Compact sparkline for inline trends
export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  showDots = false,
  className = ''
}: SparklineProps) {
  const { normalizedData, max, min } = useMemo(() => {
    const values = data;
    const maximum = Math.max(...values);
    const minimum = Math.min(...values);
    const range = maximum - minimum || 1;

    return {
      normalizedData: values.map(v => (v - minimum) / range),
      max: maximum,
      min: minimum
    };
  }, [data]);

  const xStep = width / (data.length - 1 || 1);

  const path = useMemo(() => {
    if (data.length === 0) return '';

    return normalizedData.map((v, i) => {
      const x = i * xStep;
      const y = height - (v * height);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [normalizedData, xStep, height, data.length]);

  const trend = data[data.length - 1] > data[0] ? 'up' : 'down';
  const trendColor = trend === 'up' ? '#10b981' : '#ef4444';

  return (
    <div className={`inline-block ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showDots && normalizedData.map((v, i) => (
          <circle
            key={`dot-${i}`}
            cx={i * xStep}
            cy={height - (v * height)}
            r="2"
            fill={color}
          />
        ))}
      </svg>
    </div>
  );
}
