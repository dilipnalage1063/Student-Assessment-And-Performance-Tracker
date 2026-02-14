import React from 'react';
import { GraduationCap, BookOpen, ShieldCheck, Users, LineChart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
    const steps = [
        {
            title: 'Multifaceted Portals',
            desc: 'Dedicated environments for Students, Faculty, and Administrators to streamline educational management.',
            icon: <Users size={24} color="#2563eb" />,
            bg: '#eff6ff'
        },
        {
            title: 'Assessment Tracking',
            desc: 'Real-time monitoring of student performance across various subjects and assessment types.',
            icon: <BookOpen size={24} color="#7c3aed" />,
            bg: '#f5f3ff'
        },
        {
            title: 'Data-Driven Insights',
            desc: 'Generate comprehensive reports and analytics to identify learning gaps and celebrate achievements.',
            icon: <LineChart size={24} color="#f59e0b" />,
            bg: '#fffbeb'
        },
        {
            title: 'Secure & Scalable',
            desc: 'Built with modern security standards to protect institutional data while maintaining high performance.',
            icon: <ShieldCheck size={24} color="#059669" />,
            bg: '#f0fdf4'
        }
    ];

    return (
        <div className="about-page">
            <div className="container about-content fade-in">
                <header className="about-header">
                    <div className="about-logo">
                        <GraduationCap size={48} color="#1e40af" />
                        <span className="logo-text">TRACKER</span>
                    </div>
                    <h1 className="about-title">Project Guide</h1>
                    <p className="about-subtitle">Everything you need to know about the Student Assessment & Performance Tracker.</p>
                </header>

                <section className="about-section">
                    <div className="about-grid">
                        {steps.map((step, index) => (
                            <div key={index} className="about-step-card card-glass">
                                <div className="step-icon" style={{ backgroundColor: step.bg }}>
                                    {step.icon}
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="about-guide card-glass">
                    <h2>How to Use</h2>
                    <div className="guide-steps">
                        <div className="guide-item">
                            <span className="step-num">1</span>
                            <div>
                                <h4>Select Your Role</h4>
                                <p>Start by choosing whether you are a Student, Faculty member, or Administrator on the login page.</p>
                            </div>
                        </div>
                        <div className="guide-item">
                            <span className="step-num">2</span>
                            <div>
                                <h4>Secure Login</h4>
                                <p>Use your institutional credentials to securely access your dedicated dashboard.</p>
                            </div>
                        </div>
                        <div className="guide-item">
                            <span className="step-num">3</span>
                            <div>
                                <h4>Manage & Track</h4>
                                <p>Administer users, record grades, or view performance analytics depending on your access level.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="about-footer">
                    <Link to="/" className="back-home-btn">
                        <ArrowLeft size={18} /> Back to Homepage
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default About;
