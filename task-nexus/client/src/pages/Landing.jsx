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
} from "lucide-react";
import "./Landing.css";

const Landing = () => {
  const { user, loading } = useAuth();

  // Redirect logged-in users
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    // Scroll reveal animation
    const elements = document.querySelectorAll(".reveal-item");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));

    // Magnetic button effect
    const buttons = document.querySelectorAll(".btn-primary");

    buttons.forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0px, 0px)";
      });
    });

    return () => observer.disconnect();
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
      <div className="bg-blur"></div>

      {/* NAV */}
      <nav className="nav glass">
        <div className="nav-inner">
          <div className="logo">
            <LayoutDashboard size={28} />
            <span>
              Task<span className="gradient-text">Nexus</span>
            </span>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="link">
              Log In
            </Link>
            <Link to="/register" className="btn-primary small">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content reveal-item">
          <div className="badge">
            <span className="dot"></span> Version 2.0 Live
          </div>

          <h1 className="hero-title">
            Plan. Track.
            <br />
            <span className="gradient-text">Succeed.</span>
          </h1>

          <p className="hero-sub">
            The intelligent workspace for modern teams. Ship faster,
            collaborate smarter, and remove friction from execution.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="btn-primary">
              Start Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary">
              Live Demo
            </Link>
          </div>
        </div>

        {/* Mock UI Preview */}
        <div className="preview reveal-item">
          <div className="preview-header">
            <span className="circle red"></span>
            <span className="circle yellow"></span>
            <span className="circle green"></span>
          </div>
          <div className="preview-content">
            <div className="line"></div>
            <div className="grid">
              <div className="card"></div>
              <div className="card"></div>
              <div className="card"></div>
            </div>
          </div>
          <div className="floating-success">
            <CheckCircle2 size={16} /> Task Completed
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="section-title reveal-item">
          <h2>Why TaskNexus?</h2>
          <p>Performance engineered. Elegantly designed.</p>
        </div>

        <div className="feature-grid">
          <div className="feature-card reveal-item">
            <div className="icon blue">
              <Zap size={22} />
            </div>
            <h3>Lightning Fast</h3>
            <p>Instant transitions and real-time updates without reloads.</p>
          </div>

          <div className="feature-card reveal-item">
            <div className="icon purple">
              <Users size={22} />
            </div>
            <h3>Team Sync</h3>
            <p>Collaborate seamlessly with live state synchronization.</p>
          </div>

          <div className="feature-card reveal-item">
            <div className="icon green">
              <Shield size={22} />
            </div>
            <h3>Enterprise Secure</h3>
            <p>Encrypted infrastructure built for scale and safety.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2026 TaskNexus Inc.</p>
        <div>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Twitter</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
