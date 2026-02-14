import { Link } from 'react-router-dom';
import { UserPlus, CheckCircle2, Activity, ArrowRight } from 'lucide-react';
import './Ecosystem.css';

const Ecosystem = () => {
    const cards = [
        {
            title: 'Administrator',
            description: 'Oversee departments, manage faculty and students, and generate system-wide reports.',
            icon: <UserPlus size={24} color="#2563eb" />,
            iconBg: '#eff6ff',
            linkText: 'Explore Admin Portal',
            role: 'Admin'
        },
        {
            title: 'Faculty',
            description: 'Design assessments, record grades, and monitor student performance trends in real-time.',
            icon: <CheckCircle2 size={24} color="#7c3aed" />,
            iconBg: '#f5f3ff',
            linkText: 'Go to Faculty Suite',
            role: 'Faculty'
        },
        {
            title: 'Student',
            description: 'Track your progress, view assessment results, and access personalized performance analytics.',
            icon: <Activity size={24} color="#f59e0b" />,
            iconBg: '#fffbeb',
            linkText: 'Enter Student Portal',
            role: 'Student'
        }
    ];

    return (
        <section id="features" className="ecosystem">
            <div className="container">
                <div className="ecosystem-header fade-in">
                    <h2 className="ecosystem-title">Our Ecosystem</h2>
                    <p className="ecosystem-subtitle">Tailored experiences for every role in the institution.</p>
                </div>

                <div className="ecosystem-grid">
                    {cards.map((card, index) => (
                        <Link
                            to="/login"
                            state={{ role: card.role }}
                            key={index}
                            className="ecosystem-card card-glass fade-in"
                            style={{ animationDelay: `${index * 0.1}s`, textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="card-icon-container" style={{ backgroundColor: card.iconBg }}>
                                {card.icon}
                            </div>
                            <h3 className="card-title">{card.title}</h3>
                            <p className="card-desc">{card.description}</p>
                            <span className="card-link">
                                {card.linkText} <ArrowRight size={16} />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Ecosystem;
