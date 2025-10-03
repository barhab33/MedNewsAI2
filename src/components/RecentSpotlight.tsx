import { useEffect, useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import type { MedicalNews } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function RecentSpotlight() {
  const [recentArticles, setRecentArticles] = useState<MedicalNews[]>([]);

  useEffect(() => {
    fetchRecentArticles();
  }, []);

  const fetchRecentArticles = async () => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('medical_news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(3);

        if (!error && data && data.length > 0) {
          setRecentArticles(data);
          return;
        }
      }

      const response = await fetch('/news-data.json');
      if (response.ok) {
        const data = await response.json();
        setRecentArticles(data.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to fetch recent articles:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (recentArticles.length === 0) return null;

  return (
    <section className="bg-white py-12 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">Just Published</h2>
          </div>
          <a
            href="#breakthroughs"
            className="flex items-center text-teal-600 hover:text-teal-700 font-semibold text-sm group"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentArticles.map((article) => (
            <div
              key={article.id}
              className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-teal-100 to-blue-100">
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Clock className="w-16 h-16 text-teal-600/30" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(article.published_at)}</span>
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {article.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
