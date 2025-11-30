import React from 'react';
import { Card } from '../components/ui/Card';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8">
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-8">
            Terms of Service
          </h1>
          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using Afus ⴰⴼⵓⵙ, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-700">
                Permission is granted to temporarily use Afus ⴰⴼⵓⵙ for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to reverse engineer any software contained on Afus ⴰⴼⵓⵙ</li>
                <li>Remove any copyright or other proprietary notations</li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Transactions</h2>
              <p className="text-gray-700">
                All transactions on Afus ⴰⴼⵓⵙ are subject to our escrow payment system. Payments are held securely until delivery is confirmed. We are not responsible for the quality, safety, or legality of products listed on our platform.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Disclaimers</h2>
              <p className="text-gray-700">
                The materials on Afus ⴰⴼⵓⵙ are provided on an 'as is' basis. Afus ⴰⴼⵓⵙ makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitations</h2>
              <p className="text-gray-700">
                In no event shall Afus ⴰⴼⵓⵙ or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Afus ⴰⴼⵓⵙ.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Revisions</h2>
              <p className="text-gray-700">
                Afus ⴰⴼⵓⵙ may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

