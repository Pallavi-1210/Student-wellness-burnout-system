import {
  FiArrowRight,
  FiActivity,
  FiBarChart2,
  FiList,
  FiCheckCircle,
  FiShield,
  FiHeart,
  FiCompass,
  FiBatteryCharging,
  FiCloudRain,
} from "react-icons/fi";

function LandingPage({ onStartAssessment, onLoginClick, onRegisterClick }) {
  return (
    <div className="landing-page">
      {/* 1. HERO SECTION */}
      <section id="hero" className="landing-section hero-section">
        <div className="section-container hero-grid">
          <div className="hero-content">
            <span className="wellness-badge">
              <FiShield className="badge-icon" /> AI-Driven Student Mental Wellness
            </span>
            <h1 className="hero-headline">
              Your grades matter. <br />
              <span className="hero-highlight">But Your well-being matters more.</span>
            </h1>
            <p className="hero-subtext">
              A science-backed burnout risk evaluation built specifically for students.
            </p>
            <div className="hero-cta-group">
              <button
                type="button"
                className="btn-landing-primary"
                onClick={onStartAssessment || onRegisterClick}
              >
                Get Started Free <FiArrowRight className="cta-icon" />
              </button>
              <button
                type="button"
                className="btn-landing-secondary"
                onClick={onLoginClick}
              >
                Sign In to Account
              </button>
            </div>
            <div className="hero-trust-indicators">
              <div className="trust-item">
                <FiCheckCircle className="trust-icon" /> Confidential & Secure
              </div>
              <div className="trust-item">
                <FiCheckCircle className="trust-icon" /> Random Forest ML Model
              </div>
              <div className="trust-item">
                <FiCheckCircle className="trust-icon" /> Actionable Insights
              </div>
            </div>
          </div>

          <div className="hero-media-wrapper">
            <div className="hero-image-frame">
              <img
                src="/hero_wellness.jpg"
                alt="Students studying together in a warm, supportive wellness environment"
                className="hero-main-image"
                loading="eager"
              />
              <div className="hero-floating-card">
                <div className="floating-card-icon">
                  <FiHeart />
                </div>
                <div className="floating-card-text">
                  <span className="floating-card-title">Proactive Wellness</span>
                  <span className="floating-card-desc">Personalized recovery pacing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT & BURNOUT SECTION */}
      <section id="about" className="landing-section about-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">Understanding Student Stress</span>
            <h2 className="section-title">What Is Student Burnout?</h2>
          </div>

          <div className="about-content-layout">
            <div className="about-image-card">
              <img
                src="/student_mindfulness.jpg"
                alt="Student taking a mindful break with warm tea and journal"
                className="about-photo"
                loading="lazy"
              />
              <div className="about-photo-caption">
                <span className="caption-tag">Mindful Pause</span>
              </div>
            </div>

            <div className="burnout-signs-col">
              <h3 className="subheading-accent">Common Early Warning Signs</h3>

              <div className="burnout-sign-card card-fatigue">
                <div className="sign-icon-box">
                  <FiBatteryCharging />
                </div>
                <div className="sign-details">
                  <h4>Constant Fatigue</h4>
                </div>
              </div>

              <div className="burnout-sign-card card-focus">
                <div className="sign-icon-box">
                  <FiCloudRain />
                </div>
                <div className="sign-details">
                  <h4>Loss of Academic Focus</h4>
                </div>
              </div>

              <div className="burnout-sign-card card-disconnect">
                <div className="sign-icon-box">
                  <FiCompass />
                </div>
                <div className="sign-details">
                  <h4>Emotional Disconnection</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-section how-it-works-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">Seamless 3-Step Process</span>
            <h2 className="section-title">How It Works</h2>
          </div>

          <div className="how-it-works-grid">
            <div className="steps-cards-list">
              <div className="step-card-horizontal">
                <div className="step-number-badge">1</div>
                <div className="step-body">
                  <h4>Answer 16 Thoughtful Questions</h4>
                </div>
              </div>

              <div className="step-card-horizontal">
                <div className="step-number-badge">2</div>
                <div className="step-body">
                  <h4>Instant ML Risk Evaluation</h4>
                </div>
              </div>

              <div className="step-card-horizontal">
                <div className="step-number-badge">3</div>
                <div className="step-body">
                  <h4>Receive Recommendations & Track Growth</h4>
                </div>
              </div>
            </div>

            <div className="study-space-card">
              <img
                src="/peaceful_study.jpg"
                alt="A peaceful and balanced student study space with books and natural daylight"
                className="study-space-photo"
                loading="lazy"
              />
              <div className="study-space-overlay">
                <span className="overlay-badge">Balanced Routine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KEY FEATURES SECTION */}
      <section id="features" className="landing-section features-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">Comprehensive Toolkit</span>
            <h2 className="section-title">Key Platform Features</h2>
          </div>

          <div className="features-cards-grid">
            {/* Feature 1: Sage accent */}
            <div className="feature-card feature-assessment">
              <div className="feature-icon-wrapper green">
                <FiActivity />
              </div>
              <span className="feature-category-tag tag-green">Predictive Model</span>
              <h3 className="feature-card-title">Burnout Assessment</h3>
            </div>

            {/* Feature 2: Slate blue accent */}
            <div className="feature-card feature-dashboard">
              <div className="feature-icon-wrapper blue">
                <FiBarChart2 />
              </div>
              <span className="feature-category-tag tag-blue">Analytics</span>
              <h3 className="feature-card-title">Personal Dashboard</h3>
            </div>

            {/* Feature 3: Warm cream / Sage accent */}
            <div className="feature-card feature-history">
              <div className="feature-icon-wrapper forest">
                <FiList />
              </div>
              <span className="feature-category-tag tag-forest">Longitudinal Log</span>
              <h3 className="feature-card-title">Assessment History</h3>
            </div>
          </div>

          {/* Bottom CTA Banner */}
          <div className="features-bottom-cta">
            <div className="cta-banner-content">
              <h3>Ready to check in with yourself?</h3>
            </div>
            <button
              type="button"
              className="btn-landing-primary"
              onClick={onRegisterClick}
            >
              Start Free Assessment <FiArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="landing-footer">
        <div className="section-container footer-content-wrap">
          <div className="footer-brand-col">
            <div className="footer-brand-logo">
              <FiShield className="footer-logo-icon" />
              <span className="footer-brand-title">Student Wellness System</span>
            </div>
            <p className="footer-mission">
              Proactive mental wellness awareness and data-backed insights for students.
            </p>
          </div>

          <div className="footer-links-col">
            <h5 className="footer-links-heading">Navigation</h5>
            <ul className="footer-nav-list">
              <li><a href="#hero">Home</a></li>
              <li><a href="#about">About & Burnout</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#features">Key Features</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h5 className="footer-links-heading">Portal Access</h5>
            <ul className="footer-nav-list">
              <li>
                <button type="button" className="footer-link-btn" onClick={onLoginClick}>
                  Student Sign In
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={onRegisterClick}>
                  Create Free Account
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="section-container footer-bottom-inner">
            <p>© {new Date().getFullYear()} Student Wellness & Burnout System. Built for student health & academic success.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
