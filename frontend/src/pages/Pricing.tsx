import React from 'react';
import { Check, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion } from 'framer-motion';

export const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Buyer',
      price: 'Free',
      description: 'Perfect for individual buyers',
      features: [
        'Browse all products',
        'Secure escrow payments',
        'QR code delivery verification',
        'Transaction history',
        'Customer support',
      ],
      notIncluded: ['Producer dashboard', 'Bulk ordering'],
      popular: false,
    },
    {
      name: 'Producer',
      price: '2.5%',
      description: 'Per transaction fee',
      features: [
        'Product listing',
        'Cooperative management',
        'Transaction management',
        'Analytics dashboard',
        'Priority support',
        'Bulk order handling',
      ],
      notIncluded: [],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large cooperatives',
      features: [
        'Everything in Producer',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced analytics',
        'White-label options',
        'API access',
      ],
      notIncluded: [],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-6xl font-heading font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that works best for you. No hidden fees, no surprises.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Card
                className={`relative h-full ${plan.popular ? 'ring-2 ring-primary-500 shadow-xl' : ''}`}
              >
                {plan.popular && (
                  <Badge
                    color="primary"
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                  >
                    Most Popular
                  </Badge>
                )}
                <div className="p-6">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Free' && plan.price !== 'Custom' && (
                      <span className="text-gray-600 ml-2">per transaction</span>
                    )}
                  </div>
                  <Button
                    variant={plan.popular ? 'primary' : 'secondary'}
                    fullWidth
                    className="mb-6"
                  >
                    Get Started
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 opacity-50">
                        <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg p-8"
        >
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            {[
              {
                q: 'Are there any setup fees?',
                a: 'No, there are no setup fees. You only pay transaction fees when you make a sale.',
              },
              {
                q: 'How do transaction fees work?',
                a: 'For producers, we charge a 2.5% fee on each successful transaction. This fee is deducted from the payment before it reaches your wallet.',
              },
              {
                q: 'When do I get paid?',
                a: 'Payment is released to your wallet immediately after the buyer confirms delivery by scanning the QR code.',
              },
              {
                q: 'Can I change my plan?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

