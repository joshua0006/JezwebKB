import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicy() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-indigo max-w-none">
            <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including when you:
            </p>
            <ul>
              <li>Create an account</li>
              <li>Subscribe to our newsletter</li>
              <li>Contact us for support</li>
              <li>Interact with our content</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide and maintain our services</li>
              <li>Send you updates and marketing communications</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze and improve our services</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>
              We do not sell or rent your personal information to third parties. We may share your
              information in the following circumstances:
            </p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in our operations</li>
            </ul>

            <h2>4. Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal
              information. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2>5. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
            </ul>

            <h2>6. Cookies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience on our website.
              You can control cookie preferences through your browser settings.
            </p>

            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: privacy@jezweb.com.au
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}