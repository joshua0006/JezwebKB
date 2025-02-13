import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-indigo max-w-none">
            <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials (information or software)
              on Jezweb's website for personal, non-commercial transitory viewing only.
            </p>
            <p>This license shall automatically terminate if you violate any of these restrictions:</p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or other proprietary notations</li>
              <li>Transfer the materials to another person</li>
            </ul>

            <h2>3. Disclaimer</h2>
            <p>
              The materials on Jezweb's website are provided on an 'as is' basis. Jezweb makes no
              warranties, expressed or implied, and hereby disclaims and negates all other warranties
              including, without limitation, implied warranties or conditions of merchantability,
              fitness for a particular purpose, or non-infringement of intellectual property or
              other violation of rights.
            </p>

            <h2>4. Limitations</h2>
            <p>
              In no event shall Jezweb or its suppliers be liable for any damages (including,
              without limitation, damages for loss of data or profit, or due to business
              interruption) arising out of the use or inability to use the materials on Jezweb's
              website.
            </p>

            <h2>5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Jezweb's website could include technical, typographical,
              or photographic errors. Jezweb does not warrant that any of the materials on its
              website are accurate, complete, or current.
            </p>

            <h2>6. Links</h2>
            <p>
              Jezweb has not reviewed all of the sites linked to its website and is not responsible
              for the contents of any such linked site. The inclusion of any link does not imply
              endorsement by Jezweb of the site.
            </p>

            <h2>7. Modifications</h2>
            <p>
              Jezweb may revise these terms of service for its website at any time without notice.
              By using this website, you are agreeing to be bound by the then current version of
              these terms of service.
            </p>

            <h2>8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws
              of Australia and you irrevocably submit to the exclusive jurisdiction of the courts
              in that location.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
              <br />
              Email: legal@jezweb.com.au
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}