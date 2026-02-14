import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
    return (
        <section className="hero">
            <div className="hero-overlay"></div>
            <div className="container hero-content fade-in">
                <h1 className="hero-title">
                    <span className="text-dark">Student Assessment</span><br />
                    <span className="text-gradient">& Performance Tracker</span>
                </h1>
                <p className="hero-subtitle">
                    Empower your institution with data-driven insights. Manage students,<br />
                    assessments, and grades in a seamless environment.
                </p>
                <div className="hero-btns">
                    <Link to="/login" className="btn-primary">Get Started Now</Link>
                    <Link to="/about" className="btn-secondary">Learn More</Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;
