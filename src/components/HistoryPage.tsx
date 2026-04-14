import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { 
  History, 
  FileText, 
  Zap, 
  ChevronRight, 
  Calendar, 
  Target,
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnalysisResult } from '../lib/groq';

interface HistoryItem {
  id: string;
  job_title: string;
  result: AnalysisResult;
  created_at: string;
}

export default function HistoryPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/history?userId=${user?.id}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter(item => 
    item.job_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 rounded-full bg-primary/10 p-4 text-primary">
          <History size={48} />
        </div>
        <h2 className="text-2xl font-bold">Sign in to view history</h2>
        <p className="mt-2 text-text-muted">Your past analyses will be saved here.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Analysis History</h1>
          <p className="mt-2 text-text-muted">Track your progress and review past optimizations.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-surface border border-border" />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="section-card items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-bg p-4 text-text-muted">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold">No history found</h3>
          <p className="text-sm text-text-muted">Start analyzing resumes to see them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                // In a real app, we'd navigate to /results/:id
              }}
              className="group flex w-full items-center gap-6 rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <div className="text-center">
                  <div className="text-lg font-black leading-none">{item.result.atsScore}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest">Score</div>
                </div>
              </div>

              <div className="flex-1 text-left">
                <h3 className="text-base font-bold text-text-main group-hover:text-primary transition-colors">
                  {item.job_title}
                </h3>
                <div className="mt-1 flex items-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Target size={12} />
                    {item.result.keywordMatch}% Match
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-text-muted group-hover:text-primary transition-colors">
                <span className="text-[11px] font-bold uppercase tracking-widest">View Results</span>
                <ArrowUpRight size={18} />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
