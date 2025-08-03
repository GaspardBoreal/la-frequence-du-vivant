import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Leaf, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface NDVITimeSeriesChartProps {
  timeSeries?: {
    dates: string[];
    ndviValues: number[];
    cloudCover: number[];
  };
  selectedDate: string;
  onDateSelect: (date: string) => void;
  className?: string;
}

const NDVITimeSeriesChart: React.FC<NDVITimeSeriesChartProps> = ({
  timeSeries,
  selectedDate,
  onDateSelect,
  className = ""
}) => {
  if (!timeSeries) {
    return (
      <Card className={`p-6 bg-gradient-to-br from-green-50 to-emerald-50 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-green-200 rounded w-1/3"></div>
          <div className="h-40 bg-green-200 rounded"></div>
        </div>
      </Card>
    );
  }

  // Transform data for chart
  const chartData = timeSeries.dates.map((date, index) => ({
    date,
    ndvi: timeSeries.ndviValues[index],
    cloudCover: timeSeries.cloudCover[index],
    formattedDate: new Date(date).toLocaleDateString('fr-FR', { 
      month: 'short' 
    }),
    isSelected: date === selectedDate
  }));

  // Calculate statistics
  const avgNDVI = timeSeries.ndviValues.reduce((a, b) => a + b, 0) / timeSeries.ndviValues.length;
  const maxNDVI = Math.max(...timeSeries.ndviValues);
  const minNDVI = Math.min(...timeSeries.ndviValues);

  const getSeasonalInterpretation = () => {
    const maxIndex = timeSeries.ndviValues.indexOf(maxNDVI);
    const maxMonth = new Date(timeSeries.dates[maxIndex]).getMonth();
    
    if (maxMonth >= 4 && maxMonth <= 7) {
      return "Pic de végétation en été";
    } else if (maxMonth >= 2 && maxMonth <= 4) {
      return "Éveil printanier précoce";
    } else if (maxMonth >= 8 && maxMonth <= 10) {
      return "Végétation automnale persistante";
    }
    return "Cycle végétal atypique";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-green-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-slate-800">
            {new Date(label).toLocaleDateString('fr-FR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
          <p className="text-green-600">
            NDVI: <span className="font-bold">{data.ndvi.toFixed(3)}</span>
          </p>
          <p className="text-blue-600 text-sm">
            Nuages: {data.cloudCover.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          Chronique Végétale 2024
        </h3>
        
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800">
            <Leaf className="h-3 w-3 mr-1" />
            Moy: {avgNDVI.toFixed(3)}
          </Badge>
          <Badge className="bg-emerald-100 text-emerald-800">
            Max: {maxNDVI.toFixed(3)}
          </Badge>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} onClick={(data) => data && onDateSelect(data.activeLabel)}>
            <defs>
              <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
            <XAxis 
              dataKey="formattedDate" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              domain={[0, 1]}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="ndvi"
              stroke="#059669"
              strokeWidth={3}
              fill="url(#ndviGradient)"
              dot={(props) => (
                <motion.circle
                  cx={props.cx}
                  cy={props.cy}
                  r={props.payload?.isSelected ? 6 : 4}
                  fill={props.payload?.isSelected ? "#dc2626" : "#059669"}
                  stroke="white"
                  strokeWidth={2}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.2 }}
                  className="cursor-pointer"
                />
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Seasonal Interpretation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border border-green-200"
      >
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-slate-800 mb-1">Interprétation Saisonnière</h4>
            <p className="text-sm text-slate-600">{getSeasonalInterpretation()}</p>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span>Min: {minNDVI.toFixed(3)}</span>
              <span>Max: {maxNDVI.toFixed(3)}</span>
              <span>Amplitude: {(maxNDVI - minNDVI).toFixed(3)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Card>
  );
};

export default NDVITimeSeriesChart;