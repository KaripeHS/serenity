
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { schedulingService, OptimizationResult } from '../../services/scheduling.service';

interface OptimizationSuggestion {
  id: string;
  type: 'route' | 'time' | 'caregiver' | 'cost';
  title: string;
  description: string;
  impact: string;
  savings: number;
  effort: 'low' | 'medium' | 'high';
}

interface ScheduleOptimizerProps {
  className?: string;
}

export function ScheduleOptimizer({ className = '' }: ScheduleOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [metrics, setMetrics] = useState({ distanceSavings: 0, timeSavings: 0 });

  useEffect(() => {
    // Default to next 7 days
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);

    setStartDate(start.toISOString().slice(0, 10)); // YYYY-MM-DD
    setEndDate(end.toISOString().slice(0, 10));
  }, []);

  const handleOptimize = async () => {
    if (!startDate || !endDate) return;

    setIsOptimizing(true);
    setSuggestions([]);

    try {
      const result: OptimizationResult = await schedulingService.optimizeSchedule(
        new Date(startDate),
        new Date(endDate)
      );

      // Map API result to UI suggestions
      const mappedSuggestions: OptimizationSuggestion[] = result.changes.map((change, index) => ({
        id: change.shiftId || `opt-${index}`,
        type: 'route', // Default to route/mileage optimization for MVP
        title: 'Route Efficiency',
        description: change.reason,
        impact: `${change.efficiencyGain.toFixed(1)} miles reduction`,
        savings: Math.round(change.efficiencyGain * 0.65), // Approx $0.65/mile
        effort: 'low'
      }));

      setSuggestions(mappedSuggestions);
      setMetrics({
        distanceSavings: result.summary.totalDistanceSavings,
        timeSavings: result.summary.totalTimeSavings
      });

    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplySuggestion = (suggestionId: string) => {
    // In real app, call API to apply the shift update
    alert('Optimization applied (simulated)');
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'route': 'bg-blue-100 text-blue-800',
      'time': 'bg-green-100 text-green-800',
      'caregiver': 'bg-purple-100 text-purple-800',
      'cost': 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEffortColor = (effort: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return colors[effort as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const totalSavings = suggestions.reduce((sum, s) => sum + s.savings, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Schedule Optimizer</span>
          <Badge className="bg-green-100 text-green-800">
            ${totalSavings} potential savings
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Optimization Controls */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-blue-900">AI Schedule Analysis</h4>
                <div className="flex space-x-2 mt-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-blue-700 self-center">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={handleOptimize}
                disabled={isOptimizing}
              >
                {isOptimizing ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            </div>

            {isOptimizing && (
              <div className="flex items-center space-x-2 text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">AI analyzing routes and schedules...</span>
              </div>
            )}

            {/* Quick Stats if Analysis Done */}
            {!isOptimizing && metrics.distanceSavings > 0 && (
              <div className="mt-2 text-sm text-blue-800">
                Found {metrics.distanceSavings.toFixed(1)} miles of travel reduction opportunities.
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium">{suggestion.title}</h5>
                      <Badge className={getTypeColor(suggestion.type)}>
                        {suggestion.type}
                      </Badge>
                      <Badge className={getEffortColor(suggestion.effort)}>
                        {suggestion.effort} effort
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {suggestion.description}
                    </p>
                    <div className="text-sm">
                      <span className="font-medium text-green-600">
                        Impact: {suggestion.impact}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${suggestion.savings}
                    </div>
                    <div className="text-xs text-gray-500">est. savings</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplySuggestion(suggestion.id)}
                  >
                    Apply Optimization
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {suggestions.length === 0 && !isOptimizing && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">✅</div>
              <p>Ready to analyze. Select date range and click Run Analysis.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}