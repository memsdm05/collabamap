import React from 'react';
import './index.css';

interface FeatureProps {
  title: string;
  description: string;
  icon: string;
}

const Feature: React.FC<FeatureProps> = ({ title, description, icon }) => {
  return (
    <div className="feature">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export const HomePage: React.FC = () => {
  return (
    <div className="home-container">
      <header className="hero">
        <div className="hero-content">
          <h1>Welcome to Our Website</h1>
          <p className="subtitle">A modern solution for your digital needs</p>
          <div className="cta-buttons">
            <button className="primary-button">Get Started</button>
            <button className="secondary-button">Learn More</button>
          </div>
        </div>
      </header>

      <section className="features-section">
        <h2>Our Features</h2>
        <div className="features-grid">
          <Feature 
            title="Responsive Design" 
            description="Our layouts work perfectly on any device size or screen resolution."
            icon="📱"
          />
          <Feature 
            title="Fast Performance" 
            description="Optimized for speed to provide the best user experience possible."
            icon="⚡"
          />
          <Feature 
            title="Secure Platform" 
            description="Your data is protected with industry-leading security protocols."
            icon="🔒"
          />
        </div>
      </section>

      <section className="about-section">
        <h2>About Us</h2>
        <p>
          We're a dedicated team of professionals committed to delivering exceptional 
          digital experiences. Our mission is to help businesses thrive in the 
          digital landscape through innovative solutions.
        </p>
        <button className="text-button">Read our story</button>
      </section>

      <section className="contact-section">
        <h2>Get In Touch</h2>
        <div className="contact-form">
          <div className="form-group">
            <input type="text" placeholder="Your Name" className="form-control" />
          </div>
          <div className="form-group">
            <input type="email" placeholder="Your Email" className="form-control" />
          </div>
          <div className="form-group">
            <textarea placeholder="Your Message" className="form-control" rows={4}></textarea>
          </div>
          <button className="primary-button">Send Message</button>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">YourBrand</div>
          <div className="footer-links">
            <a href="#">Home</a>
            <a href="#">Features</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Privacy</a>
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} YourBrand. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;