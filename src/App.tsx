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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-8">
          This Site Is For Sale
        </h1>
        <p className="text-2xl text-gray-600 mb-12">
          Interested? Contact us at
        </p>
        <a
          href="mailto:bardur@barolimusic.com"
          className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-lg text-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          bardur@barolimusic.com
        </a>
      </div>
    </div>
  );
}

export default App;
