import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Copy, 
  Download, 
  ArrowLeft, 
  Zap, 
  FileText, 
  Linkedin, 
  Target, 
  MessageSquare, 
  HelpCircle,
  ChevronRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnalysisResult } from '../lib/groq';

interface ResultsPageProps {
  result: AnalysisResult | null;
}

type TabType = 'overview' | 'bullets' | 'linkedin' | 'skills' | 'cover-letter' | 'interview';

export default function ResultsPage({ result }: ResultsPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  if (!result) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 rounded-full bg-primary/10 p-4 text-primary">
          <Zap size={48} />
        </div>
        <h2 className="text-2xl font-bold">No results found</h2>
        <p className="mt-2 text-text-muted">Please analyze a resume first.</p>
        <button onClick={() => navigate('/app')} className="btn-primary mt-8">
          Go to Analyzer
        </button>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'bullets', label: 'Bullets', icon: FileText },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { id: 'skills', label: 'Skills', icon: Zap },
    { id: 'cover-letter', label: 'Cover Letter', icon: MessageSquare },
    { id: 'interview', label: 'Interview', icon: HelpCircle },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <button 
            onClick={() => navigate('/app')}
            className="mb-4 flex items-center gap-2 text-sm font-bold text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} /> Back to Analyzer
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight">Analysis Results</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-bold hover:bg-bg transition-colors"
          >
            <Download size={18} /> Download PDF
          </button>
          <button 
            onClick={() => handleCopy(JSON.stringify(result, null, 2), 'all')}
            className="btn-primary px-6"
          >
            {copied === 'all' ? 'Copied!' : 'Copy All Results'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3">
          <div className="sticky top-24 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl p-4 text-sm font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-text-muted hover:bg-surface hover:text-text-main"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="ml-auto">
                    <ChevronRight size={16} />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Score Ring Section */}
                  <div className="section-card flex flex-col items-center justify-center py-12 text-center">
                    <div className="relative mb-8 h-48 w-48">
                      <svg className="h-full w-full" viewBox="0 0 120 120">
                        <circle
                          className="text-border"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="52"
                          cx="60"
                          cy="60"
                        />
                        <motion.circle
                          className="text-primary score-ring"
                          strokeWidth="8"
                          strokeDasharray="326.7"
                          strokeDashoffset={326.7 - (326.7 * result.atsScore) / 100}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="52"
                          cx="60"
                          cy="60"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black">{result.atsScore}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">ATS Score</span>
                      </div>
                    </div>
                    <div className="grid w-full grid-cols-3 gap-4 border-t border-border pt-8">
                      <div className="text-center">
                        <div className="text-xl font-bold">{result.keywordMatch}%</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Keywords</div>
                      </div>
                      <div className="text-center border-x border-border">
                        <div className="text-xl font-bold">{result.formattingScore}%</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Formatting</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{result.readabilityScore}%</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Readability</div>
                      </div>
                    </div>
                  </div>

                  {/* Missing/Weak Section */}
                  <div className="section-card">
                    <div className="section-title">
                      <span>Critical Improvements</span>
                      <AlertCircle size={16} className="text-warning" />
                    </div>
                    <ul className="space-y-4">
                      {result.missingWeak.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed">
                          <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                            <span className="text-[10px] font-bold">!</span>
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'bullets' && (
                <div className="space-y-6">
                  <div className="section-card">
                    <div className="section-title">
                      <span>Bullet Point Rewriter</span>
                      <Sparkles size={16} className="text-primary" />
                    </div>
                    <div className="space-y-8">
                      {result.rewrittenBullets.map((bullet, i) => (
                        <div key={i} className="group relative">
                          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">Point #{i + 1}</div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-lg border border-border bg-bg p-4 opacity-60">
                              <div className="mb-2 text-[10px] font-bold text-red-500 uppercase">Original</div>
                              <p className="text-[13px] italic">{bullet.original}</p>
                            </div>
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-sm">
                              <div className="mb-2 text-[10px] font-bold text-primary uppercase">Optimized</div>
                              <p className="text-[13px] font-medium leading-relaxed">{bullet.optimized}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleCopy(bullet.optimized, `bullet-${i}`)}
                            className="absolute -right-2 -top-2 rounded-full bg-surface p-2 shadow-md hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                          >
                            {copied === `bullet-${i}` ? <CheckCircle2 size={16} className="text-accent" /> : <Copy size={16} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'linkedin' && (
                <div className="section-card">
                  <div className="section-title">
                    <span>LinkedIn Summary</span>
                    <Linkedin size={16} className="text-[#0077b5]" />
                  </div>
                  <div className="relative rounded-xl bg-bg p-6">
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-text-main">
                      {result.linkedinSummary}
                    </p>
                    <button 
                      onClick={() => handleCopy(result.linkedinSummary, 'linkedin')}
                      className="absolute right-4 top-4 rounded-lg bg-surface p-2 shadow-sm hover:text-primary transition-colors"
                    >
                      {copied === 'linkedin' ? <CheckCircle2 size={18} className="text-accent" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="section-card">
                  <div className="section-title">
                    <span>Skills Gap Analysis</span>
                    <Zap size={16} className="text-warning" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {result.topSkills.map((skill, i) => (
                      <span key={i} className="skill-tag skill-tag-missing flex items-center gap-2">
                        <Zap size={10} fill="currentColor" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'cover-letter' && (
                <div className="section-card">
                  <div className="section-title">
                    <span>Tailored Cover Letter</span>
                    <MessageSquare size={16} className="text-primary" />
                  </div>
                  <div className="relative rounded-xl bg-bg p-8 font-serif shadow-inner">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-text-main">
                      {result.coverLetter}
                    </p>
                    <button 
                      onClick={() => handleCopy(result.coverLetter, 'cover-letter')}
                      className="absolute right-4 top-4 rounded-lg bg-surface p-2 shadow-sm hover:text-primary transition-colors"
                    >
                      {copied === 'cover-letter' ? <CheckCircle2 size={18} className="text-accent" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'interview' && (
                <div className="space-y-6">
                  <div className="section-card">
                    <div className="section-title">
                      <span>Interview Preparation</span>
                      <HelpCircle size={16} className="text-primary" />
                    </div>
                    <div className="space-y-8">
                      {result.interviewQA.map((qa, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">Q</div>
                            <h4 className="text-[14px] font-bold">{qa.question}</h4>
                          </div>
                          <div className="flex items-start gap-3 pl-9">
                            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold text-xs">A</div>
                            <p className="text-[13px] leading-relaxed text-text-muted">{qa.answer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
