import { X, ExternalLink, Calendar, Tag, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MedicalNews, AISummary } from '../types';
import { supabase } from '../lib/supabase';
import ArticleStructuredData from './ArticleStructuredData';

interface ArticleModalProps {
  article: MedicalNews;
  onClose: () => void;
}

export default function ArticleModal({ article, onClose }: ArticleModalProps) {
  const [aiSummaries, setAiSummaries] = useState<AISummary[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('default');

  useEffect(() => {
    loadAISummaries();
    document.title = `${article.title} - MedNewsAI`;

    updateMetaTags();

    return () => {
      document.title = 'MedNewsAI - Latest Medical AI Breakthroughs, Healthcare Innovation & Clinical Research News';
    };
  }, [article.id]);

  function updateMetaTags() {
    updateMetaTag('name', 'description', article.summary);
    updateMetaTag('property', 'og:title', article.title);
    updateMetaTag('property', 'og:description', article.summary);
    updateMetaTag('property', 'og:image', article.image_url);
    updateMetaTag('property', 'og:url', `https://mednewsai.com/article/${article.id}`);
    updateMetaTag('name', 'twitter:title', article.title);
    updateMetaTag('name', 'twitter:description', article.summary);
    updateMetaTag('name', 'twitter:image', article.image_url);
  }

  function updateMetaTag(attr: string, key: string, content: string) {
    let element = document.querySelector(`meta[${attr}="${key}"]`);
    if (element) {
      element.setAttribute('content', content);
    }
  }

  async function loadAISummaries() {
    try {
      const { data } = await supabase
        .from('ai_summaries')
        .select('*')
        .eq('article_id', article.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setAiSummaries(data);
        setSelectedProvider(data[0].model_provider);
      }
    } catch (error) {
      console.error('Error loading AI summaries:', error);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCategory = (category: string) => {
    return category;
  };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      'gemini': 'Google Gemini',
      'groq': 'Groq Llama',
      'xai': 'xAI Grok',
      'default': 'Default'
    };
    return labels[provider] || provider;
  };

  const selectedSummary = aiSummaries.find(s => s.model_provider === selectedProvider);
  const displaySummary = selectedSummary?.summary_text || article.summary;
  const displayContent = selectedSummary?.content_text || article.content;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center p-4">
      <ArticleStructuredData article={article} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        <div className="relative h-80 overflow-hidden rounded-t-2xl bg-gray-200">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {article.image_attribution && (
            <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded backdrop-blur-sm">
              {article.image_attribution}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                <Tag className="w-4 h-4 mr-1" />
                {formatCategory(article.category)}
              </span>
              <span className="inline-flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(article.published_at)}
              </span>
            </div>
            <h2 className="text-3xl font-bold leading-tight">
              {article.title}
            </h2>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <span className="font-semibold">Curated by:</span> MedNewsAI Editorial Team
              </div>
              <div>
                <span className="font-semibold">Source:</span> {article.original_source}
              </div>
            </div>
          </div>

          {aiSummaries.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-semibold text-gray-700">AI-Generated Summaries</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedProvider('default')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedProvider === 'default'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Default
                </button>
                {aiSummaries.map((summary) => (
                  <button
                    key={summary.id}
                    onClick={() => setSelectedProvider(summary.model_provider)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedProvider === summary.model_provider
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getProviderLabel(summary.model_provider)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <p className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
              {displaySummary}
            </p>

            <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-line">
              {displayContent}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 space-y-1">
              <p className="italic">
                <span className="font-medium">Original Source:</span> {article.original_source}
              </p>
              <p className="italic">
                <span className="font-medium">Curated by:</span> MedNewsAI Editorial Team
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}