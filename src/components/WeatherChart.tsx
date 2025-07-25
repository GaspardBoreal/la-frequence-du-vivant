
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RegionalTheme } from '../utils/regionalThemes';

interface WeatherChartProps {
  data: any;
  theme: RegionalTheme;
}

const WeatherChart: React.FC<WeatherChartProps> = ({ data, theme }) => {
  if (!data.values) return null;

  const chartData = Object.entries(data.values)
    .slice(0, 24) // Show last 24 hours
    .map(([timestamp, values]: [string, any]) => ({
      time: new Date(timestamp).toLocaleString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      temperature: values['temperature-max'],
      humidity: values.humidity
    }))
    .filter(item => item.temperature !== null);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            fontSize={10}
            interval="preserveStartEnd"
          />
          <YAxis fontSize={10} />
          <Tooltip 
            labelFormatter={(label) => `Heure: ${label}`}
            formatter={(value: number, name: string) => [
              name === 'temperature' ? `${value}°C` : `${value}%`,
              name === 'temperature' ? 'Température' : 'Humidité'
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="temperature" 
            stroke={theme.colors.primary}
            strokeWidth={2}
            dot={{ fill: theme.colors.primary, strokeWidth: 2, r: 3 }}
          />
          {chartData.some(item => item.humidity !== null) && (
            <Line 
              type="monotone" 
              dataKey="humidity" 
              stroke={theme.colors.secondary}
              strokeWidth={2}
              dot={{ fill: theme.colors.secondary, strokeWidth: 2, r: 3 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeatherChart;
