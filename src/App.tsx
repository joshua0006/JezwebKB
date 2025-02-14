import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CategoryList } from './components/CategoryList';
import { FeaturedArticles } from './components/FeaturedArticles';
import { ArticleView } from './components/ArticleView';
import { CategoryView } from './components/CategoryView';
import { Footer } from './components/Footer';
import { Article, Category } from './types';
import { Dashboard } from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import { TagView } from './components/TagView';
import { AllArticlesView } from './components/AllArticlesView';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { AboutUs } from './pages/AboutUs';
import { RequireAuth } from './components/auth/RequireAuth';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { SEO } from './components/SEO';
import { AppRoutes } from './routes';
import { HelmetProvider } from 'react-helmet-async';

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <HelmetProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
