import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, Zap, AlertCircle, CheckCircle2, Lock, Sparkles, ArrowRight, X } from 'lucide-react';
import { analyzeResume, AnalysisResult } from '../lib/groq';

interface AppPageProps {
  onAnalyze: (result: AnalysisResult) => void;
}

const FUN_MESSAGES = [
  "Judging your formatting choices...",
  "Scanning for buzzwords...",
  "Tailoring your future...",
  "Consulting the career gods...",
  "Polishing those bullet points...",
  "Optimizing for ATS bots...",
  "Making you look like a rockstar...",
  "Almost there, stay focused..."
];

export default function AppPage({ onAnalyze }: AppPageProps) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [resume, setResume] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState({ count: 0, plan: 'free' });
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % FUN_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const fetchUsage = async () => {
    try {
      const res = await fetch(`/api/usage?userId=${user?.id}`);
      const data = await res.json();
      setUsage(data);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResume(data.text);
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!user) {
      setError("Please sign in to analyze your resume.");
      return;
    }
    if (!resume || !jobDesc) {
      setError("Please provide both your resume and the job description.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const usageRes = await fetch('/api/track-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (usageRes.status === 403) {
        setShowPaywall(true);
        setIsLoading(false);
        return;
      }

      const analysis = await analyzeResume(resume, jobDesc);
      
      await fetch('/api/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          jobTitle: jobDesc.split('\n')[0].substring(0, 50) || 'Job Analysis',
          analysis
        }),
      });

      onAnalyze(analysis);
      navigate('/results');
    } catch (err: any) {
      setError(err.message || "Something went wrong during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'one-time' | 'pro') => {
    try {
      const res = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const order = await res.json();

      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'OptimAI',
        description: `${plan === 'pro' ? 'Pro Monthly' : 'One-time'} Upgrade`,
        order_id: order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              userId: user?.id,
              plan
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setShowPaywall(false);
            fetchUsage();
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  const isLimitReached = (usage.plan === 'free' && usage.count >= 3) || 
                        (usage.plan === 'one-time' && usage.count >= 30);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Optimizer Console</h1>
        <p className="mt-3 text-text-muted">Upload your resume or paste the text below to begin your transformation.</p>
      </div>

      {!user && (
        <div className="mb-8 rounded-2xl bg-primary/5 p-8 text-center border border-primary/10">
          <Sparkles className="mx-auto mb-4 text-primary" size={32} />
          <h3 className="text-lg font-bold mb-2">Sign in to unlock AI analysis</h3>
          <p className="text-sm text-text-muted mb-6">Save your history and get 3 free analyses lifetime.</p>
          <SignInButton mode="modal">
            <button className="btn-primary px-8">Sign In with Clerk</button>
          </SignInButton>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Resume Input */}
        <div className="section-card">
          <div className="section-title">
            <span>Your Resume</span>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 text-[11px] font-bold text-primary hover:opacity-80 disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload PDF/DOCX
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".pdf,.docx" 
              className="hidden" 
            />
          </div>
          <div className="relative flex-1">
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume text here..."
              className="h-[400px] w-full bg-transparent text-[13px] leading-relaxed focus:outline-none resize-none"
            />
            {resume && (
              <div className="absolute top-0 right-0 text-accent">
                <CheckCircle2 size={18} />
              </div>
            )}
          </div>
        </div>

        {/* Job Description Input */}
        <div className="section-card">
          <div className="section-title">
            <span>Job Description</span>
          </div>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the job description here..."
            className="h-[400px] w-full bg-transparent text-[13px] leading-relaxed focus:outline-none resize-none"
          />
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-red-500 border border-red-500/20"
        >
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      <div className="mt-12 flex flex-col items-center gap-6">
        <button
          onClick={handleAnalyze}
          disabled={isLoading || isLimitReached}
          className={cn(
            "btn-primary px-16 py-4 text-lg",
            isLimitReached && "bg-gray-400 cursor-not-allowed shadow-none"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Analyzing...
            </>
          ) : isLimitReached ? (
            <>
              <Lock size={24} />
              Limit Reached
            </>
          ) : (
            <>
              <Zap size={24} fill="currentColor" />
              Analyze Now
            </>
          )}
        </button>

        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-text-muted">
          <span>
            {usage.plan === 'pro' ? 'Unlimited Access' : 
             usage.plan === 'one-time' ? `${30 - usage.count} uses remaining` : 
             `${Math.max(0, 3 - usage.count)} free uses remaining`}
          </span>
          {usage.plan !== 'pro' && (
            <button onClick={() => setShowPaywall(true)} className="text-primary underline hover:opacity-80">
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaywall(false)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl rounded-3xl border border-border bg-surface p-8 shadow-2xl"
            >
              <button 
                onClick={() => setShowPaywall(false)}
                className="absolute top-6 right-6 text-text-muted hover:text-text-main"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Zap size={32} fill="currentColor" />
                </div>
                <h2 className="text-3xl font-extrabold">Unlock Full Potential</h2>
                <p className="mt-2 text-text-muted">You've reached your free limit. Upgrade to continue.</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-bg p-6 flex flex-col">
                  <h3 className="text-lg font-bold">One-time</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">₹299</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">30 analyses lifetime</p>
                  <ul className="mt-6 mb-8 space-y-3 text-[13px]">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Full rewrite</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> LinkedIn summary</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Cover letter</li>
                  </ul>
                  <button 
                    onClick={() => handleUpgrade('one-time')}
                    className="mt-auto w-full rounded-xl bg-text-main py-3 text-sm font-bold text-surface hover:opacity-90"
                  >
                    Select Plan
                  </button>
                </div>

                <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6 flex flex-col shadow-lg shadow-primary/10">
                  <div className="mb-2 inline-flex self-start rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white uppercase">Most Popular</div>
                  <h3 className="text-lg font-bold">Pro Monthly</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">₹199</span>
                    <span className="text-text-muted text-sm">/mo</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">Unlimited analyses</p>
                  <ul className="mt-6 mb-8 space-y-3 text-[13px]">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Everything in One-time</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Interview Q&A</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Priority Support</li>
                  </ul>
                  <button 
                    onClick={() => handleUpgrade('pro')}
                    className="mt-auto w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:opacity-90"
                  >
                    Go Pro
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg/90 backdrop-blur-xl">
            <div className="text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative mx-auto mb-12 h-32 w-32"
              >
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-primary text-white shadow-2xl shadow-primary/40">
                  <Zap size={56} fill="currentColor" />
                </div>
              </motion.div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                {FUN_MESSAGES[loadingMsgIndex]}
              </h2>
              <p className="mt-4 text-text-muted font-medium">Optimizing your future career with AI...</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
