import React from 'react';
import { Shield, Users, TrendingUp, Heart } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-heading font-bold text-gray-900 mb-6">
              About Afus ⴰⴼⵓⵙ
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Empowering Moroccan cooperatives and connecting them with conscious buyers through secure, transparent transactions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                Afus ⴰⴼⵓⵙ was born from a simple vision: to create a fair, transparent marketplace that directly connects Moroccan agricultural cooperatives with buyers who value quality and authenticity.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                We believe that by eliminating middlemen and providing secure escrow payments, we can ensure fair prices for producers and authentic products for buyers.
              </p>
              <p className="text-lg text-gray-700">
                Our platform uses cutting-edge technology to verify deliveries, protect transactions, and build trust between all parties.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-primary-100 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">Our Values</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Fairness</h4>
                    <p className="text-gray-700">Ensuring fair prices for producers and buyers</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Security</h4>
                    <p className="text-gray-700">Protecting all transactions with escrow payments</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Transparency</h4>
                    <p className="text-gray-700">Building trust through open communication</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Growth</h4>
                    <p className="text-gray-700">Supporting sustainable growth for cooperatives</p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Browse Products',
                description: 'Explore authentic products directly from Moroccan cooperatives',
              },
              {
                step: '2',
                title: 'Secure Payment',
                description: 'Your payment is held in escrow until delivery is confirmed',
              },
              {
                step: '3',
                title: 'Verify Delivery',
                description: 'Scan QR code to confirm delivery and release payment',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center p-6 h-full">
                  <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-center text-gray-900 mb-12">
            Our Team
          </h2>
          <p className="text-center text-lg text-gray-700 max-w-3xl mx-auto">
            We're a passionate team of developers, designers, and agricultural experts working together to revolutionize how Moroccan products reach consumers.
          </p>
        </div>
      </section>
    </div>
  );
};

