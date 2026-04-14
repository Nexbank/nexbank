import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";
import imge from "../assets/Confident professional with smartphone.png";
import Navbar from "../components/Navbar";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="lp-wrapper">
      {/* BACKGROUND GLOWS */}
      <div className="lp-glow primary" />
      <div className="lp-glow secondary" />
      <Navbar />

      {/* HERO SECTION */}
      <section className="lp-hero">
        <h1>
          Your Banking, Simplified.
          <br />
          <span>NexBank</span>
        </h1>
        <p>
          Open accounts, manage money, and gain insights — all in one seamless
          experience built for modern users.
        </p>
        <div className="lp-actions">
          <button onClick={() => navigate("/login")} className="lp-btn-primary">
            Get Started
          </button>
          <button
            onClick={() => navigate("/login")}
            className="lp-btn-secondary"
          >
            Explore Features
          </button>
        </div>
      </section>

      {/* ACCOUNT TYPES SECTION */}
      <section className="lp-account-section">
        <h2 className="lp-section-title">Choose Your Account</h2>
        <div className="lp-account-grid">
          {/* BASIC CARD */}
          <div className="lp-account-card">
            <h3>Basic Account</h3>
            <p>
              Perfect for everyday transactions and simple money management.
            </p>
            <ul>
              <li>✔ Free deposits</li>
              <li>✔ Instant transfers</li>
              <li>✔ Mobile access</li>
            </ul>
            <button onClick={() => navigate("/login")} className="lp-btn-card">
              Open Account
            </button>
          </div>

          {/* PREMIUM CARD */}
          <div className="lp-account-card premium">
            <h3>Premium Account</h3>
            <p>Unlock smarter insights, higher limits, and premium benefits.</p>
            <ul>
              <li>✔ Everything in Basic</li>
              <li>✔ Spending insights</li>
              <li>✔ Priority transfers</li>
            </ul>
            <button
              onClick={() => navigate("/login")}
              className="lp-btn-card lp-btn-premium"
            >
              Upgrade
            </button>
          </div>

          {/* BUSINESS CARD */}
          <div className="lp-account-card">
            <h3>Business Account</h3>
            <p>Manage company finances with powerful tools and analytics.</p>
            <ul>
              <li>✔ Multi-user access</li>
              <li>✔ Bulk payments</li>
              <li>✔ Reports & insights</li>
            </ul>
            <button onClick={() => navigate("/login")} className="lp-btn-card">
              Start Business
            </button>
          </div>
        </div>
      </section>

      {/* BANK ANYTIME, ANYWHERE SECTION */}
      <section className="lp-bank">
        <div>
          <h2>
            Bank Anytime, <span>Anywhere</span>
          </h2>
          <p>
            Whether you're sending money, tracking expenses, or managing cards —
            NexBank keeps you connected wherever you go.
          </p>
          <ul>
            <li>Mobile-first experience</li>
            <li>Instant payments</li>
            <li>Real-time insights</li>
          </ul>
          <button
            onClick={() => navigate("/login")}
            className="lp-btn-secondary lp-mt-24"
          >
            Learn More
          </button>
        </div>

        <div className="lp-bank-image">
          <img
            src={imge}
            alt="Smiling man using smartphone for mobile banking"
          />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="lp-features">
        <h2 className="lp-section-title">Built for Smart Banking</h2>
        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <h3>Real-Time Transactions</h3>
            <p>
              Experience next-generation banking with seamless performance and
              intelligent features.
            </p>
          </div>
          <div className="lp-feature-card">
            <h3>AI Spending Insights</h3>
            <p>
              Experience next-generation banking with seamless performance and
              intelligent features.
            </p>
          </div>
          <div className="lp-feature-card">
            <h3>Secure Digital Banking</h3>
            <p>
              Experience next-generation banking with seamless performance and
              intelligent features.
            </p>
          </div>
        </div>
      </section>

      {/* STATS / TRUST BADGES */}
      <div className="lp-stats">
        <div>
          <div className="lp-stat-number">50k+</div>
          <div className="lp-stat-label">Active Users</div>
        </div>
        <div>
          <div className="lp-stat-number">R2.3B</div>
          <div className="lp-stat-label">Transactions</div>
        </div>
        <div>
          <div className="lp-stat-number">24/7</div>
          <div className="lp-stat-label">Support</div>
        </div>
        <div>
          <div className="lp-stat-number">4.9★</div>
          <div className="lp-stat-label">Rating</div>
        </div>
      </div>

      {/* FINAL CTA SECTION */}
      <section className="lp-cta">
        <div className="lp-cta-box">
          <h2>Start Your NexBank Journey Today</h2>
          <p>
            Join thousands of satisfied customers experiencing the future of
            banking.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="lp-btn-primary lp-btn-large"
          >
            Open Your Account
          </button>
          <p className="lp-small-text">
            No hidden fees • 2-minute setup • Fully insured
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
