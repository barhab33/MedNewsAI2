import { useState, useMemo, useEffect } from 'react';
import { MedicalCategory, MedicalNews } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import NewsCard from './NewsCard';
import CategoryFilter from './CategoryFilter';
import ArticleModal from './ArticleModal';
import InFeedAd from './InFeedAd';
import SidebarAd from './SidebarAd';

interface NewsFeedProps {
  selectedCategory: MedicalCategory;
}

export default function NewsFeed({ selectedCategory }: NewsFeedProps) {
  const [news, setNews] = useState<MedicalNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<MedicalNews | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/news-data.json');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Loaded', data.length, 'articles from /news-data.json');
      setNews(data || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load articles. Please refresh the page.');
      setNews([]);
      setIsLoading(false);
    }
  }

  const filteredNews = useMemo(() => {
    if (selectedCategory === 'All') {
      return news;
    }
    return news.filter((item) => item.category === selectedCategory);
  }, [news, selectedCategory]);

  const featuredArticle = filteredNews[0];
  const remainingArticles = filteredNews.slice(1);

  return (
    <section id="breakthroughs" className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedCategory === 'All' ? 'Latest Medical AI Breakthroughs' : selectedCategory}
              </h2>
              <p className="text-gray-600">
                {isLoading ? 'Loading news...' : selectedCategory === 'All'
                  ? `Showing all ${filteredNews.length} articles`
                  : `${filteredNews.length} article${filteredNews.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-300 rounded mb-3"></div>
                      <div className="h-6 bg-gray-300 rounded mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {featuredArticle && (
                  <div className="mb-12">
                    <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-t-xl inline-block">
                      FEATURED BREAKTHROUGH
                    </div>
                    <article
                      className="bg-white rounded-b-xl rounded-tr-xl shadow-xl overflow-hidden border-2 border-teal-600 cursor-pointer hover:shadow-2xl transition-shadow duration-300"
                      onClick={() => setSelectedArticle(featuredArticle)}
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="relative h-64 md:h-full overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100">
                          <img
                            src={`${featuredArticle.image_url}?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`}
                            alt={featuredArticle.title}
                            loading="eager"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                              {featuredArticle.category}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(featuredArticle.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                            {featuredArticle.title}
                          </h3>
                          <p className="text-gray-600 mb-6 text-lg leading-relaxed line-clamp-3">
                            {featuredArticle.summary}
                          </p>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Source:</span> {featuredArticle.original_source}
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ willChange: 'scroll-position' }}>
                  {remainingArticles.map((newsItem, index) => (
                    <>
                      <NewsCard
                        key={newsItem.id}
                        news={newsItem}
                        onClick={() => setSelectedArticle(newsItem)}
                      />
                      {(index + 1) % 6 === 0 && (
                        <InFeedAd key={`ad-${index}`} />
                      )}
                    </>
                  ))}
                </div>
              </>
            )}

            {selectedArticle && (
              <ArticleModal
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
              />
            )}

            {!isLoading && filteredNews.length === 0 && !error && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No articles available yet
                  </h3>
                  <p className="text-gray-600">
                    {selectedCategory === 'All'
                      ? 'The news crawler is currently populating the database with the latest medical AI breakthroughs. Please check back shortly.'
                      : `No articles found in the ${selectedCategory} category yet. Try selecting a different category or check back later.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <SidebarAd />
        </div>
      </div>
    </section>
  );
}