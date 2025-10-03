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
      <BreakingNewsTicker />
      <Header />
      <MedicalDisclaimer />
      <main>
        <Hero />
        <LeaderboardAd />
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
        <RecentSpotlight />
        <div ref={newsFeedRef}>
          <NewsFeed selectedCategory={selectedCategory} />
        </div>
        <Newsletter />
        <Contact />
      </main>
      <Footer />
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}

export default App;
