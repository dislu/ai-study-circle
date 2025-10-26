'use client';

import { Users, Target, Lightbulb, Award, Github, Linkedin, Twitter, Mail } from 'lucide-react';
import Header from '@/components/Header';

export default function AboutPage() {
  const team = [
    {
      name: 'Dr. Sarah Chen',
      role: 'AI Research Lead',
      bio: 'PhD in Machine Learning from Stanford. Previously at Google AI, specializing in natural language processing.',
      avatar: '👩‍💻',
      social: { linkedin: '#', twitter: '#' }
    },
    {
      name: 'Michael Rodriguez',
      role: 'Product Manager',
      bio: 'Former education technology executive with 15+ years experience in EdTech innovation.',
      avatar: '👨‍💼',
      social: { linkedin: '#', twitter: '#' }
    },
    {
      name: 'Dr. Emily Watson',
      role: 'Education Specialist',
      bio: 'PhD in Educational Psychology. Expert in learning assessment and curriculum development.',
      avatar: '👩‍🎓',
      social: { linkedin: '#', twitter: '#' }
    },
    {
      name: 'David Kim',
      role: 'Lead Developer',
      bio: 'Full-stack developer with expertise in AI/ML systems and scalable web applications.',
      avatar: '👨‍💻',
      social: { github: '#', linkedin: '#' }
    }
  ];

  const values = [
    {
      icon: Target,
      title: 'Innovation',
      description: 'Pushing the boundaries of AI technology to create meaningful educational tools that transform how people learn and teach.'
    },
    {
      icon: Users,
      title: 'Accessibility',
      description: 'Making advanced AI technology accessible to educators and learners worldwide, regardless of technical expertise.'
    },
    {
      icon: Lightbulb,
      title: 'Quality',
      description: 'Delivering high-quality, reliable results that educators and students can trust for their most important work.'
    },
    {
      icon: Award,
      title: 'Impact',
      description: 'Creating positive impact in education by saving time and improving learning outcomes for millions of users.'
    }
  ];

  const milestones = [
    { year: '2023', event: 'AI Study Circle founded with vision to revolutionize educational content creation' },
    { year: '2023', event: 'First AI-powered summary generation algorithm developed and tested' },
    { year: '2024', event: 'Launched comprehensive exam generation feature with multiple question types' },
    { year: '2024', event: 'Reached 10,000+ active users across 50+ countries' },
    { year: '2024', event: 'Introduced multi-language support and collaboration features' },
    { year: '2025', event: 'Expanding platform with advanced analytics and enterprise solutions' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            About AI Study Circle
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            We're on a mission to transform education through intelligent AI technology, 
            making high-quality educational content creation accessible to everyone.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl leading-relaxed max-w-4xl mx-auto">
            To democratize access to high-quality educational content creation by harnessing the power of 
            artificial intelligence, enabling educators and learners worldwide to focus on what matters most: 
            teaching, learning, and growing.
          </p>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">
              Key milestones in our mission to transform education
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gray-300"></div>
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div 
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                      <div className="font-bold text-blue-600 mb-2">{milestone.year}</div>
                      <p className="text-gray-700 text-sm">{milestone.event}</p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-md z-10"></div>
                  </div>
                  
                  <div className="w-5/12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">
              The passionate people behind AI Study Circle
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-6xl mb-4">{member.avatar}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <div className="text-blue-600 font-semibold mb-3">
                  {member.role}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {member.bio}
                </p>
                <div className="flex justify-center space-x-3">
                  {member.social.github && (
                    <a href={member.social.github} className="text-gray-400 hover:text-gray-600">
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {member.social.linkedin && (
                    <a href={member.social.linkedin} className="text-gray-400 hover:text-blue-600">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {member.social.twitter && (
                    <a href={member.social.twitter} className="text-gray-400 hover:text-blue-400">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get In Touch
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Have questions or want to learn more? We'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hello@aistudycircle.com"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center space-x-2"
            >
              <Mail className="h-5 w-5" />
              <span>Contact Us</span>
            </a>
            <a
              href="/auth"
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors inline-flex items-center justify-center"
            >
              Join Our Community
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}