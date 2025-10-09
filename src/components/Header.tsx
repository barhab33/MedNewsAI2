import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 flex-shrink-0"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="40" height="40" rx="8" fill="#0D9488"/>
              <path
                d="M20 13 L20 27 M13 20 L27 20"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="15" cy="15" r="1.5" fill="white"/>
              <circle cx="25" cy="15" r="1.5" fill="white"/>
              <circle cx="15" cy="25" r="1.5" fill="white"/>
              <circle cx="25" cy="25" r="1.5" fill="white"/>
              <path
                d="M20 8 L20 10 M20 30 L20 32 M8 20 L10 20 M30 20 L32 20"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.5"
              />
              <circle cx="20" cy="20" r="3" fill="white" opacity="0.3"/>
            </svg>
            <h1 className="text-lg font-bold text-gray-900 py-2">MedNewsAI</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="#breakthroughs" className="text-sm text-gray-700 hover:text-teal-600 font-medium transition-colors">
              Breakthroughs
            </a>
            <a href="#newsletter" className="text-sm text-gray-700 hover:text-teal-600 font-medium transition-colors">
              Newsletter
            </a>
          </nav>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              <a
                href="#breakthroughs"
                className="text-gray-700 hover:text-teal-600 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Breakthroughs
              </a>
              <a
                href="#newsletter"
                className="text-gray-700 hover:text-teal-600 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Newsletter
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}