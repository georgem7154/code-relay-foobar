import React, { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../modules/context/AuthContext";
import {
  LayoutDashboard,
  CheckCircle2,
  Zap,
  Users,
  Shield,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import "./Landing.css";

const Landing = () => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    // Animation hook removed - elements now visible by default
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="landing">
      {/* Background Elements */}
      <div className="bg-grid"></div>
      <div className="bg-gradient-orb orb-1"></div>
      <div className="bg-gradient-orb orb-2"></div>

      {/* NAV */}
      <nav className="nav">
        <div className="container nav-inner">
          <div className="logo">
            <div className="logo-icon">
              <LayoutDashboard size={20} strokeWidth={2.5} />
            </div>
            <span className="logo-text">
              Task<span className="gradient-text">Nexus</span>
            </span>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="link">
              Log In
            </Link>
            <Link to="/register" className="btn-primary small">
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-left reveal-item">
            <div className="badge">
              <Sparkles size={14} />
              <span>Version 2.0 Live</span>
            </div>

            <h1>
              Plan. Track. <br />
              <span className="gradient-text">Succeed.</span>
            </h1>

            <p className="hero-description">
              The intelligent workspace for modern teams. Ship faster,
              collaborate smarter, and remove friction from execution.
            </p>

            <div className="hero-buttons">
              <Link to="/register" className="btn-primary large">
                Start Free
                <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn-secondary large">
                Live Demo
              </Link>
            </div>

            <div className="social-proof">
              <div className="avatars">
                <div className="avatar"></div>
                <div className="avatar"></div>
                <div className="avatar"></div>
                <div className="avatar"></div>
              </div>
              <div className="social-text">
                <div className="social-number">2,400+</div>
                <div className="social-label">teams already shipping</div>
              </div>
            </div>
          </div>

          <div className="hero-right reveal-item">
            <div className="app-preview">
              <div className="preview-window">
                <div className="window-header">
                  <div className="window-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <div className="window-title">TaskNexus Dashboard</div>
                  <div className="window-spacer"></div>
                </div>

                <div className="window-body">
                  <div className="sidebar">
                    <div className="sidebar-item active"></div>
                    <div className="sidebar-item"></div>
                    <div className="sidebar-item"></div>
                    <div className="sidebar-item"></div>
                  </div>

                  <div className="content-area">
                    <div className="content-header"></div>
                    <div className="task-grid">
                      <div className="task-card">
                        <div className="task-header"></div>
                        <div className="task-content"></div>
                        <div className="task-footer"></div>
                      </div>
                      <div className="task-card">
                        <div className="task-header"></div>
                        <div className="task-content"></div>
                        <div className="task-footer"></div>
                      </div>
                      <div className="task-card">
                        <div className="task-header"></div>
                        <div className="task-content"></div>
                        <div className="task-footer"></div>
                      </div>
                      <div className="task-card highlight">
                        <div className="task-header"></div>
                        <div className="task-content"></div>
                        <div className="task-footer"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="floating-card success">
                <CheckCircle2 size={16} />
                <span>Task Completed</span>
              </div>

              <div className="floating-card stats">
                <TrendingUp size={16} />
                <span>+24% this week</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="container">
          <div className="section-title reveal-item">
            <div className="section-badge">Features</div>
            <h2>Why TaskNexus?</h2>
            <p>Performance engineered. Elegantly designed.</p>
          </div>

          <div className="feature-grid">
            <div className="feature-card reveal-item">
              <div className="feature-icon blue">
                <Zap size={24} strokeWidth={2} />
              </div>
              <h3>Lightning Fast</h3>
              <p>
                Instant transitions and real-time updates without reloads.
                Built for speed from the ground up.
              </p>
            </div>

            <div className="feature-card reveal-item">
              <div className="feature-icon purple">
                <Users size={24} strokeWidth={2} />
              </div>
              <h3>Team Sync</h3>
              <p>
                Collaborate seamlessly with live state synchronization.
                Everyone stays on the same page.
              </p>
            </div>

            <div className="feature-card reveal-item">
              <div className="feature-icon green">
                <Shield size={24} strokeWidth={2} />
              </div>
              <h3>Enterprise Secure</h3>
              <p>
                Encrypted infrastructure built for scale and safety.
                Bank-level security by default.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card reveal-item">
            <h2>Ready to transform your workflow?</h2>
            <p>Join thousands of teams already shipping faster with TaskNexus.</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary large">
                Get Started Free
                <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn-glass large">
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <div className="footer-logo">
              <div className="logo-icon">
                <LayoutDashboard size={20} strokeWidth={2.5} />
              </div>
              <span className="logo-text">
                Task<span className="gradient-text">Nexus</span>
              </span>
            </div>
            <p className="footer-tagline">
              The intelligent workspace for modern teams.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Security</a>
              <a href="#">Roadmap</a>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>

            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>© 2026 TaskNexus Inc. All rights reserved.</p>
          <div className="footer-social">
            <a href="#">Twitter</a>
            <a href="#">GitHub</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;