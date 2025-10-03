import { ChevronRight, ArrowRight } from 'lucide-react';
import { MedicalCategory, MedicalNews } from '../types';

interface CategoryGridProps {
  onSelectCategory: (category: MedicalCategory) => void;
  categoryArticles: Record<string, MedicalNews[]>;
  onArticleClick: (article: MedicalNews) => void;
}

export default function CategoryGrid({ onSelectCategory, categoryArticles, onArticleClick }: CategoryGridProps) {
  const categories = [
    'Research',
    'Diagnostics',
    'Patient Care',
    'Medical Imaging',
    'Drug Discovery',
    'Genomics'
  ];

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
            Explore by Category
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Latest AI breakthroughs across medical specialties
          </p>
        </div>

        <div className="space-y-4">
          {categories.map((category) => {
            const articles = categoryArticles[category] || [];
            const topArticles = articles.slice(0, 4);

            if (topArticles.length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-3 py-2 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{category}</h3>
                  <button
                    onClick={() => onSelectCategory(category as MedicalCategory)}
                    className="flex items-center gap-1 text-white hover:text-teal-100 transition-colors font-semibold text-xs"
                  >
                    View All {articles.length}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                  {topArticles.map((article) => (
                    <article
                      key={article.id}
                      onClick={() => onArticleClick(article)}
                      className="group cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-teal-50 to-blue-50">
                        <img
                          src={`${article.image_url}?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop`}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs text-gray-500 mb-0.5">
                          {new Date(article.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-teal-600 transition-colors leading-snug">
                          {article.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
                          {article.summary}
                        </p>
                        <div className="flex items-center text-teal-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          Read more
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => onSelectCategory('All')}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            View All Articles
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </section>
  );
}
