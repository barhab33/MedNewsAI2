import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import type { MedicalNews } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function BreakingNewsTicker() {
  const [headlines, setHeadlines] = useState<MedicalNews[]>([]);

  useEffect(() => {
    fetchHeadlines();
  }, []);

  const fetchHeadlines = async () => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('medical_news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(8);

        if (!error && data && data.length > 0) {
          const mappedData = data.map(article => ({
            ...article,
            summary: article.description || article.content || '',
            original_source: article.source
          }));
          setHeadlines(mappedData);
          return;
        }
      }

      const response = await fetch('/news-data.json');
      if (response.ok) {
        const data = await response.json();
        setHeadlines(data.slice(0, 8));
      }
    } catch (error) {
      console.error('Failed to fetch headlines:', error);
    }
  };

  if (headlines.length === 0) return null;

  const duplicatedHeadlines = [...headlines, ...headlines, ...headlines];

  return (
    <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-1.5 overflow-hidden">
      <div className="flex items-center">
        <div className="flex items-center px-3 space-x-1.5 bg-teal-700 py-1.5 flex-shrink-0">
          <Zap className="w-3 h-3 animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wide">Breaking</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-scroll inline-flex items-center whitespace-nowrap">
            {duplicatedHeadlines.map((item, index) => (
              <div key={`${item.id}-${index}`} className="inline-flex items-center space-x-2 mr-8">
                <span className="text-xs font-semibold bg-white/20 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
                <span className="text-xs font-medium">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
