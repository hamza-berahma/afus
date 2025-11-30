import React from 'react';
import { HelpCircle, Book, MessageCircle, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Accordion } from '../components/ui/Accordion';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export const Help: React.FC = () => {
  const faqs = [
    {
      title: 'How do I create an account?',
      content: 'Click on "Sign Up" in the navigation bar, fill in your details, and choose whether you want to register as a buyer or producer. You\'ll need to provide your email, phone number, and create a password.',
    },
    {
      title: 'How does escrow payment work?',
      content: 'When you make a purchase, your payment is held securely in escrow. The seller ships the product, and once you confirm delivery by scanning the QR code, the payment is automatically released to the seller.',
    },
    {
      title: 'How do I activate my wallet?',
      content: 'Go to your Wallet Dashboard and click "Activate Wallet". You\'ll need to provide some additional information for verification. Once activated, you can start making transactions.',
    },
    {
      title: 'What if I don\'t receive my order?',
      content: 'If you don\'t receive your order or there\'s an issue, you can dispute the transaction. Contact our support team, and we\'ll help resolve the issue. Your payment remains in escrow until the dispute is resolved.',
    },
    {
      title: 'How do I list my products as a producer?',
      content: 'First, register as a producer and create or join a cooperative. Then, go to your Producer Dashboard and click "Add Product". Fill in the product details, upload images, and set your price.',
    },
    {
      title: 'What are the transaction fees?',
      content: 'For buyers, there are no fees. For producers, we charge a 2.5% transaction fee on each successful sale. This fee is deducted before the payment reaches your wallet.',
    },
  ];

  const resources = [
    {
      icon: <Book size={24} />,
      title: 'Getting Started Guide',
      description: 'Learn the basics of using Afus ⴰⴼⵓⵙ',
      link: '#',
    },
    {
      icon: <FileText size={24} />,
      title: 'API Documentation',
      description: 'For developers and integrators',
      link: '#',
    },
    {
      icon: <MessageCircle size={24} />,
      title: 'Community Forum',
      description: 'Connect with other users',
      link: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-4">
            Help & Support
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions and get the help you need
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {resources.map((resource, index) => (
            <Card key={index} hoverable className="p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-primary-600">
                {resource.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
              <Button variant="secondary" size="sm">
                Learn More
              </Button>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-heading font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion items={faqs.map((faq) => ({ title: faq.title, content: faq.content }))} />
        </Card>

        {/* Contact Support */}
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Still need help?
          </h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to assist you. Get in touch and we'll respond as soon as possible.
          </p>
          <Link to="/contact">
            <Button variant="primary" size="lg">
              Contact Support
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

