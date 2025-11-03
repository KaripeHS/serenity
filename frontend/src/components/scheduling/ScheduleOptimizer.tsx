import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

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
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([
    {
      id: '1',
      type: 'route',
      title: 'Optimize Westerville Route',
      description: 'Reorganize 3 visits in Westerville to reduce travel time by 25 minutes',
      impact: '25min saved, $18 fuel cost reduction',
      savings: 18,
      effort: 'low'
    },
    {
      id: '2',
      type: 'caregiver',
      title: 'Caregiver Skill Match',
      description: 'Assign Maria Rodriguez to specialized wound care visits - better match',
      impact: 'Improved patient outcomes, reduced visit time',
      savings: 45,
      effort: 'medium'
    },
    {
      id: '3',
      type: 'time',
      title: 'Peak Hours Optimization',
      description: 'Move 2 non-urgent visits from peak to off-peak hours',
      impact: 'Reduced overtime costs, better coverage',
      savings: 120,
      effort: 'low'
    }
  ]);

  const handleOptimize = async () => {
    setIsOptimizing(true);

    // Simulate AI optimization
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Add new suggestions
    const newSuggestion: OptimizationSuggestion = {
      id: '4',
      type: 'cost',
      title: 'Equipment Efficiency',
      description: 'Consolidate medical supply deliveries to reduce duplicate trips',
      impact: 'Reduced supply costs and travel time',
      savings: 75,
      effort: 'medium'
    };

    setSuggestions(prev => [newSuggestion, ...prev]);
    setIsOptimizing(false);
  };

  const handleApplySuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    // In real app, this would apply the optimization
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
            ${totalSavings}/day potential
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
                <p className="text-sm text-blue-700">
                  Analyzing 127 visits across 22 Ohio cities
                </p>
              </div>
              <Button
                onClick={handleOptimize}
                disabled={isOptimizing}
              >
                {isOptimizing ? 'Analyzing...' : 'Run Optimization'}
              </Button>
            </div>

            {isOptimizing && (
              <div className="flex items-center space-x-2 text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">AI analyzing routes and schedules...</span>
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
                    <div className="text-xs text-gray-500">daily savings</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplySuggestion(suggestion.id)}
                  >
                    Apply
                  </Button>
                  <Button variant="outline" size="sm">
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {suggestions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">✅</div>
              <p>All optimizations applied! Run analysis again to find new opportunities.</p>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2">Current Performance</h5>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Efficiency</div>
                <div className="font-bold">87.3%</div>
              </div>
              <div>
                <div className="text-gray-600">Avg Travel Time</div>
                <div className="font-bold">18.5 min</div>
              </div>
              <div>
                <div className="text-gray-600">Cost per Visit</div>
                <div className="font-bold">$85.50</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}