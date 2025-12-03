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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="max-w-3xl w-full relative z-10">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl p-12 md:p-16 text-center border border-white/10">
          <div className="mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full mb-6 backdrop-blur-sm border border-blue-400/30">
              <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent mb-6">
            This Site Is For Sale
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
            Interested in purchasing this domain?<br />
            <span className="text-gray-400">Get in touch with us.</span>
          </p>

          <a
            href="mailto:bardur@barolimusic.com"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
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
