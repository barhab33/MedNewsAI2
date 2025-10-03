import { Activity, Twitter, Linkedin, Mail, Github } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-3">
              <Activity className="w-6 h-6 text-teal-500" />
              <h3 className="text-lg font-bold text-white">MedNewsAI</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              Your trusted source for breakthroughs in medical AI and healthcare innovation.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-teal-500 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-teal-500 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@mednewsai.com"
                className="text-gray-400 hover:text-teal-500 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-teal-500 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-1.5">
              <li>
                <a href="/#about" className="text-sm text-gray-400 hover:text-teal-500 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#breakthroughs" className="text-sm text-gray-400 hover:text-teal-500 transition-colors">
                  Breakthroughs
                </a>
              </li>
              <li>
                <a href="#newsletter" className="text-sm text-gray-400 hover:text-teal-500 transition-colors">
                  Newsletter
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Categories</h4>
            <ul className="space-y-1.5">
              <li>
                <a href="#breakthroughs" className="text-sm text-gray-400 hover:text-teal-500 transition-colors">
                  Diagnostics
                </a>
              </li>
              <li>
                <a href="#breakthroughs" className="text-sm text-gray-400 hover:text-teal-500 transition-colors">
                  Drug Discovery
                </a>
              </li>
              <li>
                <a href="#breakthroughs" className="text-sm text-gray-400 hover:text-teal-500 transition-colors">
                  Medical Imaging
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-xs text-gray-400">
              © {currentYear} MedNewsAI. All rights reserved.
            </p>
            <div className="flex space-x-4 text-xs">
              <a href="/#privacy" className="text-gray-400 hover:text-teal-500 transition-colors">
                Privacy Policy
              </a>
              <a href="/#terms" className="text-gray-400 hover:text-teal-500 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}