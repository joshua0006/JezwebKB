import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SEO } from './SEO';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Web Development Tutorials & Guides" 
        description="Find comprehensive guides, tutorials, and help for managing your website effectively with WordPress, Elementor, and more."
      />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
       
          <Outlet />

      </main>
      <Footer />
    </div>
  );
} 