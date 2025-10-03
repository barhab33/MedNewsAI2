import { TrendingUp, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            AI is
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600"> Revolutionizing Medicine</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Discover the latest AI innovations transforming healthcare today
          </p>
        </div>
      </div>
    </section>
  );
}