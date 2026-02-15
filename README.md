# Student Assessment and Performance Tracker (SAPT)

A comprehensive web application designed to track, manage, and analyze student academic performance. This project features role-based access for Admins, Faculty, and Students, providing a streamlined workflow for assessment management and real-time notifications.

---

## 🚀 Key Features

### 🔐 Multi-Role Authentication
- **Admin**: Full authority to manage users (Faculty/Students), departments, and system settings.
- **Faculty**: Dedicated dashboard to input marks, manage subjects, and monitor student progress.
- **Student**: Personalized portal to view marks, tracking academic growth through interactive performance graphs.

### 📊 Performance Analytics
- Visual representation of student marks using dynamic charts.
- Semester-wise and subject-wise performance tracking.

### ✉️ Automated Notifications
- **Email Integration**: Automated email notifications for registrations and performance updates using Spring Mail (SMTP).
- **SMS Automation**: Real-time SMS alerts for important academic updates via Twilio API.

### 🌑 Modern UI/UX
- Responsive design tailored for all screen sizes.
- **Dark/Light Mode**: Seamlessly toggle between themes for a comfortable viewing experience.

---

## 🛠️ Technology Stack

### Backend
- **Java 21**
- **Spring Boot 3.2.2** (Spring Data JPA, Spring Web, Spring Mail)
- **MySQL** (Relational Database)
- **Maven** (Dependency Management)
- **Twilio SDK** (SMS Notifications)

### Frontend
- **React.js** (Functional Components & Hooks)
- **Vite** (Optimized Build Tool)
- **Vanilla CSS** (Custom Styling & Glassmorphism)
- **Chart.js** (Data Visualization)

---

## ⚙️ Setup & Installation

### Prerequisites
- JDK 21+
- Node.js & npm
- MySQL Server

### 1. Database Configuration
1. Create a database named `school_tracker_db`.
2. Update the credentials in `backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.username=YOUR_USERNAME
   spring.datasource.password=YOUR_PASSWORD
   ```

### 2. Backend Setup
1. Navigate to the `backend` folder.
2. Run the application:
   ```cmd
   mvnw spring-boot:run
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```cmd
   npm install
   ```
3. Start the development server:
   ```cmd
   npm run dev
   ```

---

## 📂 Project Structure
- `backend/`: Spring Boot application containing controllers, services, models, and repositories.
- `frontend/`: React application built with Vite, including components for different user roles.
- `ReportingService/`: Dedicated microservice for generating academic reports.

---

## 👨‍💻 Author
**Dilip Nalage**
- [GitHub](https://github.com/dilipnalage1063)
- [LinkedIn](https://www.linkedin.com/in/dilip-nalage-73889828a/)
-
**Vinit Darade**
- [GitHub](https://github.com/VinitDarade12)
- [LinkedIn](https://www.linkedin.com/in/vinitdarade/)
*Developed as part of the CDAC Project Curriculum.*
