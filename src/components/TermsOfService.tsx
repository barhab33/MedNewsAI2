import Header from './Header';
import Footer from './Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using MedNewsAI, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use of Service</h2>
            <p className="text-gray-700 mb-4">
              MedNewsAI provides curated medical and healthcare AI news and information. You agree to use this service only for lawful purposes and in accordance with these Terms.
            </p>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Use the service in any way that violates applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to any portion of the service</li>
              <li>Use automated systems to scrape or collect data from the service</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Impersonate or misrepresent your affiliation with any person or entity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Content Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              The information provided on MedNewsAI is for informational purposes only and should not be considered medical advice. All content is aggregated from publicly available sources and curated by AI systems.
            </p>
            <p className="text-gray-700">
              <strong>Important:</strong> Always consult qualified healthcare professionals for medical advice, diagnosis, or treatment. Do not disregard professional medical advice or delay seeking it because of information you read on MedNewsAI.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The service and its original content, features, and functionality are owned by MedNewsAI and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-700">
              Articles and content sourced from third parties remain the property of their respective owners. We provide attribution and links to original sources where applicable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Links</h2>
            <p className="text-gray-700">
              Our service may contain links to third-party websites or services that are not owned or controlled by MedNewsAI. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Advertising</h2>
            <p className="text-gray-700">
              We use third-party advertising companies to serve ads when you visit our service. These companies may use information about your visits to provide advertisements about goods and services of interest to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700">
              To the maximum extent permitted by law, MedNewsAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. Continued use of the service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-700">
              We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason, including breach of these Terms. All provisions of the Terms which by their nature should survive termination shall survive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-700">
              If you have any questions about these Terms, please contact us through our{' '}
              <a href="/#contact" className="text-teal-600 hover:text-teal-700 underline">
                contact form
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
