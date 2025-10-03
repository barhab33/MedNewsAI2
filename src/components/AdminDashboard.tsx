import { useState, useEffect } from 'react';
import { Play, RefreshCw, Database, BarChart3, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalArticles: number;
  pendingArticles: number;
  processedArticles: number;
  failedArticles: number;
  totalSummaries: number;
}

interface Article {
  id: string;
  title: string;
  category: string;
  processing_status: string;
  published_at: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    pendingArticles: 0,
    processedArticles: 0,
    failedArticles: 0,
    totalSummaries: 0
  });
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    loadStats();
    loadRecentArticles();
  }, []);

  async function loadStats() {
    try {
      const { count: total } = await supabase
        .from('medical_news')
        .select('*', { count: 'exact', head: true });

      const { count: pending } = await supabase
        .from('medical_news')
        .select('*', { count: 'exact', head: true })
        .eq('processing_status', 'pending');

      const { count: processed } = await supabase
        .from('medical_news')
        .select('*', { count: 'exact', head: true })
        .eq('processing_status', 'completed');

      const { count: failed } = await supabase
        .from('medical_news')
        .select('*', { count: 'exact', head: true })
        .eq('processing_status', 'failed');

      const { count: summaries } = await supabase
        .from('ai_summaries')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalArticles: total || 0,
        pendingArticles: pending || 0,
        processedArticles: processed || 0,
        failedArticles: failed || 0,
        totalSummaries: summaries || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadRecentArticles() {
    try {
      const { data } = await supabase
        .from('medical_news')
        .select('id, title, category, processing_status, published_at, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setRecentArticles(data);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  }

  async function fetchNews() {
    setLoading(true);
    setMessage('Fetching news from RSS feeds...');
    setMessageType('info');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-news`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✓ ${result.message}`);
        setMessageType('success');
        loadStats();
        loadRecentArticles();
      } else {
        setMessage(`Error: ${result.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  async function processArticles() {
    setLoading(true);
    setMessage('Processing articles with AI...');
    setMessageType('info');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/process-articles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✓ ${result.message}`);
        setMessageType('success');
        loadStats();
        loadRecentArticles();
      } else {
        setMessage(`Error: ${result.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  async function runFullPipeline() {
    setLoading(true);
    setMessage('Running full pipeline: Fetch → Process...');
    setMessageType('info');

    try {
      await fetchNews();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await processArticles();
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage news aggregation and AI processing</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-teal-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.totalArticles}</span>
            </div>
            <p className="text-sm text-gray-600">Total Articles</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.pendingArticles}</span>
            </div>
            <p className="text-sm text-gray-600">Pending</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.processedArticles}</span>
            </div>
            <p className="text-sm text-gray-600">Processed</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.totalSummaries}</span>
            </div>
            <p className="text-sm text-gray-600">AI Summaries</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={fetchNews}
              disabled={loading}
              className="flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Fetch News
            </button>

            <button
              onClick={processArticles}
              disabled={loading}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5 mr-2" />
              Process with AI
            </button>

            <button
              onClick={runFullPipeline}
              disabled={loading}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 mr-2" />
              Run Full Pipeline
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Articles</h2>
          <div className="space-y-3">
            {recentArticles.map(article => (
              <div key={article.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                    {article.title}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded">
                      {article.category}
                    </span>
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  {getStatusIcon(article.processing_status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(article.processing_status)}`}>
                    {article.processing_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
