import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

import './Navbar.css';

const Navbar = () => {
  const scrollToFeatures = (e) => {
    e.preventDefault();
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navbar glass">
      <div className="container nav-content">
        <Link to="/" className="logo">
          <GraduationCap className="logo-icon" size={32} color="#1e40af" />
          <span className="logo-text">TRACKER</span>
        </Link>

        <div className="nav-links">
          <a href="#features" onClick={scrollToFeatures} className="nav-link">Features</a>
          <Link to="/login" className="btn-signin">Sign In</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
