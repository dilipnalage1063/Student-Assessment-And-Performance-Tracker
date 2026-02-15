import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../apiConfig';
import {
    BookOpen,
    PlusCircle,
    ClipboardList,
    TrendingUp,
    ChevronRight,
    GraduationCap,
    LogOut,
    Search,
    Filter,
    Upload,
    FileText,
    Download,
    Edit2,
    Trash2,
    X,
    Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './FacultyDashboard.css';

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const baseUrl = API_BASE_URL;
    const [activeTab, setActiveTab] = useState('subjects');
    const [subjects, setSubjects] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [assessments, setAssessments] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // View Students State
    const [viewingSubject, setViewingSubject] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Marks Entry states
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [studentMarks, setStudentMarks] = useState({}); // { studentId: marks }
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Update/Delete State
    const [editingAssessment, setEditingAssessment] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    // Form states
    const [newAssessment, setNewAssessment] = useState({
        name: '',
        type: 'Theory',
        totalMarks: 100,
        date: new Date().toISOString().split('T')[0],
        subjectId: ''
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            fetchSubjects(storedUser.id);
            fetchAssessments(storedUser.id);
        }
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/users/role/Student`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleEnterMarksClick = async (assessment) => {
        setSelectedAssessment(assessment);
        // Reuse fetchEnrolledStudents logic but set 'students' state for the marks table
        try {
            const response = await fetch(`${baseUrl}/api/subjects/${assessment.subject.id}/students`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Error fetching enrolled students for assessment:', error);
            setStudents([]);
        }
    };

    const handleMarkChange = (studentId, value) => {
        setStudentMarks({
            ...studentMarks,
            [studentId]: value
        });
    };

    const calculatePreviewGrade = (obtained, total) => {
        if (!obtained || !total) return '-';
        const percentage = (obtained / total) * 100;
        if (percentage >= 75) return 'A';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        if (percentage >= 40) return 'D';
        return 'F';
    };

    const saveStudentMark = async (student) => {
        const marksValue = studentMarks[student.id];
        if (!marksValue) return;

        try {
            const response = await fetch(`${baseUrl}/api/marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    obtainedMarks: parseFloat(marksValue),
                    student: { id: student.id },
                    subject: { id: selectedAssessment.subject.id },
                    assessment: { id: selectedAssessment.id }
                }),
            });

            if (response.ok) {
                alert(`Marks saved for ${student.name}`);
                // Clear the input for this student
                const updatedMarks = { ...studentMarks };
                delete updatedMarks[student.id];
                setStudentMarks(updatedMarks);
            }
        } catch (error) {
            console.error('Error saving marks:', error);
        }
    };

    const fetchSubjects = async (facultyId) => {
        try {
            const response = await fetch(`${baseUrl}/api/subjects/faculty/${facultyId}`);
            if (response.ok) {
                const data = await response.json();
                setSubjects(data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssessments = async (facultyId) => {
        try {
            const response = await fetch(`${baseUrl}/api/assessments/faculty/${facultyId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched assessments:', data);
                setAssessments(data);
            } else {
                console.error('Failed to fetch assessments:', response.status);
                // Optionally alert if you want to know about server errors immediately
                // alert('Failed to load assessments. Status: ' + response.status);
            }
        } catch (error) {
            console.error('Error fetching assessments:', error);
            alert('Error loading assessments: ' + error.message);
        }
    };

    const handleFileChange = (e) => {
        setUploadFile(e.target.files[0]);
    };

    const handleBulkUpload = async () => {
        if (!uploadFile || !selectedAssessment) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('assessmentId', selectedAssessment.id);
        formData.append('subjectId', selectedAssessment.subject.id);

        try {
            const response = await fetch(`${baseUrl}/api/marks/bulk-upload`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                let message = `Bulk Upload Complete!\nSuccess: ${result.successCount}\nFailures: ${result.failureCount}`;
                if (result.errors && result.errors.length > 0) {
                    message += `\n\nErrors:\n${result.errors.join('\n')}`;
                }
                alert(message);
                setUploadFile(null);
                // Refresh marks or view
                handleEnterMarksClick(selectedAssessment);
            } else {
                const errorData = await response.json();
                alert(`Upload failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error in bulk upload:', error);
            alert('An error occurred during upload.');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "username,obtainedMarks\nstudent1,85\nstudent2,90";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'marks_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const fetchEnrolledStudents = async (subjectId) => {
        setLoadingStudents(true);
        try {
            const response = await fetch(`${baseUrl}/api/subjects/${subjectId}/students`);
            if (response.ok) {
                const data = await response.json();
                setEnrolledStudents(data);
            }
        } catch (error) {
            console.error('Error fetching enrolled students:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleViewStudents = (subject) => {
        setViewingSubject(subject);
        fetchEnrolledStudents(subject.id);
    };

    const handleCreateAssessment = async (e) => {
        e.preventDefault();
        console.log('Creating assessment...', newAssessment);
        try {
            const body = {
                ...newAssessment,
                faculty: { id: user.id },
                subject: { id: newAssessment.subjectId }
            };
            console.log('Request body:', body);

            const response = await fetch(`${baseUrl}/api/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const savedData = await response.json();
                console.log('Assessment created successfully:', savedData);
                alert('Assessment created successfully!');
                setNewAssessment({ ...newAssessment, name: '', subjectId: '' });
                console.log('Fetching assessments for user:', user.id);
                fetchAssessments(user.id);
                setActiveTab('marks');
            } else {
                console.error('Failed to create assessment', response.status);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
        }
    };

    const handleDeleteAssessment = async (id) => {
        console.log('Attempting to delete assessment:', id);
        try {
            const response = await fetch(`${baseUrl}/api/assessments/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                console.log('Delete successful for ID:', id);
                console.log('Current assessments before filter:', assessments);
                const updatedAssessments = assessments.filter(a => a.id !== id);
                console.log('Updated assessments after filter:', updatedAssessments);
                setAssessments(updatedAssessments);
                setShowDeleteConfirm(null);
            } else {
                console.error('Delete failed with status:', response.status);
                alert('Failed to delete assessment');
            }
        } catch (error) {
            console.error('Error deleting assessment:', error);
            alert('Error deleting assessment');
        }
    };

    const handleUpdateAssessment = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${baseUrl}/api/assessments/${editingAssessment.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingAssessment),
            });

            if (response.ok) {
                const updated = await response.json();
                setAssessments(assessments.map(a => a.id === updated.id ? updated : a));
                setEditingAssessment(null);
                alert('Assessment updated successfully');
            } else {
                alert('Failed to update assessment');
            }
        } catch (error) {
            console.error('Error updating assessment:', error);
            alert('Error updating assessment');
        }
    };

    const sidebarItems = [
        { id: 'subjects', icon: <BookOpen size={20} />, label: 'My Subjects' },
        { id: 'assessments', icon: <PlusCircle size={20} />, label: 'Create Assessment' },
        { id: 'marks', icon: <ClipboardList size={20} />, label: 'Marks Entry' },
        { id: 'reports', icon: <TrendingUp size={20} />, label: 'Performance Reports' }
    ];

    const [performanceData, setPerformanceData] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'reports' && user) {
            fetchFacultyPerformanceData(user.id);
        }
    }, [activeTab, user]);

    const fetchFacultyPerformanceData = async (facultyId) => {
        setReportLoading(true);
        try {
            const response = await fetch(`${baseUrl}/api/marks/faculty/${facultyId}`);
            if (response.ok) {
                const data = await response.json();
                setPerformanceData(data);
            }
        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setReportLoading(false);
        }
    };

    const renderReports = () => {
        if (reportLoading) return <div className="loading-state">Loading performance data...</div>;
        if (performanceData.length === 0) return <div className="empty-state">No performance data available yet.</div>;

        // Grouping data by subject
        const subjectStats = performanceData.reduce((acc, report) => {
            const subjectId = report.subject.id;
            if (!acc[subjectId]) {
                acc[subjectId] = {
                    name: report.subject.name,
                    code: report.subject.code,
                    totalObtained: 0,
                    totalMax: 0,
                    count: 0,
                    passCount: 0
                };
            }
            acc[subjectId].totalObtained += report.obtainedMarks;
            acc[subjectId].totalMax += report.assessment.totalMarks;
            acc[subjectId].count += 1;
            if (report.grade !== 'F') acc[subjectId].passCount += 1;
            return acc;
        }, {});

        // Top Performers calculation
        const studentAverages = performanceData.reduce((acc, report) => {
            const studentId = report.student.id;
            if (!acc[studentId]) {
                acc[studentId] = {
                    name: report.student.name,
                    obtained: 0,
                    max: 0
                };
            }
            acc[studentId].obtained += report.obtainedMarks;
            acc[studentId].max += report.assessment.totalMarks;
            return acc;
        }, {});

        const topPerformers = Object.values(studentAverages)
            .map(s => ({ ...s, percentage: (s.obtained / s.max) * 100 }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);

        return (
            <div className="reports-container fade-in">
                <div className="report-grid">
                    {/* Subject Analysis Section */}
                    <div className="content-card full-width">
                        <div className="card-header">
                            <h2>Subject Performance Analysis</h2>
                        </div>
                        <div className="stats-grid">
                            {Object.values(subjectStats).map(stat => (
                                <div key={stat.code} className="analysis-card">
                                    <div className="analysis-header">
                                        <h3>{stat.name}</h3>
                                        <span className="subject-code">{stat.code}</span>
                                    </div>
                                    <div className="analysis-body">
                                        <div className="analysis-item">
                                            <label>Average Marks</label>
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${(stat.totalObtained / stat.totalMax) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span>{((stat.totalObtained / stat.totalMax) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="analysis-item">
                                            <label>Pass Rate</label>
                                            <div className="pass-rate-indicator">
                                                <div
                                                    className="pass-rate-fill"
                                                    style={{ width: `${(stat.passCount / stat.count) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span>{((stat.passCount / stat.count) * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Students Section */}
                    <div className="content-card">
                        <div className="card-header">
                            <h2>Top Performing Students</h2>
                        </div>
                        <div className="top-students-list">
                            {topPerformers.map((student, index) => (
                                <div key={student.name} className="top-student-item">
                                    <div className="student-rank">{index + 1}</div>
                                    <div className="student-info-mini">
                                        <span className="student-name">{student.name}</span>
                                        <span className="student-score">{student.percentage.toFixed(1)}% Avg</span>
                                    </div>
                                    <TrendingUp size={16} className="trend-icon" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="content-card">
                        <div className="card-header">
                            <h2>Overall Summary</h2>
                        </div>
                        <div className="summary-stats">
                            <div className="summary-item">
                                <span className="stat-label">Total Assessments Graded</span>
                                <span className="stat-value">{performanceData.length}</span>
                            </div>
                            <div className="summary-item">
                                <span className="stat-label">Overall Passing Rate</span>
                                <span className="stat-value">
                                    {((performanceData.filter(r => r.grade !== 'F').length / performanceData.length) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="faculty-layout">
            {/* Mobile Header */}
            <header className="mobile-dashboard-header">
                <div className="mobile-logo">
                    <GraduationCap size={24} />
                    <span>SAPT FACULTY</span>
                </div>
                <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`faculty-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
                <div
                    className="sidebar-brand"
                    onClick={() => navigate('/login')}
                    style={{ cursor: 'pointer' }}
                >
                    <GraduationCap size={32} color="#2563eb" />
                    <span>TRACKER</span>
                </div>

                <nav className="sidebar-nav">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {activeTab === item.id && <ChevronRight size={16} className="active-arrow" />}
                        </button>
                    ))}
                </nav>

                <button className="logout-btn" onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>

            <main className="faculty-content">
                <header className="content-header">
                    <div className="header-info">
                        <h1>Faculty Portal</h1>
                        <p>Welcome back, {user?.name || 'Professor'}</p>
                    </div>
                </header>

                <div className="dashboard-grid">
                    {activeTab === 'subjects' && (
                        <div className="content-card fade-in">
                            <div className="card-header">
                                <h2>Assigned Subjects</h2>
                                <div className="header-actions">
                                    <div className="search-bar">
                                        <Search size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search subjects..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="subjects-list">
                                {(() => {
                                    const filteredSubjects = subjects.filter(s =>
                                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        s.code.toLowerCase().includes(searchQuery.toLowerCase())
                                    );

                                    return filteredSubjects.length > 0 ? filteredSubjects.map(subject => (
                                        <div key={subject.id} className="subject-card">
                                            <div className="subject-info">
                                                <h3>{subject.name}</h3>
                                                <span>{subject.code} • {subject.semester} Semester</span>
                                            </div>
                                            <button
                                                className="view-details-btn"
                                                onClick={() => handleViewStudents(subject)}
                                            >
                                                View Students
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="empty-state">
                                            <p>{searchQuery ? `No subjects matching "${searchQuery}"` : "No subjects assigned yet."}</p>
                                        </div>
                                    );
                                })()}
                            </div>

                            {viewingSubject && (
                                <div className="modal-overlay">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h3>Students in {viewingSubject.name}</h3>
                                            <button className="close-btn" onClick={() => setViewingSubject(null)}>×</button>
                                        </div>
                                        <div className="student-list-modal">
                                            {loadingStudents ? (
                                                <p>Loading students...</p>
                                            ) : enrolledStudents.length > 0 ? (
                                                <table className="user-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Name</th>
                                                            <th>Username</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {enrolledStudents.map(student => (
                                                            <tr key={student.id}>
                                                                <td>{student.name}</td>
                                                                <td>{student.username}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="placeholder-text">No students enrolled in this subject.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'assessments' && (
                        <div className="content-card fade-in">
                            <div className="card-header">
                                <h2>Create New Assessment</h2>
                            </div>
                            <form className="assessment-form" onSubmit={handleCreateAssessment}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Assessment Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Unit Test 1"
                                            required
                                            value={newAssessment.name}
                                            onChange={(e) => setNewAssessment({ ...newAssessment, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Subject</label>
                                        <select
                                            required
                                            value={newAssessment.subjectId}
                                            onChange={(e) => setNewAssessment({ ...newAssessment, subjectId: e.target.value })}
                                        >
                                            <option value="">Select a subject</option>
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select
                                            value={newAssessment.type}
                                            onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })}
                                        >
                                            <option value="Theory">Theory</option>
                                            <option value="Practical">Practical</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Total Marks</label>
                                        <input
                                            type="number"
                                            required
                                            value={newAssessment.totalMarks}
                                            onChange={(e) => setNewAssessment({ ...newAssessment, totalMarks: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={newAssessment.date}
                                            onChange={(e) => setNewAssessment({ ...newAssessment, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="submit-assessment-btn">Create Assessment</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'marks' && (
                        <div className="content-card fade-in">
                            <div className="card-header">
                                <h2>Marks Entry</h2>
                                {!selectedAssessment ? (
                                    <p>Select an assessment to enter marks for students.</p>
                                ) : (
                                    <div className="assessment-details-bar">
                                        <button className="back-btn" onClick={() => setSelectedAssessment(null)}>
                                            <ChevronRight style={{ transform: 'rotate(180deg)' }} /> Back
                                        </button>
                                        <div className="mini-info">
                                            <strong>{selectedAssessment.name}</strong>
                                            <span>{selectedAssessment.subject?.name} • Max: {selectedAssessment.totalMarks}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!selectedAssessment ? (
                                <div className="assessment-selector-grid">
                                    {assessments.length > 0 ? assessments.map(a => (
                                        <div key={a.id} className="assessment-mini-card">
                                            <h3>{a.name}</h3>
                                            <p>{a.subject?.name}</p>
                                            <button className="enter-marks-btn" onClick={() => handleEnterMarksClick(a)}>
                                                Enter Marks
                                            </button>
                                            <div className="card-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                                                <button
                                                    className="icon-btn edit-btn"
                                                    onClick={(e) => { e.stopPropagation(); setEditingAssessment(a); }}
                                                    title="Edit"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="icon-btn delete-btn"
                                                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(a.id); }}
                                                    title="Delete"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state">
                                            <p>No assessments created yet. Create one from the 'Create Assessment' tab.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="marks-entry-container">
                                    <div className="csv-upload-section">
                                        <div className="bulk-upload-tip">
                                            <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                            <strong>Bulk Upload:</strong> Prefer automation? Upload a CSV file with student marks.
                                            <span className="template-link" onClick={downloadTemplate} style={{ marginLeft: '10px' }}>
                                                <Download size={14} style={{ verticalAlign: 'middle' }} /> Download Template
                                            </span>
                                        </div>
                                        <div className="upload-actions">
                                            <label htmlFor="csv-upload" className="csv-label">
                                                {uploadFile ? uploadFile.name : 'Choose CSV File'}
                                            </label>
                                            <input
                                                id="csv-upload"
                                                type="file"
                                                accept=".csv"
                                                className="csv-input"
                                                onChange={handleFileChange}
                                            />
                                            <button
                                                className="upload-btn"
                                                onClick={handleBulkUpload}
                                                disabled={!uploadFile || uploading}
                                            >
                                                {uploading ? 'Uploading...' : 'Upload & Notify'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="marks-entry-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Student Name</th>
                                                    <th>Username</th>
                                                    <th>Obtained Marks</th>
                                                    <th>Grade (Auto)</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map(student => {
                                                    const currentMark = studentMarks[student.id] || '';
                                                    return (
                                                        <tr key={student.id}>
                                                            <td>{student.name}</td>
                                                            <td>{student.username}</td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    max={selectedAssessment.totalMarks}
                                                                    value={currentMark}
                                                                    onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                                    placeholder={`Max ${selectedAssessment.totalMarks}`}
                                                                />
                                                            </td>
                                                            <td>
                                                                <span className={`grade-tag ${calculatePreviewGrade(currentMark, selectedAssessment.totalMarks).toLowerCase()}`}>
                                                                    {calculatePreviewGrade(currentMark, selectedAssessment.totalMarks)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="save-mark-btn"
                                                                    onClick={() => saveStudentMark(student)}
                                                                    disabled={!currentMark}
                                                                >
                                                                    Save
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {/* Edit Assessment Modal */}
                            {editingAssessment && (
                                <div className="modal-overlay">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h3>Edit Assessment</h3>
                                            <button className="close-btn" onClick={() => setEditingAssessment(null)}><X size={20} /></button>
                                        </div>
                                        <form onSubmit={handleUpdateAssessment} className="assessment-form">
                                            <div className="form-group">
                                                <label>Assessment Name</label>
                                                <input
                                                    type="text"
                                                    value={editingAssessment.name}
                                                    onChange={(e) => setEditingAssessment({ ...editingAssessment, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Total Marks</label>
                                                <input
                                                    type="number"
                                                    value={editingAssessment.totalMarks}
                                                    onChange={(e) => setEditingAssessment({ ...editingAssessment, totalMarks: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Date</label>
                                                <input
                                                    type="date"
                                                    value={editingAssessment.date}
                                                    onChange={(e) => setEditingAssessment({ ...editingAssessment, date: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <button type="submit" className="submit-assessment-btn" style={{ marginTop: '1rem', width: '100%' }}>Update Assessment</button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Delete Confirmation Modal */}
                            {showDeleteConfirm && (
                                <div className="modal-overlay">
                                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                                        <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Delete Assessment?</h3>
                                        <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>Are you sure you want to delete this assessment? This action cannot be undone.</p>
                                        <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                            <button
                                                className="cancel-btn"
                                                onClick={() => setShowDeleteConfirm(null)}
                                                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', fontWeight: '500' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="delete-confirm-btn"
                                                onClick={() => handleDeleteAssessment(showDeleteConfirm)}
                                                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reports' && renderReports()}
                </div>
            </main>
        </div>
    );
};

export default FacultyDashboard;
