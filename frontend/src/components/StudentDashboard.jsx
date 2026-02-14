import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    BarChart3,
    Calendar,
    User,
    LogOut,
    GraduationCap,
    Award,
    TrendingUp,
    BookOpen,
    ArrowLeft,
    FileText,
    Clock,
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, endpoints } from '../apiConfig';

import './StudentDashboard.css';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const baseUrl = API_BASE_URL;
    const [user, setUser] = useState(null);
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        avgGrade: '-',
        overallTrend: '-',
        totalObtained: 0,
        totalPossible: 0,
        examCount: 0
    });
    const [targetGrade, setTargetGrade] = useState('A');
    const [predictorSubjectId, setPredictorSubjectId] = useState('overall');

    // Classroom States
    const [activeTab, setActiveTab] = useState('overview');
    const [enrolledSubjects, setEnrolledSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjectAssessments, setSubjectAssessments] = useState([]);

    // Profile States
    const [editMode, setEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        parentsEmail: '',
        parentsMobile: ''
    });
    const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            fetchMarks(storedUser.id);
            fetchEnrolledSubjects(storedUser.id);
            setProfileForm({
                name: storedUser.name || '',
                email: storedUser.email || '',
                parentsEmail: storedUser.parentsEmail || '',
                parentsMobile: storedUser.parentsMobile || ''
            });
        }
    }, []);

    const fetchMarks = async (studentId) => {
        try {
            const response = await fetch(`${baseUrl}/api/marks/student/${studentId}`);
            if (response.ok) {
                const data = await response.json();
                setMarks(data);
                calculateStats(data);
            }
        } catch (error) {
            console.error('Error fetching marks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrolledSubjects = async (studentId) => {
        try {
            const response = await fetch(`${baseUrl}/api/subjects/student/${studentId}`);
            if (response.ok) {
                const data = await response.json();
                setEnrolledSubjects(data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchSubjectAssessments = async (subjectId) => {
        try {
            const response = await fetch(`${baseUrl}/api/assessments/subject/${subjectId}`);
            if (response.ok) {
                const data = await response.json();
                setSubjectAssessments(data);
            }
        } catch (error) {
            console.error('Error fetching assessments:', error);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setProfileStatus({ type: '', message: '' });

        try {
            const response = await fetch(`${baseUrl}/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...user,
                    name: profileForm.name,
                    email: profileForm.email,
                    parentsEmail: profileForm.parentsEmail,
                    parentsMobile: profileForm.parentsMobile
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setEditMode(false);
                setProfileStatus({ type: 'success', message: 'Profile updated successfully!' });

                // Clear success message after 3 seconds
                setTimeout(() => setProfileStatus({ type: '', message: '' }), 3000);
            } else {
                setProfileStatus({ type: 'error', message: 'Failed to update profile. Please try again.' });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setProfileStatus({ type: 'error', message: 'An error occurred. Check your connection.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
        fetchSubjectAssessments(subject.id);
    };

    const handleDownloadReport = async () => {
        if (!user) return;
        try {
            const response = await fetch(endpoints.report(user.id));
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }
            const blobFile = await response.blob();
            const url = window.URL.createObjectURL(blobFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Student_Report_${user.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert(`Failed to download report: ${error.message}`);
        }
    };

    const calculateStats = (marksList) => {
        if (marksList.length === 0) return;
        const sortedMarks = [...marksList].sort((a, b) => b.id - a.id);
        const latest = sortedMarks[0];

        const totalObtained = marksList.reduce((sum, m) => sum + m.obtainedMarks, 0);
        const totalPossible = marksList.reduce((sum, m) => sum + (m.assessment?.totalMarks || 100), 0);

        setStats({
            avgGrade: latest.grade,
            overallTrend: latest.status,
            totalObtained,
            totalPossible,
            examCount: marksList.length
        });
    };

    const calculateRequiredScore = () => {
        if (stats.examCount === 0) return null;

        const thresholds = { 'A': 75, 'B': 60, 'C': 50 };
        const targetPercent = thresholds[targetGrade] / 100;

        // Filter marks if a specific subject is selected
        const relevantMarks = predictorSubjectId === 'overall'
            ? marks
            : marks.filter(m => m.subject?.id === parseInt(predictorSubjectId));

        if (relevantMarks.length === 0) return "No data for this subject";

        const currentObtained = relevantMarks.reduce((sum, m) => sum + m.obtainedMarks, 0);
        const currentPossible = relevantMarks.reduce((sum, m) => sum + (m.assessment?.totalMarks || 100), 0);

        const nextMax = 100;
        const required = (targetPercent * (currentPossible + nextMax)) - currentObtained;

        if (required > nextMax) return "Impossible this time";
        if (required <= 0) return "Already achieved!";
        return Math.ceil(required);
    };

    const renderOverview = () => (
        <>
            <header className="content-header">
                <div className="header-info">
                    <h1>Student Portal</h1>
                    <p>Welcome back, {user?.name || 'Student'}</p>
                </div>
                <button className="download-report-btn" onClick={handleDownloadReport}>
                    <FileText size={18} /> Download Academic Report [v2.0 Fixed]
                </button>
            </header>

            <div className="student-stats">
                <div className="stat-card">
                    <div className="stat-icon purple"><Award size={24} /></div>
                    <div className="stat-details">
                        <h3>Current Grade</h3>
                        <p>{stats.avgGrade}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><TrendingUp size={24} /></div>
                    <div className="stat-details">
                        <h3>Performance</h3>
                        <p>{stats.overallTrend}</p>
                    </div>
                </div>
                <div className="stat-card goal-planner">
                    <div className="stat-details">
                        <h3>Target Score Calculator</h3>
                        <div className="goal-controls">
                            <div className="control-group">
                                <label>Target Grade:</label>
                                <select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)}>
                                    <option value="A">Grade A (75%+)</option>
                                    <option value="B">Grade B (60%+)</option>
                                    <option value="C">Grade C (50%+)</option>
                                </select>
                            </div>
                            <div className="control-group">
                                <label>Subject:</label>
                                <select value={predictorSubjectId} onChange={(e) => setPredictorSubjectId(e.target.value)}>
                                    <option value="overall">Overall Average</option>
                                    {enrolledSubjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="goal-result">
                            <span className="label">Next Exam Needed:</span>
                            <span className="value">
                                {calculateRequiredScore() === null ? 'N/A' :
                                    typeof calculateRequiredScore() === 'string' ? calculateRequiredScore() :
                                        `${calculateRequiredScore()} / 100`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-card">
                <div className="card-header">
                    <h2>Academic Performance by Subject</h2>
                </div>
                <div className="subject-groups">
                    {loading ? <p>Loading marks...</p> : (
                        marks.length > 0 ? (() => {
                            // Group marks by subject
                            const groupedMarks = marks.reduce((acc, mark) => {
                                const subjectName = mark.subject?.name || 'Unknown';
                                if (!acc[subjectName]) acc[subjectName] = [];
                                acc[subjectName].push(mark);
                                return acc;
                            }, {});

                            return Object.entries(groupedMarks).map(([subjectName, subjectMarks]) => (
                                <div key={subjectName} className="subject-marks-section">
                                    <div className="subject-section-header">
                                        <BookOpen size={18} />
                                        <h3>{subjectName}</h3>
                                    </div>
                                    <div className="marks-table-container">
                                        <table className="student-marks-table">
                                            <thead>
                                                <tr>
                                                    <th>Assessment</th>
                                                    <th>Marks</th>
                                                    <th>Grade</th>
                                                    <th>Trend</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subjectMarks.map(mark => (
                                                    <tr key={mark.id}>
                                                        <td>{mark.assessment?.name}</td>
                                                        <td>{mark.obtainedMarks} / {mark.assessment?.totalMarks}</td>
                                                        <td><span className={`grade-badge ${mark.grade.toLowerCase()}`}>{mark.grade}</span></td>
                                                        <td><span className={`status-badge ${mark.status.toLowerCase()}`}>{mark.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ));
                        })() : (
                            <p className="placeholder-text">No marks records found yet.</p>
                        )
                    )}
                </div>
            </div>
        </>
    );

    const renderClassroom = () => (
        <>
            <header className="content-header">
                <div className="header-info">
                    <h1>My Classroom</h1>
                    <p>Access your enrolled subjects and assignments.</p>
                </div>
            </header>

            {selectedSubject ? (
                <div className="stream-container fade-in">
                    <button className="back-btn" onClick={() => setSelectedSubject(null)}>
                        <ArrowLeft size={18} /> Back to Classroom
                    </button>

                    <div className="stream-header">
                        <h2>{selectedSubject.name}</h2>
                        <div className="stream-info">
                            <p>{selectedSubject.code} • {selectedSubject.year} Year</p>
                            <p>Faculty: {selectedSubject.faculty?.name || 'TBA'}</p>
                        </div>
                    </div>

                    <div className="assessment-stream">
                        <h3 style={{ marginBottom: '1rem', color: '#64748b' }}>Classwork Stream</h3>
                        {subjectAssessments.length > 0 ? (
                            subjectAssessments.map(assessment => (
                                <div key={assessment.id} className="assessment-post">
                                    <div className="post-icon">
                                        <FileText size={20} />
                                    </div>
                                    <div className="post-content">
                                        <div className="post-title">{assessment.name}</div>
                                        <div className="post-meta">
                                            <div className="meta-item">
                                                <Clock size={14} />
                                                Due: {assessment.date}
                                            </div>
                                            <div className="meta-item">
                                                <Award size={14} />
                                                {assessment.totalMarks} Points
                                            </div>
                                        </div>
                                        <div className="post-type badge-gray">{assessment.type}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="placeholder-text">No assessments posted yet.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="classroom-grid">
                    {enrolledSubjects.map(subject => (
                        <div key={subject.id} className="subject-card" onClick={() => handleSubjectClick(subject)}>
                            <div className="subject-banner">
                                <h3>{subject.name}</h3>
                                <p>{subject.code}</p>
                            </div>
                            <div className="subject-faculty">
                                <User size={16} />
                                {subject.faculty?.name || 'Unassigned'}
                            </div>
                            <div className="subject-actions">
                                <span className="btn-open">Open Stream</span>
                            </div>
                        </div>
                    ))}
                    {enrolledSubjects.length === 0 && (
                        <p className="placeholder-text">You are not enrolled in any subjects yet.</p>
                    )}
                </div>
            )}
        </>
    );

    const renderMyMarks = () => (
        <>
            <header className="content-header">
                <div className="header-info">
                    <h1>My Performance</h1>
                    <p>Detailed breakdown of your academic assessments.</p>
                </div>
            </header>

            <div className="content-card fade-in">
                <div className="card-header flex justify-between items-center">
                    <h2>Academic Record</h2>
                    <button
                        onClick={() => {
                            if (user?.id) {
                                handleDownloadReport();
                            }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <Download size={16} />
                        Download Report (PDF) [v2.0 Fixed]
                    </button>
                </div>
                <div className="marks-table-container">
                    {loading ? (
                        <div className="loading-state">
                            <Clock className="animate-spin" size={24} />
                            <p>Loading your academic records...</p>
                        </div>
                    ) : marks.length > 0 ? (
                        <table className="student-marks-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Assessment</th>
                                    <th>Marks Obtained</th>
                                    <th>Max Marks</th>
                                    <th>Grade</th>
                                    <th>Comparison</th>
                                </tr>
                            </thead>
                            <tbody>
                                {marks.map(mark => (
                                    <tr key={mark.id}>
                                        <td className="font-semibold">{mark.subject?.name}</td>
                                        <td>{mark.assessment?.name}</td>
                                        <td className="marks-cell">{mark.obtainedMarks}</td>
                                        <td>{mark.assessment?.totalMarks}</td>
                                        <td>
                                            <span className={`grade-badge ${mark.grade.toLowerCase()}`}>
                                                {mark.grade}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${mark.status.toLowerCase()}`}>
                                                {mark.status === 'Improved' && '↑ '}
                                                {mark.status === 'Declined' && '↓ '}
                                                {mark.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <Award size={48} color="#cbd5e1" />
                            <p>No marks recorded yet. Keep up the hard work!</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const renderProfile = () => (
        <>
            <header className="content-header">
                <div className="header-info">
                    <h1>My Profile</h1>
                    <p>Manage your account settings and personal information.</p>
                </div>
            </header>

            <div className="profile-container fade-in">
                <div className="profile-grid">
                    <div className="profile-card info-section">
                        <div className="avatar-section">
                            <div className="avatar-circle">
                                {user?.name?.charAt(0) || 'S'}
                            </div>
                            <h2>{user?.name}</h2>
                            <span className="role-tag">{user?.role}</span>
                        </div>
                        <div className="profile-details-list">
                            <div className="detail-item">
                                <label>Username</label>
                                <span>{user?.username}</span>
                            </div>
                            <div className="detail-item">
                                <label>Department</label>
                                <span>{user?.department}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card edit-section">
                        <div className="card-header-flex">
                            <h2>Personal Details</h2>
                            {!editMode && (
                                <button className="edit-toggle-btn" onClick={() => setEditMode(true)}>
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {profileStatus.message && (
                            <div className={`alert-toast ${profileStatus.type}`}>
                                {profileStatus.message}
                            </div>
                        )}

                        <form onSubmit={handleProfileUpdate} className="profile-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    disabled={!editMode}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                    disabled={!editMode}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Parent's Email</label>
                                <input
                                    type="email"
                                    value={profileForm.parentsEmail}
                                    onChange={(e) => setProfileForm({ ...profileForm, parentsEmail: e.target.value })}
                                    disabled={!editMode}
                                    placeholder="Enter parent's email for notifications"
                                />
                            </div>
                            <div className="form-group">
                                <label>Parent's Mobile</label>
                                <input
                                    type="text"
                                    value={profileForm.parentsMobile}
                                    onChange={(e) => setProfileForm({ ...profileForm, parentsMobile: e.target.value })}
                                    disabled={!editMode}
                                    placeholder="Enter parent's mobile for SMS"
                                />
                            </div>

                            {editMode && (
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setEditMode(false);
                                        setProfileForm({
                                            name: user.name,
                                            email: user.email,
                                            parentsEmail: user.parentsEmail,
                                            parentsMobile: user.parentsMobile
                                        });
                                    }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-btn" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="student-layout">
            <aside className="student-sidebar">
                <div
                    className="sidebar-brand"
                    onClick={() => navigate('/login')}
                    style={{ cursor: 'pointer' }}
                >
                    <GraduationCap size={32} color="#1e40af" />
                    <span>TRACKER</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'classroom' ? 'active' : ''}`}
                        onClick={() => setActiveTab('classroom')}
                    >
                        <BookOpen size={20} />
                        <span>Classroom</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'marks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('marks')}
                    >
                        <BarChart3 size={20} />
                        <span>My Marks</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={20} />
                        <span>Profile</span>
                    </button>
                </nav>

                <button className="logout-btn" onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>

            <main className="student-content fade-in">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'classroom' && renderClassroom()}
                {activeTab === 'marks' && renderMyMarks()}
                {activeTab === 'profile' && renderProfile()}
            </main>
        </div>
    );
};

export default StudentDashboard;
