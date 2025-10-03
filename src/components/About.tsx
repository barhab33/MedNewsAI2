import Header from './Header';
import Footer from './Footer';
import { Brain, Sparkles, Globe, TrendingUp } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold mb-4">About MedNewsAI</h1>
            <p className="text-xl text-teal-50">
              Your trusted source for AI-powered medical news and healthcare innovation
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-4">
              MedNewsAI is dedicated to bringing you the latest breakthroughs in medical artificial intelligence and healthcare innovation. We leverage advanced AI technology to curate, analyze, and present the most important developments in medical AI from trusted sources worldwide.
            </p>
            <p className="text-lg text-gray-700">
              Our platform bridges the gap between complex medical AI research and accessible information, empowering healthcare professionals, researchers, patients, and enthusiasts to stay informed about the rapidly evolving intersection of medicine and artificial intelligence.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What We Do</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-teal-100 rounded-lg p-3 mr-4">
                    <Brain className="text-teal-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">AI-Powered Curation</h3>
                </div>
                <p className="text-gray-700">
                  Our advanced AI systems scan and analyze thousands of medical sources daily to bring you the most relevant and impactful news.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 rounded-lg p-3 mr-4">
                    <Sparkles className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Intelligent Summaries</h3>
                </div>
                <p className="text-gray-700">
                  Complex research papers and technical articles are transformed into clear, accessible summaries without losing scientific accuracy.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 rounded-lg p-3 mr-4">
                    <Globe className="text-green-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Global Coverage</h3>
                </div>
                <p className="text-gray-700">
                  We aggregate news from leading medical journals, research institutions, and healthcare organizations worldwide.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 rounded-lg p-3 mr-4">
                    <TrendingUp className="text-orange-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Real-Time Updates</h3>
                </div>
                <p className="text-gray-700">
                  Our platform continuously monitors and updates to ensure you never miss a breakthrough in medical AI.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Coverage Areas</h2>
            <p className="text-lg text-gray-700 mb-4">
              We cover a comprehensive range of medical AI topics, including:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>AI-powered diagnostics and imaging</li>
                <li>Drug discovery and development</li>
                <li>Surgical robotics and innovations</li>
                <li>Genomics and personalized medicine</li>
                <li>Clinical decision support systems</li>
              </ul>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Mental health AI applications</li>
                <li>Telemedicine and remote care</li>
                <li>Medical device innovations</li>
                <li>Healthcare data analytics</li>
                <li>Regulatory and ethical considerations</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment</h2>
            <div className="bg-teal-50 border-l-4 border-teal-600 p-6 rounded-r-lg">
              <p className="text-gray-800 mb-3">
                <strong>Accuracy:</strong> We prioritize credible sources and fact-based reporting, always linking to original research and publications.
              </p>
              <p className="text-gray-800 mb-3">
                <strong>Transparency:</strong> Our AI-powered curation process is designed to be unbiased and objective, presenting diverse perspectives.
              </p>
              <p className="text-gray-800">
                <strong>Accessibility:</strong> We believe important medical information should be accessible to everyone, not just specialists.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Important Disclaimer</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
              <p className="text-gray-800">
                MedNewsAI provides informational content for educational purposes only. The information on this site should not be considered medical advice. Always consult qualified healthcare professionals for medical decisions, diagnosis, or treatment.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Get In Touch</h2>
            <p className="text-lg text-gray-700 mb-4">
              We value feedback from our community. Whether you're a healthcare professional, researcher, or simply interested in medical AI, we'd love to hear from you.
            </p>
            <a
              href="/#contact"
              className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              Contact Us
            </a>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
