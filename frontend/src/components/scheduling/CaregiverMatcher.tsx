
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectOption } from '../ui/Select';
import { schedulingService, CaregiverMatch, SchedulingClient, SchedulingServiceType } from '../../services/scheduling.service';

interface CaregiverMatcherProps {
  className?: string;
}

export function CaregiverMatcher({ className = '' }: CaregiverMatcherProps) {
  const [clients, setClients] = useState<SchedulingClient[]>([]);
  const [services, setServices] = useState<SchedulingServiceType[]>([]);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const [matches, setMatches] = useState<CaregiverMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResources();
    // Set default time to tomorrow 9am-5pm
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setStartTime(tomorrow.toISOString().slice(0, 16));

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(17, 0, 0, 0);
    setEndTime(tomorrowEnd.toISOString().slice(0, 16));
  }, []);

  const loadResources = async () => {
    try {
      const [currClients, currServices] = await Promise.all([
        schedulingService.getClients(),
        schedulingService.getServices()
      ]);
      setClients(currClients);
      setServices(currServices);
    } catch (err) {
      console.error('Failed to load resources', err);
      // Fallback for demo if API fails (e.g. auth issues)
      // setError('Failed to load lists');
    }
  };

  const handleFindMatches = async () => {
    if (!selectedClientId || !selectedServiceId || !startTime || !endTime) {
      setError('Please select client, service, and time range');
      return;
    }

    setError(null);
    setIsMatching(true);

    try {
      const results = await schedulingService.getCaregiverMatches(
        selectedClientId,
        selectedServiceId,
        new Date(startTime),
        new Date(endTime),
        30, // max distance default
        true // continuity default
      );
      setMatches(results);
    } catch (err) {
      console.error('Error finding matches:', err);
      setError('Failed to find matches. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-100 text-green-800';
    if (score >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleAssignCaregiver = (caregiverId: string) => {
    const match = matches.find(c => c.caregiver.id === caregiverId);
    if (match) {
      alert(`Assigned ${match.caregiver.name} to shift`);
      // In real app, call createShift API here
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>AI Caregiver Matcher</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Patient</label>
              <Select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <SelectOption value="">Choose a patient...</SelectOption>
                {clients.map((client) => (
                  <SelectOption key={client.id} value={client.id}>
                    {client.name} - {client.location}
                  </SelectOption>
                ))}
              </Select>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Service</label>
              <Select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <SelectOption value="">Choose a service...</SelectOption>
                {services.map((service) => (
                  <SelectOption key={service.id} value={service.id}>
                    {service.name} ({service.code})
                  </SelectOption>
                ))}
              </Select>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-gray-300 p-2"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-gray-300 p-2"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleFindMatches}
              disabled={!selectedClientId || !selectedServiceId || isMatching}
            >
              {isMatching ? 'Analyzing...' : 'Find Matches'}
            </Button>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}

          {/* Matching Progress */}
          {isMatching && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-yellow-800">AI analyzing caregiver matches...</span>
              </div>
            </div>
          )}

          {/* Matches */}
          {matches.length > 0 && (
            <div className="space-y-3 mt-6">
              <h4 className="font-medium">Best Matches ({matches.length})</h4>
              {matches.map((match) => (
                <div key={match.caregiver.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium">{match.caregiver.name}</h5>
                        <Badge className={getScoreColor(match.score)}>
                          {Math.round(match.score * 100)}% Match
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {match.caregiver.role} • {match.travelDistance.toFixed(1)} miles away
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {match.caregiver.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      {/* Reasons/Warnings */}
                      <div className="space-y-1">
                        {match.reasons.map((r, idx) => (
                          <div key={idx} className="text-xs text-green-700 flex items-center">
                            ✓ {r}
                          </div>
                        ))}
                        {match.warnings.map((w, idx) => (
                          <div key={idx} className="text-xs text-amber-600 flex items-center">
                            ! {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAssignCaregiver(match.caregiver.id)}
                    >
                      Assign
                    </Button>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {matches.length === 0 && !isMatching && selectedClientId && (
            <div className="text-center py-8 text-gray-500">
              {error ? null : <p>Click "Find Matches" to see available caregivers</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}