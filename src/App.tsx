import { useEffect, useState, useRef } from 'react';
import { MedicalCategory, MedicalNews } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import BreakingNewsTicker from './components/BreakingNewsTicker';
import RecentSpotlight from './components/RecentSpotlight';
import NewsFeed from './components/NewsFeed';
import Newsletter from './components/Newsletter';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import ArticleModal from './components/ArticleModal';
import LeaderboardAd from './components/LeaderboardAd';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import About from './components/About';
import MedicalDisclaimer from './components/MedicalDisclaimer';
import CategoryFilter from './components/CategoryFilter';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MedicalCategory>('All');
  const [selectedArticle, setSelectedArticle] = useState<MedicalNews | null>(null);
  const newsFeedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const isAdmin = path === '/admin' || hash === '#admin';
    setShowAdmin(isAdmin);
  }, []);

  function handleCategorySelect(category: MedicalCategory) {
    setSelectedCategory(category);
    if (newsFeedRef.current) {
      newsFeedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const path = window.location.pathname;
  const hash = window.location.hash;

  if (showAdmin) {
    return <AdminDashboard />;
  }

  if (path === '/privacy' || hash === '#privacy') {
    return <PrivacyPolicy />;
  }

  if (path === '/terms' || hash === '#terms') {
    return <TermsOfService />;
  }

  if (path === '/about' || hash === '#about') {
    return <About />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 shadow-lg border border-blue-100">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              This Site Is For Sale
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Fully functional medical AI news aggregation platform with automated content curation,
              database integration, and modern React interface.
            </p>
            <div className="bg-white rounded-xl p-8 shadow-md mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Interested in acquiring this platform?</h2>
              <p className="text-lg text-gray-600 mb-6">
                Contact us to discuss pricing and transfer details.
              </p>
              <a
                href="mailto:bardur@barolimusic.com"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                bardur@barolimusic.com
              </a>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Full Stack Solution</h3>
                <p className="text-gray-600 text-sm">React frontend with Supabase backend and automated crawlers</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">AI Integration</h3>
                <p className="text-gray-600 text-sm">Gemini API for content summarization and categorization</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Ready to Deploy</h3>
                <p className="text-gray-600 text-sm">Complete codebase with documentation and workflows</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
