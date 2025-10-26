'use client';

import { useState } from 'react';
import { 
  FileText, 
  BookOpen, 
  ClipboardCheck, 
  Upload, 
  Download,
  Eye,
  Trash2,
  Filter,
  Search,
  Calendar,
  BarChart3,
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from 'lucide-react';
import Header from '@/components/Header';

export default function ExamplePage() {
  const [activeTab, setActiveTab] = useState('components');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">UI Components Showcase</h1>
          <p className="text-gray-600">Examples of all available components and styles</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {['components', 'buttons', 'forms', 'cards', 'alerts'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                >
                  <span className="capitalize">{tab}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Components Tab */}
            {activeTab === 'components' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Statistics Cards</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="stat-card">
                      <div className="stat-icon bg-blue-100">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Documents</p>
                        <p className="text-2xl font-bold text-gray-900">24</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon bg-green-100">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Summaries</p>
                        <p className="text-2xl font-bold text-gray-900">18</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon bg-purple-100">
                        <ClipboardCheck className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Exams</p>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon bg-orange-100">
                        <BarChart3 className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Words</p>
                        <p className="text-2xl font-bold text-gray-900">45,678</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Status Badges</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="badge-success">Completed</span>
                    <span className="badge-warning">Processing</span>
                    <span className="badge-error">Failed</span>
                    <span className="badge-info">In Review</span>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Progress Bars</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Upload Progress</span>
                        <span>75%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Processing</span>
                        <span>45%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: '45%'}}></div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Buttons Tab */}
            {activeTab === 'buttons' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Button Variations</h2>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <button className="btn btn-primary">Primary Button</button>
                      <button className="btn btn-secondary">Secondary Button</button>
                      <button className="btn btn-outline">Outline Button</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button className="btn btn-primary btn-sm">Small Primary</button>
                      <button className="btn btn-secondary btn-sm">Small Secondary</button>
                      <button className="btn btn-outline btn-sm">Small Outline</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button className="btn btn-primary btn-lg">Large Primary</button>
                      <button className="btn btn-secondary btn-lg">Large Secondary</button>
                      <button className="btn btn-outline btn-lg">Large Outline</button>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Icon Buttons</h2>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn btn-primary flex items-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </button>
                    <button className="btn btn-outline flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button className="btn btn-outline flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center space-x-2">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Icon Only Buttons</h2>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn btn-primary btn-icon">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="btn btn-outline btn-icon">
                      <Search className="h-4 w-4" />
                    </button>
                    <button className="btn btn-outline btn-icon">
                      <Filter className="h-4 w-4" />
                    </button>
                    <button className="btn btn-outline btn-icon">
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* Forms Tab */}
            {activeTab === 'forms' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Form Elements</h2>
                  <div className="max-w-md space-y-4">
                    <div className="form-group">
                      <label className="label">Email Address</label>
                      <input type="email" className="input" placeholder="Enter your email" />
                    </div>
                    
                    <div className="form-group">
                      <label className="label">Password</label>
                      <input type="password" className="input" placeholder="Enter your password" />
                      <p className="form-error">Password must be at least 8 characters</p>
                    </div>
                    
                    <div className="form-group">
                      <label className="label">Description</label>
                      <textarea className="input" rows={4} placeholder="Enter description..."></textarea>
                    </div>
                    
                    <div className="form-group">
                      <label className="label">Category</label>
                      <select className="input">
                        <option>Select category...</option>
                        <option>Education</option>
                        <option>Technology</option>
                        <option>Science</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">I agree to the terms and conditions</span>
                      </label>
                    </div>
                    
                    <button className="btn btn-primary w-full">Submit Form</button>
                  </div>
                </section>
              </div>
            )}

            {/* Cards Tab */}
            {activeTab === 'cards' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Card Layouts</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="card">
                      <h3 className="text-lg font-semibold mb-2">Basic Card</h3>
                      <p className="text-gray-600 mb-4">This is a basic card with some content and actions.</p>
                      <button className="btn btn-primary btn-sm">Action</button>
                    </div>

                    <div className="card">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Document Card</h3>
                          <p className="text-sm text-gray-500">PDF • 2.4 MB</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">Machine Learning Fundamentals documentation with comprehensive examples.</p>
                      <div className="flex space-x-2">
                        <button className="btn btn-outline btn-sm">View</button>
                        <button className="btn btn-outline btn-sm">Download</button>
                      </div>
                    </div>

                    <div className="card">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold">Status Card</h3>
                        <span className="badge-success">Active</span>
                      </div>
                      <p className="text-gray-600 mb-4">This card shows status information with badges and progress.</p>
                      <div className="progress-bar mb-3">
                        <div className="progress-fill" style={{width: '80%'}}></div>
                      </div>
                      <p className="text-sm text-gray-500">80% Complete</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Alert Messages</h2>
                  <div className="space-y-4">
                    <div className="alert-success flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">Success!</h4>
                        <p>Your document has been successfully uploaded and processed.</p>
                      </div>
                    </div>

                    <div className="alert-warning flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">Warning</h4>
                        <p>Your upload quota is almost reached. Consider upgrading your plan.</p>
                      </div>
                    </div>

                    <div className="alert-error flex items-center space-x-3">
                      <XCircle className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">Error</h4>
                        <p>Failed to process the document. Please try uploading again.</p>
                      </div>
                    </div>

                    <div className="alert-info flex items-center space-x-3">
                      <Clock className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">Processing</h4>
                        <p>Your document is being analyzed. This may take a few minutes.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Loading States</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="spinner w-6 h-6"></div>
                      <span>Loading documents...</span>
                    </div>
                    
                    <button className="btn btn-primary" disabled>
                      <div className="spinner w-4 h-4 mr-2"></div>
                      Processing...
                    </button>
                    
                    <div className="card">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}