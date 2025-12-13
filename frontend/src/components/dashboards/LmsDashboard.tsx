/**
 * LMS Dashboard - Learning Management System
 * Manages courses, quizzes, learning paths, and certificates
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  Award,
  ClipboardCheck,
  Users,
  Plus,
  Search,
  Filter,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  TrendingUp,
  FileText,
  Settings,
  Eye,
  Edit2,
  Trash2,
  ChevronRight,
  BarChart3,
  Target,
  Medal,
} from 'lucide-react';

// Interfaces
interface DashboardMetrics {
  totalCourses: number;
  activeLearners: number;
  completedAssignments: number;
  overdueAssignments: number;
  learningPaths: number;
  certificatesIssued: number;
  avgQuizScore: number;
  avgCourseRating: number;
}

interface Course {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  moduleCount: number;
  quizCount: number;
  enrollmentCount: number;
  completionRate: number;
  avgRating: number;
  status: 'draft' | 'published' | 'archived';
  isRequired: boolean;
  createdAt: string;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  category: string;
  courseCount: number;
  totalHours: number;
  enrollmentCount: number;
  completionCount: number;
  isSequential: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

interface Certificate {
  id: string;
  certificateNumber: string;
  recipientName: string;
  recipientEmail: string;
  courseName: string;
  learningPathName?: string;
  completionDate: string;
  score?: number;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

interface Quiz {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  questionCount: number;
  passingScore: number;
  timeLimitMinutes?: number;
  avgScore: number;
  passRate: number;
  attemptCount: number;
}

// Mock data
const mockMetrics: DashboardMetrics = {
  totalCourses: 24,
  activeLearners: 156,
  completedAssignments: 892,
  overdueAssignments: 23,
  learningPaths: 8,
  certificatesIssued: 567,
  avgQuizScore: 84.5,
  avgCourseRating: 4.3,
};

const mockCourses: Course[] = [
  {
    id: 'course-1',
    name: 'HIPAA Compliance Training',
    description: 'Comprehensive HIPAA privacy and security training for healthcare workers',
    category: 'Compliance',
    durationMinutes: 120,
    moduleCount: 8,
    quizCount: 2,
    enrollmentCount: 145,
    completionRate: 92,
    avgRating: 4.5,
    status: 'published',
    isRequired: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'course-2',
    name: 'Personal Care Fundamentals',
    description: 'Essential skills for providing personal care services',
    category: 'Clinical Skills',
    durationMinutes: 180,
    moduleCount: 12,
    quizCount: 4,
    enrollmentCount: 132,
    completionRate: 78,
    avgRating: 4.7,
    status: 'published',
    isRequired: true,
    createdAt: '2024-02-01',
  },
  {
    id: 'course-3',
    name: 'Dementia Care Specialist',
    description: 'Advanced training for caring for clients with dementia',
    category: 'Specialty',
    durationMinutes: 240,
    moduleCount: 15,
    quizCount: 3,
    enrollmentCount: 67,
    completionRate: 65,
    avgRating: 4.8,
    status: 'published',
    isRequired: false,
    createdAt: '2024-03-10',
  },
  {
    id: 'course-4',
    name: 'Safety & Fall Prevention',
    description: 'Home safety assessment and fall prevention strategies',
    category: 'Safety',
    durationMinutes: 90,
    moduleCount: 6,
    quizCount: 2,
    enrollmentCount: 98,
    completionRate: 88,
    avgRating: 4.4,
    status: 'published',
    isRequired: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'course-5',
    name: 'Documentation Best Practices',
    description: 'Proper documentation and charting techniques',
    category: 'Administrative',
    durationMinutes: 60,
    moduleCount: 4,
    quizCount: 1,
    enrollmentCount: 112,
    completionRate: 95,
    avgRating: 4.2,
    status: 'draft',
    isRequired: false,
    createdAt: '2024-04-05',
  },
];

const mockLearningPaths: LearningPath[] = [
  {
    id: 'path-1',
    name: 'New Caregiver Onboarding',
    description: 'Complete training track for new caregivers',
    category: 'Onboarding',
    courseCount: 6,
    totalHours: 12,
    enrollmentCount: 45,
    completionCount: 38,
    isSequential: true,
    isFeatured: true,
    isActive: true,
  },
  {
    id: 'path-2',
    name: 'Dementia Care Certification',
    description: 'Advanced certification for dementia care specialists',
    category: 'Certification',
    courseCount: 4,
    totalHours: 16,
    enrollmentCount: 28,
    completionCount: 15,
    isSequential: true,
    isFeatured: true,
    isActive: true,
  },
  {
    id: 'path-3',
    name: 'Annual Compliance Refresh',
    description: 'Yearly compliance training requirements',
    category: 'Compliance',
    courseCount: 3,
    totalHours: 6,
    enrollmentCount: 156,
    completionCount: 142,
    isSequential: false,
    isFeatured: false,
    isActive: true,
  },
];

const mockCertificates: Certificate[] = [
  {
    id: 'cert-1',
    certificateNumber: 'CERT-2024-00567',
    recipientName: 'Maria Garcia',
    recipientEmail: 'maria.garcia@email.com',
    courseName: 'HIPAA Compliance Training',
    completionDate: '2024-11-15',
    score: 95,
    expiresAt: '2025-11-15',
    status: 'active',
  },
  {
    id: 'cert-2',
    certificateNumber: 'CERT-2024-00566',
    recipientName: 'Sarah Johnson',
    recipientEmail: 'sarah.johnson@email.com',
    courseName: 'Dementia Care Specialist',
    learningPathName: 'Dementia Care Certification',
    completionDate: '2024-11-10',
    score: 88,
    status: 'active',
  },
  {
    id: 'cert-3',
    certificateNumber: 'CERT-2024-00565',
    recipientName: 'James Wilson',
    recipientEmail: 'james.wilson@email.com',
    courseName: 'Personal Care Fundamentals',
    completionDate: '2024-11-08',
    score: 92,
    expiresAt: '2024-11-08',
    status: 'expired',
  },
];

const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    courseId: 'course-1',
    courseName: 'HIPAA Compliance Training',
    title: 'HIPAA Privacy Rules Assessment',
    questionCount: 25,
    passingScore: 80,
    timeLimitMinutes: 30,
    avgScore: 86,
    passRate: 92,
    attemptCount: 312,
  },
  {
    id: 'quiz-2',
    courseId: 'course-2',
    courseName: 'Personal Care Fundamentals',
    title: 'Personal Care Skills Test',
    questionCount: 40,
    passingScore: 75,
    timeLimitMinutes: 45,
    avgScore: 82,
    passRate: 88,
    attemptCount: 245,
  },
  {
    id: 'quiz-3',
    courseId: 'course-3',
    courseName: 'Dementia Care Specialist',
    title: 'Dementia Care Final Exam',
    questionCount: 50,
    passingScore: 85,
    timeLimitMinutes: 60,
    avgScore: 79,
    passRate: 72,
    attemptCount: 98,
  },
];

export default function LmsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'paths' | 'quizzes' | 'certificates'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewCourseDialog, setShowNewCourseDialog] = useState(false);
  const [showNewPathDialog, setShowNewPathDialog] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockMetrics);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>(mockLearningPaths);
  const [certificates, setCertificates] = useState<Certificate[]>(mockCertificates);
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories
  const categories = Array.from(new Set(courses.map(c => c.category)));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Management System</h1>
          <p className="text-gray-500">Manage courses, learning paths, and certifications</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewPathDialog(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Target className="w-4 h-4" />
            New Learning Path
          </button>
          <button
            onClick={() => setShowNewCourseDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Course
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold">{metrics.totalCourses}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Learners</p>
              <p className="text-2xl font-bold">{metrics.activeLearners}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Certificates Issued</p>
              <p className="text-2xl font-bold">{metrics.certificatesIssued}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Quiz Score</p>
              <p className="text-2xl font-bold">{metrics.avgQuizScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Completed Assignments</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-600">{metrics.completedAssignments}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Overdue Assignments</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xl font-bold text-red-600">{metrics.overdueAssignments}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Learning Paths</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold">{metrics.learningPaths}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Avg Course Rating</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-xl font-bold">{metrics.avgCourseRating}/5.0</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'courses', label: 'Courses', icon: BookOpen },
            { id: 'paths', label: 'Learning Paths', icon: Target },
            { id: 'quizzes', label: 'Quizzes', icon: ClipboardCheck },
            { id: 'certificates', label: 'Certificates', icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Popular Courses */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Popular Courses</h3>
              <button className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {courses.slice(0, 5).map((course, idx) => (
                <div key={course.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-400 w-5">#{idx + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{course.name}</p>
                    <p className="text-xs text-gray-500">{course.enrollmentCount} enrolled</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-sm">{course.avgRating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Completions */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recent Certificates</h3>
              <button className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {certificates.slice(0, 5).map((cert) => (
                <div key={cert.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <div className="p-2 bg-purple-100 rounded">
                    <Medal className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cert.recipientName}</p>
                    <p className="text-xs text-gray-500">{cert.courseName}</p>
                  </div>
                  <span className="text-xs text-gray-400">{cert.completionDate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz Performance */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Quiz Performance</h3>
              <button className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="p-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium text-sm">{quiz.title}</p>
                    <span className={`text-sm font-medium ${quiz.passRate >= 80 ? 'text-green-600' : quiz.passRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {quiz.passRate}% pass rate
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{quiz.questionCount} questions</span>
                    <span>Avg score: {quiz.avgScore}%</span>
                    <span>{quiz.attemptCount} attempts</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${quiz.passRate >= 80 ? 'bg-green-500' : quiz.passRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${quiz.passRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Paths Progress */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Learning Paths</h3>
              <button className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {learningPaths.map((path) => {
                const completionRate = path.enrollmentCount > 0
                  ? Math.round((path.completionCount / path.enrollmentCount) * 100)
                  : 0;
                return (
                  <div key={path.id} className="p-2">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{path.name}</p>
                        {path.isFeatured && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Featured</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{path.enrollmentCount} enrolled</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{path.courseCount} courses</span>
                      <span>{path.totalHours}h total</span>
                      <span>{path.completionCount} completed</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-2 gap-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{course.name}</h3>
                      {course.isRequired && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">Required</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{course.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(course.status)}`}>
                    {course.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(course.durationMinutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {course.moduleCount} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardCheck className="w-3 h-3" />
                    {course.quizCount} quizzes
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {course.enrollmentCount}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{course.avgRating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{course.completionRate}% completion</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Settings className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'paths' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {learningPaths.map((path) => {
              const completionRate = path.enrollmentCount > 0
                ? Math.round((path.completionCount / path.enrollmentCount) * 100)
                : 0;
              return (
                <div key={path.id} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{path.name}</h3>
                        <span className="text-xs text-gray-500">{path.category}</span>
                      </div>
                    </div>
                    {path.isFeatured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-3">{path.description}</p>

                  <div className="grid grid-cols-3 gap-2 text-center py-3 bg-gray-50 rounded-lg mb-3">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{path.courseCount}</p>
                      <p className="text-xs text-gray-500">Courses</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{path.totalHours}h</p>
                      <p className="text-xs text-gray-500">Duration</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">{path.enrollmentCount}</p>
                      <p className="text-xs text-gray-500">Enrolled</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Completion Rate</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className={`px-2 py-1 text-xs rounded ${path.isSequential ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {path.isSequential ? 'Sequential' : 'Flexible'}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'quizzes' && (
        <div className="bg-white rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quiz</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Course</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Questions</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Time Limit</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Passing Score</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Avg Score</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Pass Rate</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Attempts</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium">{quiz.title}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{quiz.courseName}</td>
                  <td className="px-4 py-3 text-center">{quiz.questionCount}</td>
                  <td className="px-4 py-3 text-center">
                    {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes}min` : 'None'}
                  </td>
                  <td className="px-4 py-3 text-center">{quiz.passingScore}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={quiz.avgScore >= quiz.passingScore ? 'text-green-600' : 'text-red-600'}>
                      {quiz.avgScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      quiz.passRate >= 80 ? 'bg-green-100 text-green-700' :
                      quiz.passRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {quiz.passRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{quiz.attemptCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <BarChart3 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search certificates by name, number, or course..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          {/* Certificates Table */}
          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Certificate #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Recipient</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Course / Path</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Score</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Completion Date</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Expires</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{cert.certificateNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{cert.recipientName}</p>
                        <p className="text-sm text-gray-500">{cert.recipientEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{cert.courseName}</p>
                        {cert.learningPathName && (
                          <p className="text-sm text-blue-600">{cert.learningPathName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cert.score ? `${cert.score}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{cert.completionDate}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      {cert.expiresAt || 'Never'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(cert.status)}`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 hover:bg-gray-100 rounded" title="View">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded" title="Download">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </button>
                        {cert.status === 'active' && (
                          <button className="p-1.5 hover:bg-gray-100 rounded" title="Revoke">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Course Dialog */}
      {showNewCourseDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Create New Course</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course Name</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Enter course name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Enter course description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option>Compliance</option>
                    <option>Clinical Skills</option>
                    <option>Specialty</option>
                    <option>Safety</option>
                    <option>Administrative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="60" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="required" className="rounded" />
                <label htmlFor="required" className="text-sm">Required for all caregivers</label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCourseDialog(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Learning Path Dialog */}
      {showNewPathDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Create Learning Path</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Path Name</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Enter learning path name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Enter path description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option>Onboarding</option>
                    <option>Certification</option>
                    <option>Compliance</option>
                    <option>Skill Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Skill Level</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>All Levels</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="sequential" className="rounded" defaultChecked />
                  <label htmlFor="sequential" className="text-sm">Sequential (must complete in order)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="featured" className="rounded" />
                  <label htmlFor="featured" className="text-sm">Featured</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPathDialog(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Path
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
