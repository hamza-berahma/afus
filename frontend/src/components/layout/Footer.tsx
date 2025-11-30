import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import { GeometricBackground } from '../shared/GeometricBackground';
import { ZellijPattern } from '../shared/ZellijPattern';
import { AnimatedShapes } from '../shared/AnimatedShapes';

export const Footer: React.FC = () => {
  return (
    <footer className="relative gradient-footer text-white mt-20">
      <ZellijPattern variant="interlaced" opacity={0.15} />
      <GeometricBackground variant="zellij" opacity={0.1} />
      <AnimatedShapes count={3} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/logo.svg" 
                alt="Afus ⴰⴼⵓⵙ" 
                className="h-8 w-auto"
              />
              <h3 className="text-xl font-heading font-semibold">Afus ⴰⴼⵓⵙ</h3>
            </div>
            <p className="text-white/80 mb-4 text-sm">
              Bringing authentic Moroccan craftsmanship to the world. Every purchase supports local artisans and preserves traditional arts.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-accent-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-accent-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-accent-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-heading font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary-400 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-primary-400 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* For Producers */}
          <div>
            <h3 className="text-white font-heading font-semibold mb-4">For Producers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/register" className="hover:text-primary-400 transition-colors">
                  Register Cooperative
                </Link>
              </li>
              <li>
                <Link to="/dashboard/producer" className="hover:text-primary-400 transition-colors">
                  Producer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-primary-400 transition-colors">
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-heading font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="hover:text-primary-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Afus ⴰⴼⵓⵙ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

