import { useState, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  FORM_REGISTRY,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  getFormBySlug,
} from './forms/form-registry';
import type { FormDefinition } from './forms/form-registry';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  PencilSquareIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

function FormGrid() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FormDefinition['category'] | 'all'>('all');

  const categories = Object.keys(CATEGORY_LABELS) as FormDefinition['category'][];

  const filteredForms = FORM_REGISTRY.filter(form => {
    const matchesSearch =
      !search ||
      form.title.toLowerCase().includes(search.toLowerCase()) ||
      form.description.toLowerCase().includes(search.toLowerCase()) ||
      form.id.includes(search);
    const matchesCategory = categoryFilter === 'all' || form.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getFormIcon = (form: FormDefinition) => {
    if (form.isLogTable) return <TableCellsIcon className="h-8 w-8 text-gray-400" />;
    if (form.hasSignature) return <PencilSquareIcon className="h-8 w-8 text-gray-400" />;
    return <DocumentTextIcon className="h-8 w-8 text-gray-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardDocumentListIcon className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Operating Forms</h1>
        </div>
        <p className="text-gray-600">
          PASSPORT program compliance forms — fill online, print/save as PDF, or download Excel templates
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({FORM_REGISTRY.length})
          </button>
          {categories.map(cat => {
            const count = FORM_REGISTRY.filter(f => f.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-gray-800 text-white'
                    : `${CATEGORY_COLORS[cat]} hover:opacity-80`
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredForms.map(form => (
          <Card
            key={form.id}
            className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
            onClick={() => navigate(`/dashboard/operating-forms/${form.slug}`)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getFormIcon(form)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">#{form.id}</span>
                    <Badge className={CATEGORY_COLORS[form.category] + ' text-xs'}>
                      {CATEGORY_LABELS[form.category]}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                    {form.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{form.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {form.policyReference && (
                      <span className="text-xs text-blue-600">{form.policyReference}</span>
                    )}
                    {form.hasSignature && (
                      <span className="text-xs text-amber-600">E-Signature</span>
                    )}
                    {form.isLogTable && (
                      <span className="text-xs text-teal-600">Log/Table</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredForms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No forms match your search criteria</p>
        </div>
      )}
    </div>
  );
}

function FormViewer({ slug }: { slug: string }) {
  const formDef = getFormBySlug(slug);

  if (!formDef) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Form not found</h2>
        <p className="text-gray-600 mt-2">The form "{slug}" does not exist.</p>
      </div>
    );
  }

  const FormComponent = formDef.component;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <span className="ml-3 text-gray-600">Loading form...</span>
        </div>
      }
    >
      <FormComponent />
    </Suspense>
  );
}

export default function OperatingFormsHub() {
  const { formSlug } = useParams<{ formSlug?: string }>();

  if (formSlug) {
    return <FormViewer slug={formSlug} />;
  }

  return <FormGrid />;
}
