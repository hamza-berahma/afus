import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Save, User, Bell, Shield, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Settings saved successfully!');
      setIsSaving(false);
    }, 1000);
  };

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User size={18} />,
      content: (
        <div className="space-y-6">
          <Input
            label="Full Name"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            disabled
          />
          <Input
            label="Phone Number"
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
          />
          <Button variant="primary" onClick={handleSave} loading={isSaving} icon={<Save size={18} />}>
            Save Changes
          </Button>
        </div>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={18} />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-600">Receive email updates about your transactions</p>
            </div>
            <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-primary-600 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
              <p className="text-sm text-gray-600">Receive SMS updates about important events</p>
            </div>
            <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-primary-600 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield size={18} />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              <Input label="Current Password" type="password" />
              <Input label="New Password" type="password" />
              <Input label="Confirm New Password" type="password" />
              <Button variant="primary">Update Password</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: <CreditCard size={18} />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Payment settings and wallet management</p>
          <Button variant="secondary" onClick={() => window.location.href = '/wallet'}>
            Go to Wallet
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">Settings</h1>
        <Card className="p-6">
          <Tabs tabs={tabs} />
        </Card>
      </div>
    </div>
  );
};

