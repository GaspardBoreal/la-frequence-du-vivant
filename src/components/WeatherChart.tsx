
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WeatherChartProps {
  data: any;
  theme: any;
}

const WeatherChart: React.FC<WeatherChartProps> = ({ data, theme }) => {
  if (!data?.values) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Aucune donnée météo disponible
      </div>
    );
  }

  // Transform data for the chart
  const chartData = Object.entries(data.values).map(([date, values]: [string, any]) => ({
    date: new Date(date).toLocaleDateString(),
    temperature: values['temperature-max'],
    humidity: values.humidity
  })).slice(0, 20); // Limit to 20 data points

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="temperature" 
            stroke={theme.colors.primary} 
            name="Température (°C)"
          />
          <Line 
            type="monotone" 
            dataKey="humidity" 
            stroke={theme.colors.secondary} 
            name="Humidité (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeatherChart;
