import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Briefcase, Star, CheckCircle2, ArrowRight, MessageSquare, HelpCircle } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

export default function Landing() {
  const pricingPlans = [
    {
      name: 'Free',
      price: '₹0',
      description: '3 analyses lifetime',
      features: ['ATS score', 'Basic suggestions', '1 job description match'],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Most Popular',
      price: '₹299',
      description: 'Lifetime access, 30 analyses',
      features: [
        'Everything in Free',
        'Full rewrite of resume bullets',
        'LinkedIn summary generator',
        'Skills gap analysis',
        'Cover letter draft'
      ],
      cta: 'Unlock Now',
      popular: true
    },
    {
      name: 'Pro Monthly',
      price: '₹199',
      description: 'per month, unlimited',
      features: [
        'Everything in One-time',
        'Unlimited analyses',
        'Interview Q&A generator',
        'Multi-resume versions',
        'Priority support'
      ],
      cta: 'Go Pro',
      popular: false
    }
  ];

  const faqs = [
    {
      q: "How does the ATS score work?",
      a: "Our AI scans your resume against the job description using industry-standard keywords and formatting rules to give you a realistic match percentage."
    },
    {
      q: "Is my data secure?",
      a: "Yes, we use Supabase and Clerk for enterprise-grade security. Your resumes are private and only accessible by you."
    },
    {
      q: "Can I cancel my Pro subscription?",
      a: "Absolutely. You can manage your subscription from your profile settings at any time."
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-20 text-center lg:pt-32 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-bold text-primary">
            <Zap size={14} fill="currentColor" />
            <span>Trusted by 5,000+ job seekers</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            Optimize your resume for <span className="text-primary">ATS success</span>
          </h1>
          <p className="mt-8 text-lg text-text-muted sm:text-xl">
            Stop getting ghosted. Use AI to tailor your resume to any job description in seconds. 
            Get more interviews, guaranteed.
          </p>
          
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignedIn>
              <Link to="/app" className="btn-primary px-10 py-4 text-lg">
                Go to Analyzer <ArrowRight size={20} />
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-primary px-10 py-4 text-lg">
                  Get Started for Free <ArrowRight size={20} />
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </motion.div>

        {/* Demo Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-20 max-w-5xl rounded-2xl border border-border bg-surface p-4 shadow-2xl"
        >
          <div className="aspect-video w-full rounded-xl bg-bg flex items-center justify-center overflow-hidden">
            <div className="text-center">
              <div className="mb-4 flex justify-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <p className="text-text-muted font-mono text-sm">Interactive Demo Preview</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="bg-surface py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-text-muted">Choose the plan that fits your career goals.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-8 transition-all hover:shadow-xl",
                  plan.popular ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-bg"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-bold text-white uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    {plan.name === 'Pro Monthly' && <span className="text-text-muted">/mo</span>}
                  </div>
                  <p className="mt-2 text-sm text-text-muted">{plan.description}</p>
                </div>

                <ul className="mb-8 flex-1 space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 size={16} className="text-accent" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={cn(
                  "w-full rounded-xl py-3 text-sm font-bold transition-all",
                  plan.popular ? "bg-primary text-white hover:opacity-90" : "bg-surface border border-border text-text-main hover:bg-bg"
                )}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-6">
                <h3 className="flex items-center gap-3 font-bold">
                  <HelpCircle size={18} className="text-primary" />
                  {faq.q}
                </h3>
                <p className="mt-3 text-sm text-text-muted leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
