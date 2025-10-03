import { ExternalLink, Calendar, ImageOff } from 'lucide-react';
import { MedicalNews } from '../types';
import { useState } from 'react';

interface NewsCardProps {
  news: MedicalNews;
  onClick: () => void;
}

export default function NewsCard({ news, onClick }: NewsCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCategory = (category: string) => {
    return category;
  };

  return (
    <article
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200 cursor-pointer"
      onClick={onClick}
      itemScope
      itemType="https://schema.org/NewsArticle"
    >
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-16 h-16 text-teal-300" />
          </div>
        ) : (
          <img
            src={`${news.image_url}?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop`}
            alt={news.title}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
            itemProp="image"
          />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
            {formatCategory(news.category)}
          </span>
          <div className="flex items-center text-gray-500 text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(news.published_at)}
          </div>
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 leading-snug pb-1" itemProp="headline">
          {news.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed pb-1" itemProp="description">
          {news.summary}
        </p>

        <meta itemProp="datePublished" content={news.published_at} />
        <meta itemProp="author" content={news.source} />

        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-0.5">
            <div className="truncate">
              <span className="font-medium">Curated by:</span> MedNewsAI Editorial Team
            </div>
            <div className="truncate">
              <span className="font-medium">Source:</span> {news.original_source}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}