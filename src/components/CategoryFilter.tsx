import { MedicalCategory } from '../types';

const categories: { value: MedicalCategory; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Drug Discovery', label: 'Drug Discovery' },
  { value: 'Surgery', label: 'Surgery' },
  { value: 'Research', label: 'Research' },
  { value: 'Clinical Trials', label: 'Clinical Trials' },
  { value: 'Diagnostics', label: 'Diagnostics' },
  { value: 'Medical Imaging', label: 'Medical Imaging' },
  { value: 'Patient Care', label: 'Patient Care' },
  { value: 'Genomics', label: 'Genomics' },
  { value: 'Telemedicine', label: 'Telemedicine' }
];

interface CategoryFilterProps {
  selectedCategory: MedicalCategory;
  onSelectCategory: (category: MedicalCategory) => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="bg-white border-y border-gray-200 py-6 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Browse by Category</h2>
        </div>

        <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => onSelectCategory(category.value)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-full transition-colors ${
                selectedCategory === category.value
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}