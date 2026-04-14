import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useAuth } from '@clerk/clerk-react';
import Landing from './components/Landing';
import AppPage from './components/AppPage';
import ResultsPage from './components/ResultsPage';
import HistoryPage from './components/HistoryPage';
import { AnalysisResult } from './lib/groq';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Briefcase, Zap, ShieldCheck, Menu, X, History, LogOut, User, Moon, Sun } from 'lucide-react';

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <Router>
      <div className="min-h-screen bg-bg font-sans text-text-main transition-colors duration-300">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-[64px]">
            <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-primary">
              OptimAI <span className="font-light opacity-60">| Optimizer</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex md:items-center md:gap-6">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-bg transition-colors text-text-muted hover:text-text-main"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <SignedIn>
                <Link to="/app" className="text-[13px] font-semibold text-text-muted hover:text-text-main transition-colors">
                  Analyzer
                </Link>
                <Link to="/history" className="flex items-center gap-2 text-[13px] font-semibold text-text-muted hover:text-text-main transition-colors">
                  <History size={16} /> History
                </Link>
                <div className="h-6 w-px bg-border mx-2" />
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-primary text-white px-5 py-2 rounded-lg text-[13px] font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                    Get Started
                  </button>
                </SignInButton>
              </SignedOut>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Nav */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-x-0 top-full border-b border-[#0a0a0a]/10 bg-[#f5f5f4] p-4 md:hidden"
              >
                <div className="flex flex-col gap-4">
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Features</Link>
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Pricing</Link>
                  <Link to="/app" onClick={() => setIsMenuOpen(false)} className="rounded-xl bg-[#0a0a0a] p-4 text-center text-white font-medium">
                    Get Started
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<AppPage onAnalyze={setResult} />} />
            <Route path="/results" element={<ResultsPage result={result} />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#0a0a0a]/10 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <Zap size={16} fill="currentColor" />
                ResumeAI
              </div>
              <p className="text-sm opacity-40">© 2024 ResumeAI Optimizer. All rights reserved.</p>
              <div className="flex gap-6 text-sm font-medium opacity-60">
                <a href="#" className="hover:opacity-100">Privacy</a>
                <a href="#" className="hover:opacity-100">Terms</a>
                <a href="#" className="hover:opacity-100">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
