import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../apiConfig';
import {
    GraduationCap,
    LayoutDashboard,
    Users,
    Building2,
    Settings,
    LogOut,
    CheckCircle2,
    AlertTriangle,
    Pencil,
    Trash2,
    Plus,
    Calendar,
    Upload,
    FileText,
    Download,
    Menu,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjectStudents, setSubjectStudents] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // User Modal state
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        name: '',
        role: '',
        department: '-',
        email: '',
        parentsEmail: '',
        username: '',
        password: ''
    });

    // Subject Modal state
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [subjectFormData, setSubjectFormData] = useState({
        name: '',
        code: '',
        year: '2024',
        facultyId: ''
    });

    // Settings state
    const [settingsFormData, setSettingsFormData] = useState(() => {
        const saved = localStorage.getItem('adminSettings');
        return saved ? JSON.parse(saved) : {
            schoolName: 'CDAC Infoway',
            website: 'www.cdacinfoway.com',
            academicYear: '2025-26',
            currentSemester: 'Batch-A' // Default to a batch name
        };
    });

    // Dynamic Activities state
    const [systemActivities, setSystemActivities] = useState([]);

    const fetchActivities = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/activities`);
            if (response.ok) {
                const data = await response.json();
                setSystemActivities(data.map(a => ({
                    title: a.title,
                    desc: a.description,
                    status: a.status,
                    timestamp: a.timestamp
                })));
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const baseUrl = API_BASE_URL;
    const API_URL = `${baseUrl}/api/users`;
    const SUBJECT_API_URL = `${baseUrl}/api/subjects`;

    const stompClientRef = useRef(null);

    useEffect(() => {
        fetchUsers();
        fetchSubjects();
        fetchActivities();

        // WebSocket Setup
        const socket = new SockJS(`${baseUrl}/ws-activity`);
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log('Connected to WebSocket');
                client.subscribe('/topic/activities', (message) => {
                    const newActivity = JSON.parse(message.body);
                    setSystemActivities(prev => [
                        {
                            title: newActivity.title,
                            desc: newActivity.description,
                            status: newActivity.status,
                            timestamp: newActivity.timestamp
                        },
                        ...prev.slice(0, 9) // Keep last 10
                    ]);
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error', frame.headers['message']);
            }
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, []);

    useEffect(() => {
        const filteredFaculties = users.filter(user => user.role && user.role.toLowerCase() === 'faculty');
        setFaculties(filteredFaculties);

        const filteredStudents = users.filter(user => user.role && user.role.toLowerCase() === 'student');
        setStudents(filteredStudents);
    }, [users]);

    useEffect(() => {
        if (selectedSubjectId) {
            fetchSubjectStudents(selectedSubjectId);
        } else {
            setSubjectStudents([]);
        }
    }, [selectedSubjectId]);

    const fetchUsers = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await fetch(SUBJECT_API_URL);
            if (response.ok) {
                const data = await response.json();
                setSubjects(data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchSubjectStudents = async (subjectId) => {
        try {
            const response = await fetch(`${SUBJECT_API_URL}/${subjectId}/students`);
            if (response.ok) {
                const data = await response.json();
                setSubjectStudents(data);
            }
        } catch (error) {
            console.error('Error fetching subject students:', error);
        }
    };

    const handleLogout = () => {
        navigate('/');
    };

    const handleUserInputChange = (e) => {
        setUserFormData({ ...userFormData, [e.target.name]: e.target.value });
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const method = editingUser ? 'PUT' : 'POST';
        const url = editingUser ? `${API_URL}/${editingUser.id}` : API_URL;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userFormData)
            });

            if (response.ok) {
                alert('User saved successfully!');
                setShowUserModal(false);
                setEditingUser(null);
                setUserFormData({ name: '', role: 'Student', department: '-', email: '', parentsEmail: '', parentsMobile: '', username: '', password: '' });
                fetchUsers();
                fetchActivities();
            } else {
                const errorText = await response.text();
                alert('Failed to save user: ' + errorText);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user: ' + error.message);
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    const deletedUser = users.find(u => u.id === id);
                    fetchUsers();
                    fetchActivities();
                }
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const handleSubjectInputChange = (e) => {
        setSubjectFormData({ ...subjectFormData, [e.target.name]: e.target.value });
    };

    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        const method = editingSubject ? 'PUT' : 'POST';
        const url = editingSubject ? `${SUBJECT_API_URL}/${editingSubject.id}` : SUBJECT_API_URL;

        const payload = {
            name: subjectFormData.name,
            code: subjectFormData.code,
            year: subjectFormData.year,
            semester: subjectFormData.semester,
            faculty: subjectFormData.facultyId ? { id: parseInt(subjectFormData.facultyId) } : null
        };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Subject saved successfully!');
                setShowSubjectModal(false);
                setEditingSubject(null);
                setSubjectFormData({ name: '', code: '', year: '2024', semester: '1st', facultyId: '' });
                fetchSubjects();
                fetchActivities();
            } else {
                const errorText = await response.text();
                alert('Failed to save subject: ' + errorText);
            }
        } catch (error) {
            console.error('Error saving subject:', error);
            alert('Error saving subject: ' + error.message);
        }
    };

    const handleEnrollStudent = async (studentId) => {
        if (!selectedSubjectId) return;
        try {
            const response = await fetch(`${SUBJECT_API_URL}/${selectedSubjectId}/students/${studentId}`, {
                method: 'POST'
            });
            if (response.ok) {
                fetchSubjectStudents(selectedSubjectId);
            }
        } catch (error) {
            console.error('Error enrolling student:', error);
        }
    };

    const handleUnenrollStudent = async (studentId) => {
        if (!selectedSubjectId) return;
        try {
            const response = await fetch(`${SUBJECT_API_URL}/${selectedSubjectId}/students/${studentId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchSubjectStudents(selectedSubjectId);
            }
        } catch (error) {
            console.error('Error unenrolling student:', error);
        }
    };

    const handleFileChange = (e) => {
        setUploadFile(e.target.files[0]);
    };

    const handleUserBulkUpload = async () => {
        if (!uploadFile) {
            alert('Please select a CSV file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadFile);

        setUploading(true);
        try {
            const response = await fetch(`${API_URL}/bulk-upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert(`Bulk upload successful!\nSuccess: ${result.successCount}\nFailures: ${result.failureCount}`);
                setUploadFile(null);
                fetchUsers();
                fetchActivities();
            } else {
                alert('Upload failed: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error during bulk upload:', error);
            alert('Error during bulk upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEnrollBulkUpload = async () => {
        if (!uploadFile || !selectedSubjectId) {
            alert('Please select a CSV file and a subject.');
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadFile);

        setUploading(true);
        try {
            const response = await fetch(`${SUBJECT_API_URL}/${selectedSubjectId}/enroll-bulk`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert(`Bulk enrollment successful!\nSuccess: ${result.successCount}\nFailures: ${result.failureCount}`);
                setUploadFile(null);
                fetchSubjectStudents(selectedSubjectId);
                fetchActivities();
            } else {
                alert('Upload failed: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error during bulk enrollment:', error);
            alert('Error during bulk enrollment: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const downloadUserTemplate = () => {
        const headers = "name,role,department,email,parentsEmail,parentsMobile,username,password";
        let csvContent = "data:text/csv;charset=utf-8," + headers + "\n";

        // Use real data if available
        if (users && users.length > 0) {
            users.forEach(u => {
                const row = [
                    u.name,
                    u.role,
                    u.department || '-',
                    u.email,
                    u.parentsEmail || '-',
                    u.parentsMobile || '-',
                    u.username,
                    '******' // Obfuscate password for privacy
                ].join(",");
                csvContent += row + "\n";
            });
        } else {
            csvContent += "John Doe,Student,Science,john@example.com,parent@example.com,9876543210,johndoe,pass123";
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "user_data_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadEnrollTemplate = () => {
        const headers = "username";
        const sampleData = "johndoe\njanedoe";
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleData;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "enrollment_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteSubject = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                const response = await fetch(`${SUBJECT_API_URL}/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    fetchSubjects();
                }
            } catch (error) {
                console.error('Error deleting subject:', error);
            }
        }
    };

    const openAddUserModal = () => {
        setEditingUser(null);
        setUserFormData({ name: '', role: '', department: '-', email: '', parentsEmail: '', parentsMobile: '', username: '', password: '' });
        setShowUserModal(true);
    };

    const openEditUserModal = (user) => {
        setEditingUser(user);
        setUserFormData({
            name: user.name,
            role: user.role,
            department: user.department,
            email: user.email,
            parentsEmail: user.parentsEmail || '',
            parentsMobile: user.parentsMobile || '',
            username: user.username,
            password: ''
        });
        setShowUserModal(true);
    };

    const openAddSubjectModal = () => {
        setEditingSubject(null);
        setSubjectFormData({ name: '', code: '', year: '2024', facultyId: '' });
        setShowSubjectModal(true);
    };

    const openEditSubjectModal = (subject) => {
        setEditingSubject(subject);
        setSubjectFormData({
            name: subject.name,
            code: subject.code,
            year: subject.year,
            facultyId: subject.faculty ? subject.faculty.id.toString() : ''
        });
        setShowSubjectModal(true);
    };

    const departmentsCount = [...new Set(users.map(u => u.department).filter(d => d && d !== '-'))].length;

    const stats = [
        { label: 'Total Users', value: users.length },
        { label: 'Departments', value: departmentsCount || 4 },
        { label: 'Total Subjects', value: subjects.length },
        { label: 'Uptime', value: '99.9%' },
    ];

    const activities = systemActivities;

    const handleSettingsChange = (e) => {
        setSettingsFormData({ ...settingsFormData, [e.target.name]: e.target.value });
    };

    const handleSettingsSubmit = (e) => {
        e.preventDefault();
        localStorage.setItem('adminSettings', JSON.stringify(settingsFormData));
        alert('Settings saved successfully!');
        addActivity('Settings Updated', 'Institution configuration has been modified', 'success');
    };

    const renderSettings = () => (
        <>
            <header className="content-header">
                <h1>System Settings</h1>
                <p>Configure institution-wide parameters and security.</p>
            </header>

            <div className="settings-container fade-in">
                <form onSubmit={handleSettingsSubmit}>
                    <div className="settings-action-wrapper">
                        <section className="settings-card card-glass">
                            <div className="settings-card-header">
                                <Building2 size={24} color="#2563eb" />
                                <h3>Institution Identity</h3>
                            </div>
                            <div className="settings-form-content">
                                <div className="form-group">
                                    <label>School/College Name</label>
                                    <input
                                        type="text"
                                        name="schoolName"
                                        value={settingsFormData.schoolName}
                                        onChange={handleSettingsChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Official Website</label>
                                    <input
                                        type="text"
                                        name="website"
                                        value={settingsFormData.website}
                                        onChange={handleSettingsChange}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="settings-card card-glass">
                            <div className="settings-card-header">
                                <Calendar size={24} color="#10b981" />
                                <h3>Batch & Session Configuration</h3>
                            </div>
                            <div className="settings-form-content">
                                <div className="form-group">
                                    <label>Fiscal / Academic Year</label>
                                    <input
                                        type="text"
                                        name="academicYear"
                                        value={settingsFormData.academicYear}
                                        onChange={handleSettingsChange}
                                        placeholder="e.g. 2025-26"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Current Batch / Phase</label>
                                    <input
                                        type="text"
                                        name="currentSemester"
                                        value={settingsFormData.currentSemester}
                                        onChange={handleSettingsChange}
                                        placeholder="e.g. Batch-A, Sem-1, Phase-2"
                                    />
                                </div>
                            </div>
                        </section>


                    </div>

                    <div className="settings-actions">
                        <button type="submit" className="btn-save btn-wide">
                            Apply Configuration
                        </button>
                    </div>
                </form>
            </div >
        </>
    );

    const renderDashboard = () => (
        <>
            <header className="content-header">
                <h1>System Overview</h1>
                <p>Quick snapshot of all system operations.</p>
            </header>

            <section className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-label">{stat.label}</span>
                    </div>
                ))}
            </section>

            <section className="activity-section">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                    {activities.map((activity, index) => (
                        <div key={index} className="activity-item">
                            <div className="activity-info">
                                <h4>{activity.title}</h4>
                                <p className={activity.status}>{activity.desc}</p>
                            </div>
                            <div className="activity-status">
                                {activity.status === 'success' ? (
                                    <CheckCircle2 size={20} color="#10b981" />
                                ) : (
                                    <AlertTriangle size={20} color="#f59e0b" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );

    const renderUsers = () => (
        <>
            <header className="content-header">
                <h1>User Management</h1>
                <p>View and manage all system users.</p>
            </header>

            <section className="table-section card-glass">
                <div className="table-header">
                    <h2>User List</h2>
                    <div className="header-actions">
                        <div className="bulk-actions-inline">
                            <span className="template-link" onClick={downloadUserTemplate}>
                                <Download size={14} /> Template
                            </span>
                            <input
                                id="user-bulk-upload"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <button
                                className="btn-upload-mini"
                                onClick={() => {
                                    if (!uploadFile) {
                                        document.getElementById('user-bulk-upload').click();
                                    } else {
                                        handleUserBulkUpload();
                                    }
                                }}
                                disabled={uploading}
                            >
                                <Upload size={14} />
                                {uploading
                                    ? 'Uploading...'
                                    : (uploadFile ? `Upload ${uploadFile.name.substring(0, 15)}${uploadFile.name.length > 15 ? '...' : ''}` : 'Select & Import CSV')
                                }
                            </button>
                            {uploadFile && (
                                <button
                                    className="btn-cancel-mini"
                                    onClick={() => setUploadFile(null)}
                                    title="Cancel Selection"
                                    style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        <button className="btn-add" onClick={openAddUserModal}>
                            <Plus size={18} />
                            Add User
                        </button>
                    </div>
                </div>

                <div className="table-container">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Email</th>
                                <th>Parents Email</th>
                                <th>Parents Mobile</th>
                                <th>Username</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={index}>
                                    <td>#{user.id}</td>
                                    <td>{user.name}</td>
                                    <td><span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span></td>
                                    <td>{user.department || '-'}</td>
                                    <td>{user.email}</td>
                                    <td>{user.parentsEmail || '-'}</td>
                                    <td>{user.parentsMobile || '-'}</td>
                                    <td>{user.username}</td>
                                    <td className="actions">
                                        <button className="edit-btn" onClick={() => openEditUserModal(user)}>
                                            <Pencil size={18} />
                                        </button>
                                        <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );

    const renderSubjects = () => (
        <>
            <header className="content-header">
                <h1>Subject Management</h1>
                <p>Create and assign faculties to institutional subjects.</p>
            </header>

            <section className="table-section card-glass">
                <div className="table-header">
                    <h2>Subject List</h2>
                    <button className="btn-add" onClick={openAddSubjectModal}>
                        <Plus size={18} />
                        Add New Subject
                    </button>
                </div>

                <div className="table-container">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Subject Name</th>
                                <th>Code</th>
                                <th>Year</th>
                                <th>Assigned Faculty</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((subject, index) => (
                                <tr key={index}>
                                    <td>#{subject.id}</td>
                                    <td>{subject.name}</td>
                                    <td>{subject.code}</td>
                                    <td>{subject.year}</td>
                                    <td>{subject.faculty ? subject.faculty.name : <span className="unassigned">Unassigned</span>}</td>
                                    <td className="actions">
                                        <button className="edit-btn" onClick={() => openEditSubjectModal(subject)}>
                                            <Pencil size={18} />
                                        </button>
                                        <button className="delete-btn" onClick={() => handleDeleteSubject(subject.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );

    const renderStudentAssignment = () => (
        <>
            <header className="content-header">
                <h1>Student Management</h1>
                <p>Assign students to subjects and track their enrollment status.</p>
            </header>

            <div className="enrollment-management card-glass">
                <div className="selector-section">
                    <div className="selector-info">
                        <label>Select Subject to Manage:</label>
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="subject-selector"
                        >
                            <option value="">-- Select a Subject --</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name} ({subject.code}) - {subject.faculty ? subject.faculty.name : 'No Faculty'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedSubjectId && (
                        <div className="bulk-actions-inline enrollment-bulk">
                            <span className="template-link" onClick={downloadEnrollTemplate}>
                                <Download size={14} /> Template
                            </span>
                            <label htmlFor="enroll-bulk-upload" className="csv-label-mini">
                                {uploadFile ? uploadFile.name : 'Bulk Enroll Students'}
                            </label>
                            <input
                                id="enroll-bulk-upload"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <button
                                className="btn-upload-mini"
                                onClick={handleEnrollBulkUpload}
                                disabled={!uploadFile || uploading}
                            >
                                <Upload size={14} /> {uploading ? '...' : 'Enroll'}
                            </button>
                        </div>
                    )}
                </div>

                {selectedSubjectId && (
                    <div className="enrollment-grid">
                        <div className="enrollment-column">
                            <h3>Enrolled Students ({subjectStudents.length})</h3>
                            <div className="student-scroll-list">
                                {subjectStudents.length === 0 ? (
                                    <p className="empty-msg">No students enrolled yet.</p>
                                ) : (
                                    <table className="user-table mini">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subjectStudents.map(student => (
                                                <tr key={student.id}>
                                                    <td>{student.name}</td>
                                                    <td>
                                                        <button
                                                            className="delete-btn mini"
                                                            onClick={() => handleUnenrollStudent(student.id)}
                                                            title="Unenroll"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        <div className="enrollment-column">
                            <h3>Available Students</h3>
                            <div className="student-scroll-list">
                                <table className="user-table mini">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students
                                            .filter(s => !subjectStudents.some(es => es.id === s.id))
                                            .map(student => (
                                                <tr key={student.id}>
                                                    <td>{student.name}</td>
                                                    <td>
                                                        <button
                                                            className="edit-btn mini"
                                                            onClick={() => handleEnrollStudent(student.id)}
                                                            title="Enroll"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="admin-container">
            {/* Mobile Header */}
            <header className="mobile-dashboard-header">
                <div className="mobile-logo">
                    <GraduationCap size={24} />
                    <span>SAPT ADMIN</span>
                </div>
                <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
                <div
                    className="sidebar-logo"
                    onClick={() => navigate('/login')}
                    style={{ cursor: 'pointer' }}
                >
                    <GraduationCap size={32} color="white" />
                    <span>TRACKER</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="section-title">MAIN MENU</span>
                        <button
                            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <LayoutDashboard size={20} />
                            Dashboard
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <Users size={20} />
                            Users
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`}
                            onClick={() => setActiveTab('subjects')}
                        >
                            <Building2 size={20} />
                            Subjects
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
                            onClick={() => setActiveTab('students')}
                        >
                            <GraduationCap size={20} />
                            Student Magmt
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings size={20} />
                            Settings
                        </button>
                    </div>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="main-content fade-in">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'subjects' && renderSubjects()}
                {activeTab === 'students' && renderStudentAssignment()}
                {activeTab === 'settings' && renderSettings()}
            </main>

            {/* User Modal */}
            {showUserModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowUserModal(false) }}>
                    <div className="modal-content card-glass">
                        <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                        <form onSubmit={handleUserSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={userFormData.name}
                                        onChange={handleUserInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select name="role" value={userFormData.role} onChange={handleUserInputChange} required>
                                        <option value="" disabled>Select Role</option>
                                        <option value="Student">Student</option>
                                        <option value="Faculty">Faculty</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={userFormData.department}
                                        onChange={handleUserInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={userFormData.email}
                                        onChange={handleUserInputChange}
                                        required
                                    />
                                </div>
                                {userFormData.role === 'Student' && (
                                    <div className="form-group">
                                        <label>Parents Email</label>
                                        <input
                                            type="email"
                                            name="parentsEmail"
                                            value={userFormData.parentsEmail}
                                            onChange={handleUserInputChange}
                                            placeholder="Enter parent's email"
                                        />
                                    </div>
                                )}
                                {userFormData.role === 'Student' && (
                                    <div className="form-group">
                                        <label>Parents Mobile</label>
                                        <input
                                            type="text"
                                            name="parentsMobile"
                                            value={userFormData.parentsMobile}
                                            onChange={handleUserInputChange}
                                            placeholder="Enter parent's mobile"
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={userFormData.username}
                                        onChange={handleUserInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={userFormData.password}
                                        onChange={handleUserInputChange}
                                        placeholder={editingUser ? 'Leave blank to keep same' : 'Enter password'}
                                        required={!editingUser}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowUserModal(false)}>Cancel</button>
                                <button type="submit" className="btn-save">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subject Modal */}
            {showSubjectModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSubjectModal(false) }}>
                    <div className="modal-content card-glass">
                        <h2>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
                        <form onSubmit={handleSubjectSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Subject Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={subjectFormData.name}
                                        onChange={handleSubjectInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Subject Code</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={subjectFormData.code}
                                        onChange={handleSubjectInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Year</label>
                                    <input
                                        type="text"
                                        name="year"
                                        value={subjectFormData.year}
                                        onChange={handleSubjectInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Assign Faculty</label>
                                    <select name="facultyId" value={subjectFormData.facultyId} onChange={handleSubjectInputChange}>
                                        <option value="">Select Faculty</option>
                                        {faculties.map(faculty => (
                                            <option key={faculty.id} value={faculty.id}>{faculty.name} ({faculty.username})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowSubjectModal(false)}>Cancel</button>
                                <button type="submit" className="btn-save">Save Subject</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
