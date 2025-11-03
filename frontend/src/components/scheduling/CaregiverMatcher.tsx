import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectOption } from '../ui/Select';

interface Caregiver {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: string;
  location: string;
  matchScore: number;
  certifications: string[];
}

interface Patient {
  id: string;
  name: string;
  requiredSkills: string[];
  location: string;
  serviceType: string;
  scheduledTime: string;
}

interface CaregiverMatcherProps {
  className?: string;
}

export function CaregiverMatcher({ className = '' }: CaregiverMatcherProps) {
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [matches, setMatches] = useState<Caregiver[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const patients: Patient[] = [
    {
      id: '1',
      name: 'Eleanor Johnson',
      requiredSkills: ['Personal Care', 'Medication Management', 'Wound Care'],
      location: 'Columbus, OH',
      serviceType: 'Personal Care',
      scheduledTime: '09:00 AM'
    },
    {
      id: '2',
      name: 'Robert Smith',
      requiredSkills: ['Physical Therapy', 'Mobility Training'],
      location: 'Dublin, OH',
      serviceType: 'Physical Therapy',
      scheduledTime: '11:30 AM'
    },
    {
      id: '3',
      name: 'Mary Williams',
      requiredSkills: ['Medication Management', 'Vital Signs'],
      location: 'Westerville, OH',
      serviceType: 'Medication Management',
      scheduledTime: '02:00 PM'
    }
  ];

  const caregivers: Caregiver[] = [
    {
      id: '1',
      name: 'Maria Rodriguez',
      role: 'Senior Caregiver',
      skills: ['Personal Care', 'Medication Management', 'Wound Care', 'Companionship'],
      availability: 'Available',
      location: 'Columbus, OH',
      matchScore: 95,
      certifications: ['CNA', 'CPR', 'First Aid']
    },
    {
      id: '2',
      name: 'David Chen',
      role: 'Physical Therapist',
      skills: ['Physical Therapy', 'Mobility Training', 'Pain Management'],
      availability: 'Available 12:00 PM',
      location: 'Dublin, OH',
      matchScore: 92,
      certifications: ['PT', 'CPR', 'Manual Therapy']
    },
    {
      id: '3',
      name: 'Lisa Rodriguez',
      role: 'Home Health Aide',
      skills: ['Personal Care', 'Companionship', 'Light Housekeeping'],
      availability: 'Available',
      location: 'Columbus, OH',
      matchScore: 78,
      certifications: ['HHA', 'CPR']
    },
    {
      id: '4',
      name: 'Jennifer Miller',
      role: 'Registered Nurse',
      skills: ['Medication Management', 'Vital Signs', 'Wound Care', 'IV Therapy'],
      availability: 'Available 1:00 PM',
      location: 'Westerville, OH',
      matchScore: 88,
      certifications: ['RN', 'CPR', 'BLS']
    }
  ];

  const handleFindMatches = async () => {
    if (!selectedPatient) return;

    setIsMatching(true);

    // Simulate AI matching
    await new Promise(resolve => setTimeout(resolve, 2000));

    const patient = patients.find(p => p.id === selectedPatient);
    if (!patient) return;

    // Filter and score caregivers based on patient requirements
    const filteredMatches = caregivers
      .map(caregiver => {
        let score = 0;

        // Skill matching
        const skillMatches = patient.requiredSkills.filter(skill =>
          caregiver.skills.includes(skill)
        ).length;
        score += (skillMatches / patient.requiredSkills.length) * 40;

        // Location proximity (simplified)
        if (caregiver.location === patient.location) {
          score += 30;
        } else {
          score += 15; // nearby areas
        }

        // Availability
        if (caregiver.availability === 'Available') {
          score += 20;
        } else {
          score += 10;
        }

        // Experience/role bonus
        if (caregiver.role.includes('Senior') || caregiver.role.includes('Registered')) {
          score += 10;
        }

        return { ...caregiver, matchScore: Math.round(score) };
      })
      .filter(caregiver => caregiver.matchScore >= 50)
      .sort((a, b) => b.matchScore - a.matchScore);

    setMatches(filteredMatches);
    setIsMatching(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleAssignCaregiver = (caregiverId: string) => {
    const caregiver = matches.find(c => c.id === caregiverId);
    const patient = patients.find(p => p.id === selectedPatient);

    if (caregiver && patient) {
      alert(`Assigned ${caregiver.name} to ${patient.name}`);
      // In real app, this would make the assignment
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>AI Caregiver Matcher</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Patient
            </label>
            <div className="flex space-x-2">
              <Select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="flex-1"
              >
                <SelectOption value="">Choose a patient...</SelectOption>
                {patients.map((patient) => (
                  <SelectOption key={patient.id} value={patient.id}>
                    {patient.name} - {patient.serviceType} at {patient.scheduledTime}
                  </SelectOption>
                ))}
              </Select>
              <Button
                onClick={handleFindMatches}
                disabled={!selectedPatient || isMatching}
              >
                {isMatching ? 'Matching...' : 'Find Matches'}
              </Button>
            </div>
          </div>

          {/* Patient Requirements */}
          {selectedPatient && (
            <div className="bg-blue-50 p-4 rounded-lg">
              {(() => {
                const patient = patients.find(p => p.id === selectedPatient);
                return patient ? (
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">
                      Patient Requirements
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                      <div>
                        <span className="font-medium">Location:</span> {patient.location}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {patient.scheduledTime}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-blue-800">Required Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patient.requiredSkills.map((skill) => (
                          <Badge key={skill} className="bg-blue-100 text-blue-800">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Matching Progress */}
          {isMatching && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-yellow-800">AI analyzing caregiver matches...</span>
              </div>
            </div>
          )}

          {/* Matches */}
          {matches.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Best Matches ({matches.length})</h4>
              {matches.map((caregiver) => (
                <div key={caregiver.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium">{caregiver.name}</h5>
                        <Badge className={getScoreColor(caregiver.matchScore)}>
                          {caregiver.matchScore}% Match
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {caregiver.role} • {caregiver.location}
                      </p>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Availability:</span> {caregiver.availability}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {caregiver.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {caregiver.certifications.map((cert) => (
                          <Badge key={cert} className="bg-green-100 text-green-800 text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAssignCaregiver(caregiver.id)}
                    >
                      Assign
                    </Button>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                    <Button variant="outline" size="sm">
                      Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {matches.length === 0 && selectedPatient && !isMatching && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">🔍</div>
              <p>Click "Find Matches" to see available caregivers</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}