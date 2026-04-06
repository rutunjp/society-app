import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="SocietyApp Logo" width={32} height={32} className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="text-xl font-extrabold tracking-tight text-indigo-900">SocietyApp</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors hidden">Pricing</a>
          </nav>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors hidden sm:flex">
              Sign In
            </Link>
            <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2.5 px-5 rounded-full shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20">
        <section className="text-center px-4 max-w-4xl mx-auto mt-10 md:mt-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Now live for all communities
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-900 mb-8 leading-tight">
            End the maintenance nightmare for your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">Society Committee.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Tired of chasing residents for dues, untangling Google Pay screenshots, and writing physical receipts? Automate collections, send instant WhatsApp receipts, and keep society accounts crystal clear.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold py-4 px-8 rounded-full shadow-xl shadow-indigo-600/20 transition-transform hover:-translate-y-1">
              Explore Demo Dashboard
            </Link>
            <a href="#features" className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-lg font-bold py-4 px-8 rounded-full shadow-sm transition-transform hover:-translate-y-1">
              View Features
            </a>
          </div>
        </section>

        <section id="features" className="mt-32 md:mt-48 max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-16 tracking-tight text-slate-900">Built to solve real RWA problems.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-2xl ring-1 ring-inset ring-indigo-500/20 font-bold">₹</div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 tracking-tight">Track Every Rupee</h3>
              <p className="text-slate-500 font-medium leading-relaxed">No more messy Excel sheets. Track monthly maintenance, Diwali event funds, and daily expenses with a transparent ledger.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 text-2xl ring-1 ring-inset ring-emerald-500/20">📱</div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 tracking-tight">Instant WhatsApp Receipts</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Stop handwriting receipts. Generate a professional PDF in 1-click and blast it directly to the resident&apos;s WhatsApp.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 text-2xl ring-1 ring-inset ring-amber-500/20">📋</div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 tracking-tight">Digital Register Book</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Ditch the physical register. Maintain a secure directory of all owners, tenants, and flat details in one place.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="SocietyApp Logo" width={24} height={24} className="w-8 h-8 grayscale opacity-50 outline-none" />
            <span className="font-extrabold tracking-tight text-slate-400">SocietyApp © 2026</span>
          </div>
          <div className="text-sm font-medium text-slate-400">
            A premium solution for modern housing societies.
          </div>
        </div>
      </footer>
    </div>
  )
}
