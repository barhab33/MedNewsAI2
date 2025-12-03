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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12 md:p-16 text-center border border-slate-200">
          <div className="mb-8">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-6">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            This Site Is For Sale
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed">
            Interested in purchasing this domain?<br />
            Get in touch with us.
          </p>

          <a
            href="mailto:bardur@barolimusic.com"
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            bardur@barolimusic.com
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
