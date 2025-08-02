import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ComposedChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Home,
  Building2,
  MapPin,
  Calendar,
  Euro,
  Activity,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface TransactionDataPoint {
  date: string;
  price: number;
  pricePerM2: number;
  surface: number;
  type: string;
  location: string;
}

interface TransactionVisualizationProps {
  transactionData: any;
  coordinates: { latitude: number; longitude: number };
}

const TransactionVisualization: React.FC<TransactionVisualizationProps> = ({ 
  transactionData, 
  coordinates 
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'timeline' | 'analysis'>('overview');
  const [animationPhase, setAnimationPhase] = useState(0);
  const [hoveredData, setHoveredData] = useState<any>(null);

  // Données d'exemple pour la démo (à remplacer par les vraies données LEXICON)
  const mockData = useMemo(() => {
    const basePrice = 250000 + Math.random() * 100000;
    const basePriceM2 = 3000 + Math.random() * 1500;
    
    return Array.from({ length: 12 }, (_, i) => {
      const variation = (Math.sin(i * 0.5) * 0.2 + Math.random() * 0.1 - 0.05);
      return {
        date: new Date(2024, i, 1).toLocaleDateString('fr-FR', { month: 'short' }),
        fullDate: new Date(2024, i, 1),
        price: Math.round(basePrice * (1 + variation)),
        pricePerM2: Math.round(basePriceM2 * (1 + variation * 0.8)),
        surface: Math.round(80 + Math.random() * 60),
        transactions: Math.round(5 + Math.random() * 15),
        type: ['Appartement', 'Maison', 'Terrain'][Math.floor(Math.random() * 3)]
      };
    });
  }, []);

  const typeColors = {
    'Appartement': '#10b981',
    'Maison': '#3b82f6', 
    'Terrain': '#8b5cf6'
  };

  const stats = useMemo(() => {
    const prices = mockData.map(d => d.price);
    const pricesM2 = mockData.map(d => d.pricePerM2);
    const totalTransactions = mockData.reduce((sum, d) => sum + d.transactions, 0);
    
    return {
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      avgPriceM2: Math.round(pricesM2.reduce((a, b) => a + b, 0) / pricesM2.length),
      totalTransactions,
      trend: prices[prices.length - 1] > prices[0] ? 'up' : 'down',
      evolution: (((prices[prices.length - 1] - prices[0]) / prices[0]) * 100).toFixed(1)
    };
  }, [mockData]);

  // Animation séquentielle
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-emerald-200"
        >
          <p className="font-semibold text-emerald-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
              {entry.name.includes('Prix') ? '€' : entry.name.includes('m²') ? ' €/m²' : ''}
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Navigation des vues */}
      <div className="flex gap-2 p-1 bg-emerald-50 rounded-xl">
        {[
          { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { key: 'timeline', label: 'Évolution', icon: TrendingUp },
          { key: 'analysis', label: 'Analyse', icon: Target }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={selectedView === key ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView(key as any)}
            className={`flex-1 gap-2 ${
              selectedView === key 
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white' 
                : 'text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Stats cards avec animations */}
            {[
              {
                title: 'Prix moyen',
                value: `${stats.avgPrice.toLocaleString()}€`,
                icon: Euro,
                color: 'emerald',
                delay: 0
              },
              {
                title: 'Prix au m²',
                value: `${stats.avgPriceM2.toLocaleString()}€`,
                icon: Home,
                color: 'green',
                delay: 0.1
              },
              {
                title: 'Transactions',
                value: stats.totalTransactions.toString(),
                icon: Activity,
                color: 'teal',
                delay: 0.2
              },
              {
                title: 'Évolution',
                value: `${Number(stats.evolution) > 0 ? '+' : ''}${stats.evolution}%`,
                icon: stats.trend === 'up' ? TrendingUp : TrendingDown,
                color: stats.trend === 'up' ? 'emerald' : 'red',
                delay: 0.3
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: stat.delay, type: "spring", stiffness: 200 }}
              >
                <Card className={`border-${stat.color}-200 bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 overflow-hidden relative`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.title}</p>
                        <motion.p 
                          className={`text-2xl font-bold text-${stat.color}-700`}
                          animate={{ scale: animationPhase === index ? 1.1 : 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {stat.value}
                        </motion.p>
                      </div>
                      <motion.div
                        className={`p-3 bg-${stat.color}-200 rounded-full`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <stat.icon className={`h-6 w-6 text-${stat.color}-700`} />
                      </motion.div>
                    </div>
                    
                    {/* Effet de particules */}
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                      <motion.div
                        className={`w-full h-full bg-${stat.color}-400 rounded-full`}
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          delay: stat.delay
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {selectedView === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
              <h3 className="text-lg font-semibold mb-4 text-emerald-800">
                Évolution des prix immobiliers
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockData}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#059669"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="price"
                      stroke="#059669"
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                    />
                    <YAxis 
                      yAxisId="transactions"
                      orientation="right"
                      stroke="#16a34a"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="price"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#priceGradient)"
                      name="Prix moyen"
                    />
                    <Bar
                      yAxisId="transactions"
                      dataKey="transactions"
                      fill="#16a34a"
                      name="Transactions"
                      opacity={0.6}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="pricePerM2"
                      stroke="#059669"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                      name="Prix au m²"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}

        {selectedView === 'analysis' && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Répartition par type */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
              <h3 className="text-lg font-semibold mb-4 text-emerald-800">
                Répartition par type
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Appartements', value: 45, color: '#10b981' },
                        { name: 'Maisons', value: 35, color: '#16a34a' },
                        { name: 'Terrains', value: 20, color: '#059669' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Appartements', value: 45, color: '#10b981' },
                        { name: 'Maisons', value: 35, color: '#16a34a' },
                        { name: 'Terrains', value: 20, color: '#059669' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Indicateurs de performance */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
              <h3 className="text-lg font-semibold mb-4 text-emerald-800">
                Indicateurs de marché
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Liquidité', value: 75, color: '#10b981' },
                  { label: 'Attractivité', value: 68, color: '#16a34a' },
                  { label: 'Potentiel', value: 82, color: '#059669' }
                ].map((indicator, index) => (
                  <motion.div
                    key={indicator.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-emerald-700">
                        {indicator.label}
                      </span>
                      <span className="text-sm text-emerald-600">
                        {indicator.value}%
                      </span>
                    </div>
                    <div className="w-full bg-emerald-100 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: indicator.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${indicator.value}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button 
          className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 px-8 py-3 rounded-full shadow-lg"
          onClick={() => {
            // Ouvrir LEXICON dans un nouvel onglet pour les données complètes
            window.open(`https://lexicon.osfarm.org/tools/parcel-identifier?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`, '_blank');
          }}
        >
          <Zap className="h-5 w-5 mr-2" />
          Accéder aux données complètes
        </Button>
      </motion.div>
    </div>
  );
};

export default TransactionVisualization;