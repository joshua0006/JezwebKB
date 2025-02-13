import React from 'react';
import { ArrowLeft, BookOpen, Users, Award, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AboutUs() {
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
          <div className="text-center mb-12">
            <BookOpen className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">About Jezweb Knowledge Base</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your comprehensive resource for web development and digital solutions, designed to help you succeed online.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-lg p-4 inline-block mb-4">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Driven</h3>
              <p className="text-gray-600">
                Built by developers for developers, with a focus on real-world solutions and practical knowledge.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 rounded-lg p-4 inline-block mb-4">
                <Award className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Content</h3>
              <p className="text-gray-600">
                Curated tutorials and guides written by industry professionals with years of experience.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 rounded-lg p-4 inline-block mb-4">
                <Globe className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Always Updated</h3>
              <p className="text-gray-600">
                Continuously updated content to keep pace with the latest web technologies and best practices.
              </p>
            </div>
          </div>

          <div className="prose prose-indigo max-w-none">
            <h2>Our Mission</h2>
            <p>
              At Jezweb Knowledge Base, we believe that knowledge should be accessible, practical, and actionable. 
              Our mission is to provide high-quality educational resources that help developers and businesses build 
              better web solutions.
            </p>

            <h2>What We Offer</h2>
            <ul>
              <li>Comprehensive tutorials on WordPress, Elementor, and more</li>
              <li>Step-by-step guides for common web development tasks</li>
              <li>Best practices for web security and performance</li>
              <li>Tips and tricks from experienced developers</li>
              <li>Regular updates and new content</li>
            </ul>

            <h2>Our Values</h2>
            <p>
              We are committed to:
            </p>
            <ul>
              <li>Quality - Ensuring all content is accurate, up-to-date, and valuable</li>
              <li>Accessibility - Making complex topics easy to understand</li>
              <li>Community - Building a supportive environment for learning</li>
              <li>Innovation - Staying current with the latest web technologies</li>
            </ul>

            <h2>Join Our Community</h2>
            <p>
              Whether you're a beginner just starting out or an experienced developer looking to expand your 
              knowledge, Jezweb Knowledge Base is here to support your journey. Join our community today and 
              start exploring our extensive collection of resources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}