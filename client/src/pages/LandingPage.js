import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white bg-black relative overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500 opacity-20 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-green-400 opacity-10 blur-[100px] bottom-[-100px] right-[-100px]" />

      {/* HERO */}
      <section className="px-10 py-24 text-center relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
          Banking That Moves <br />
          <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
            At Your Speed
          </span>
        </h1>

        <p className="text-gray-400 mt-6 max-w-xl mx-auto">
          Open accounts, manage money, and gain insights — all in one seamless
          experience built for modern users.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="bg-emerald-500 text-black px-8 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition"
          >
            Get Started
          </button>

          <button
            onClick={() => navigate("/login")}
            className="border border-gray-700 px-8 py-3 rounded-xl hover:border-emerald-500 transition"
          >
            Explore Features
          </button>
        </div>
      </section>

      {/* ACCOUNT TYPES */}
      <section className="px-10 py-20 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-12">
          Choose Your Account
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* BASIC */}
          <div
            className="p-8 rounded-2xl border border-gray-800 bg-[#0a0a0a] backdrop-blur transition hover:border-emerald-500 hover:-translate-y-1 duration-300"
            style={{
              boxShadow:
                "0 0 40px color-mix(in oklab, var(--color-emerald-900) 20%, transparent)",
            }}
          >
            <h3 className="text-xl font-semibold mb-4">Basic Account</h3>
            <p className="text-gray-400 mb-6">
              Perfect for everyday transactions and simple money management.
            </p>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>✔ Free deposits</li>
              <li>✔ Instant transfers</li>
              <li>✔ Mobile access</li>
            </ul>

            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full bg-emerald-500 text-black py-2 rounded-lg hover:bg-emerald-400 transition"
            >
              Open Account
            </button>
          </div>

          {/* PREMIUM */}
          <div
            className="p-8 rounded-2xl border border-emerald-500 bg-gradient-to-b from-[#0a0a0a] to-[#031b12] backdrop-blur transition scale-105"
            style={{
              boxShadow:
                "0 0 60px color-mix(in oklab, var(--color-emerald-900) 30%, transparent)",
            }}
          >
            <h3 className="text-xl font-semibold mb-4 text-emerald-400">
              Premium Account
            </h3>
            <p className="text-gray-400 mb-6">
              Unlock smarter insights, higher limits, and premium benefits.
            </p>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>✔ Everything in Basic</li>
              <li>✔ Spending insights</li>
              <li>✔ Priority transfers</li>
            </ul>

            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full bg-emerald-500 text-black py-2 rounded-lg hover:bg-emerald-400 transition"
            >
              Upgrade
            </button>
          </div>

          {/* BUSINESS */}
          <div className="p-8 rounded-2xl border border-gray-800 bg-[#0a0a0a] backdrop-blur transition hover:border-emerald-500 hover:-translate-y-1 duration-300">
            <h3 className="text-xl font-semibold mb-4">Business Account</h3>
            <p className="text-gray-400 mb-6">
              Manage company finances with powerful tools and analytics.
            </p>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>✔ Multi-user access</li>
              <li>✔ Bulk payments</li>
              <li>✔ Reports & insights</li>
            </ul>

            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full bg-emerald-500 text-black py-2 rounded-lg hover:bg-emerald-400 transition"
            >
              Start Business
            </button>
          </div>
        </div>
      </section>

      {/* BANK ANYTIME SECTION */}
      <section className="px-10 py-20 grid md:grid-cols-2 gap-10 items-center relative z-10 border-y border-white/10">
        <div>
          <h2 className="text-4xl font-bold mb-6">
            Bank Anytime, <span className="text-emerald-400">Anywhere</span>
          </h2>

          <p className="text-gray-400 mb-6 text-lg">
            Whether you're sending money, tracking expenses, or managing cards —
            NexBank keeps you connected wherever you go.
          </p>

          <ul className="space-y-3 text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✔</span> Mobile-first
              experience
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✔</span> Instant payments
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✔</span> Real-time insights
            </li>
          </ul>

          <button
            onClick={() => navigate("/login")}
            className="mt-8 bg-emerald-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400 transition"
          >
            Learn More
          </button>
        </div>

        {/* IMAGE */}
        <div className="relative rounded-2xl overflow-hidden group">
          <img
            src="/images/mobile-banking.jpg"
            alt="Mobile banking app on smartphone"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src =
                "https://placehold.co/600x400/0a0a0a/10b981?text=NexBank+Mobile+App";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 inline-block">
              <p className="text-xs text-emerald-400 font-mono">
                Available on iOS & Android
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-10 py-20 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-12">
          Built for Smart Banking
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            "Real-Time Transactions",
            "AI Spending Insights",
            "Secure Digital Banking",
          ].map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-gray-800 bg-[#0a0a0a] hover:border-emerald-500 transition hover:-translate-y-1 duration-300"
            >
              <h3 className="text-lg font-semibold mb-3">{item}</h3>
              <p className="text-gray-400 text-sm">
                Experience next-generation banking with seamless performance and
                intelligent features.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="px-10 py-10 relative z-10 border-y border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-400">50k+</div>
            <div className="text-gray-500 text-sm">Active Users</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">$2.3B</div>
            <div className="text-gray-500 text-sm">Transactions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">24/7</div>
            <div className="text-gray-500 text-sm">Support</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">4.9★</div>
            <div className="text-gray-500 text-sm">Rating</div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-10 py-24 text-center relative z-10">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#0a1a12] to-[#020a05] rounded-3xl p-12 border border-emerald-500/20">
          <h2 className="text-4xl font-bold mb-6">
            Start Your NexBank Journey Today
          </h2>

          <p className="text-gray-400 mb-8">
            Join thousands of satisfied customers experiencing the future of
            banking.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="bg-emerald-500 px-10 py-4 text-black rounded-xl font-semibold hover:bg-emerald-400 transition text-lg"
          >
            Open Your Account
          </button>

          <p className="text-gray-600 text-sm mt-6">
            No hidden fees • 2-minute setup • Fully insured
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
