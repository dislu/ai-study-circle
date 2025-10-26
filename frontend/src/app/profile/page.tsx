'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Bell, Shield, CreditCard, Download, Trash2, Save } from 'lucide-react';
import Header from '@/components/Header';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    notifications: {
      email: true,
      push: false,
      weekly: true
    },
    privacy: {
      profile: 'private',
      activity: 'friends'
    }
  });

  useEffect(() => {
    // Mock user data - in real app, fetch from API
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'AI enthusiast and lifelong learner',
      avatar: '👨‍💻',
      joinDate: '2024-01-15',
      plan: 'Pro'
    };

    setUser(userData);
    setFormData({
      name: userData.name,
      email: userData.email,
      bio: userData.bio,
      notifications: {
        email: true,
        push: false,
        weekly: true
      },
      privacy: {
        profile: 'private',
        activity: 'friends'
      }
    });
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    
    // Mock save operation
    setTimeout(() => {
      setIsLoading(false);
      alert('Profile updated successfully!');
    }, 1000);
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Handle account deletion
      alert('Account deletion would be processed here');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account preferences and settings</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="text-6xl">{user.avatar}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">Joined {new Date(user.joinDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        notifications: {...formData.notifications, email: e.target.checked}
                      })}
                      className="h-4 w-4 text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Push Notifications</span>
                      <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications.push}
                      onChange={(e) => setFormData({
                        ...formData,
                        notifications: {...formData.notifications, push: e.target.checked}
                      })}
                      className="h-4 w-4 text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Weekly Summary</span>
                      <p className="text-sm text-gray-500">Get weekly summary of your activity</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications.weekly}
                      onChange={(e) => setFormData({
                        ...formData,
                        notifications: {...formData.notifications, weekly: e.target.checked}
                      })}
                      className="h-4 w-4 text-blue-600"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={formData.privacy.profile}
                      onChange={(e) => setFormData({
                        ...formData,
                        privacy: {...formData.privacy, profile: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Visibility
                    </label>
                    <select
                      value={formData.privacy.activity}
                      onChange={(e) => setFormData({
                        ...formData,
                        privacy: {...formData.privacy, activity: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Current Plan: {user.plan}</h4>
                      <p className="text-sm text-blue-700">Next billing date: January 15, 2024</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">$29</p>
                      <p className="text-sm text-blue-700">per month</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="btn btn-outline w-full flex items-center justify-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Update Payment Method</span>
                  </button>
                  
                  <button className="btn btn-outline w-full flex items-center justify-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Download Invoice</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handleDeleteAccount}
                className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Account</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}