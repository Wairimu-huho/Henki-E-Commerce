// src/components/layout/Layout.jsx
import { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import useAuth from '../../hooks/useAuth';

const Layout = ({ children }) => {
  const { loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Delay rendering until auth is checked to prevent layout shifts
  useEffect(() => {
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {isReady ? children : (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;   