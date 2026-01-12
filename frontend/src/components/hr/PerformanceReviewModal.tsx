import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface PerformanceReviewModalProps {
  staffId: string;
  staffName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: PerformanceReview) => Promise<void>;
  existingReview?: PerformanceReview | null;
}

export interface PerformanceReview {
  id?: string;
  reviewType: 'annual' | 'semi_annual' | 'quarterly' | 'probationary' | '30_day' | '60_day' | '90_day' | 'improvement_plan';
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  reviewDate: string;
  reviewerName: string;
  overallRating: number;
  categories: ReviewCategory[];
  strengths: string;
  areasForImprovement: string;
  goals: string;
  employeeComments?: string;
  followUpDate?: string;
  status: 'draft' | 'pending_employee' | 'completed';
}

interface ReviewCategory {
  name: string;
  rating: number;
  comments: string;
}

const REVIEW_TYPES = [
  { value: 'annual', label: 'Annual Review' },
  { value: 'semi_annual', label: 'Semi-Annual Review' },
  { value: 'quarterly', label: 'Quarterly Review' },
  { value: 'probationary', label: 'Probationary Review' },
  { value: '30_day', label: '30-Day Review' },
  { value: '60_day', label: '60-Day Review' },
  { value: '90_day', label: '90-Day Review' },
  { value: 'improvement_plan', label: 'Performance Improvement Plan Review' },
];

const DEFAULT_CATEGORIES: ReviewCategory[] = [
  { name: 'Job Knowledge & Skills', rating: 0, comments: '' },
  { name: 'Quality of Work', rating: 0, comments: '' },
  { name: 'Productivity & Efficiency', rating: 0, comments: '' },
  { name: 'Communication', rating: 0, comments: '' },
  { name: 'Teamwork & Collaboration', rating: 0, comments: '' },
  { name: 'Attendance & Punctuality', rating: 0, comments: '' },
  { name: 'Initiative & Problem Solving', rating: 0, comments: '' },
  { name: 'Professionalism', rating: 0, comments: '' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
};

function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          {star <= rating ? (
            <StarIconSolid className="h-6 w-6 text-warning-500" />
          ) : (
            <StarIcon className="h-6 w-6 text-gray-300" />
          )}
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">{RATING_LABELS[rating]}</span>
      )}
    </div>
  );
}

export function PerformanceReviewModal({ staffId, staffName, isOpen, onClose, onSubmit, existingReview }: PerformanceReviewModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<PerformanceReview>(existingReview || {
    reviewType: 'annual',
    reviewPeriodStart: '',
    reviewPeriodEnd: '',
    reviewDate: today,
    reviewerName: '',
    overallRating: 0,
    categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
    strengths: '',
    areasForImprovement: '',
    goals: '',
    employeeComments: '',
    followUpDate: '',
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const handleCategoryRatingChange = (index: number, rating: number) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      newCategories[index] = { ...newCategories[index], rating };
      return { ...prev, categories: newCategories };
    });
  };

  const handleCategoryCommentChange = (index: number, comments: string) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      newCategories[index] = { ...newCategories[index], comments };
      return { ...prev, categories: newCategories };
    });
  };

  const calculateOverallRating = () => {
    const ratedCategories = formData.categories.filter(c => c.rating > 0);
    if (ratedCategories.length === 0) return 0;
    const sum = ratedCategories.reduce((acc, c) => acc + c.rating, 0);
    return Math.round(sum / ratedCategories.length);
  };

  const handleSubmit = async (status: 'draft' | 'pending_employee' | 'completed') => {
    setError(null);

    if (!formData.reviewPeriodStart || !formData.reviewPeriodEnd) {
      setError('Please provide the review period dates');
      return;
    }

    if (!formData.reviewerName.trim()) {
      setError('Please enter the reviewer name');
      return;
    }

    const overallRating = calculateOverallRating();
    if (status !== 'draft' && overallRating === 0) {
      setError('Please rate at least one category before submitting');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        ...formData,
        overallRating,
        status,
      });
      onClose();
      // Reset form
      setFormData({
        reviewType: 'annual',
        reviewPeriodStart: '',
        reviewPeriodEnd: '',
        reviewDate: today,
        reviewerName: '',
        overallRating: 0,
        categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
        strengths: '',
        areasForImprovement: '',
        goals: '',
        employeeComments: '',
        followUpDate: '',
        status: 'draft',
      });
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save performance review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-primary-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-full">
                      <StarIconSolid className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        {existingReview ? 'Edit Performance Review' : 'Create Performance Review'}
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">For: {staffName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-primary-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Step indicator */}
                <div className="px-6 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        step === 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      1. Basic Info
                    </button>
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <button
                      onClick={() => setStep(2)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        step === 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      2. Ratings
                    </button>
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <button
                      onClick={() => setStep(3)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        step === 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      3. Summary
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {error && (
                    <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                      {error}
                    </div>
                  )}

                  {step === 1 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Review Type *
                          </label>
                          <select
                            value={formData.reviewType}
                            onChange={(e) => setFormData(prev => ({ ...prev, reviewType: e.target.value as PerformanceReview['reviewType'] }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          >
                            {REVIEW_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Review Date *
                          </label>
                          <input
                            type="date"
                            value={formData.reviewDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, reviewDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Review Period Start *
                          </label>
                          <input
                            type="date"
                            value={formData.reviewPeriodStart}
                            onChange={(e) => setFormData(prev => ({ ...prev, reviewPeriodStart: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Review Period End *
                          </label>
                          <input
                            type="date"
                            value={formData.reviewPeriodEnd}
                            onChange={(e) => setFormData(prev => ({ ...prev, reviewPeriodEnd: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reviewer Name *
                        </label>
                        <input
                          type="text"
                          value={formData.reviewerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, reviewerName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter your name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Follow-up Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={formData.followUpDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      {formData.categories.map((category, index) => (
                        <div key={category.name} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{category.name}</h4>
                            <StarRating
                              rating={category.rating}
                              onChange={(r) => handleCategoryRatingChange(index, r)}
                            />
                          </div>
                          <textarea
                            value={category.comments}
                            onChange={(e) => handleCategoryCommentChange(index, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="Add comments for this category..."
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {step === 3 && (
                    <>
                      <div className="p-4 bg-primary-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Overall Rating</span>
                          <StarRating rating={calculateOverallRating()} readonly />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Strengths
                        </label>
                        <textarea
                          value={formData.strengths}
                          onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="What does this employee do well?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Areas for Improvement
                        </label>
                        <textarea
                          value={formData.areasForImprovement}
                          onChange={(e) => setFormData(prev => ({ ...prev, areasForImprovement: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="What areas need development?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Goals for Next Period
                        </label>
                        <textarea
                          value={formData.goals}
                          onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="What should the employee focus on?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Comments (Optional)
                        </label>
                        <textarea
                          value={formData.employeeComments}
                          onChange={(e) => setFormData(prev => ({ ...prev, employeeComments: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Space for employee response..."
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between gap-3 px-6 py-4 border-t bg-gray-50">
                  <div>
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={() => setStep(step + 1)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Next
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSubmit('draft')}
                          disabled={saving}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          Save Draft
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmit('completed')}
                          disabled={saving}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Complete Review'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
