import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './pages/auth/Login';
import LoginDebug from './pages/auth/LoginDebug';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import CourseList from './pages/courses/CourseList';
import CourseDetail from './pages/courses/CourseDetail';
import CreateCourse from './pages/courses/CreateCourse';
import CourseEdit from './pages/courses/CourseEdit';
import MyCourses from './pages/courses/MyCourses';
import CreateLesson from './pages/lessons/CreateLesson';
import EditLesson from './pages/lessons/EditLesson';
import LessonView from './pages/lessons/LessonView';
import CreateAssignment from './pages/assignments/CreateAssignment';
import AssignmentDetail from './pages/assignments/AssignmentDetail';
import GradeSubmissions from './pages/assignments/GradeSubmissions';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/login-debug" element={<LoginDebug />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <PrivateRoute>
                  <CourseList />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/create"
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <CreateCourse />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <PrivateRoute>
                  <CourseDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:id/edit"
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <CourseEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-courses"
              element={
                <PrivateRoute>
                  <MyCourses />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:courseId/lessons/create"
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <CreateLesson />
                </PrivateRoute>
              }
            />
            <Route
              path="/lessons/:id/edit"
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <EditLesson />
                </PrivateRoute>
              }
            />
            <Route
              path="/lessons/:id"
              element={
                <PrivateRoute>
                  <LessonView />
                </PrivateRoute>
              }
            />
            <Route
              path="/lessons/:lessonId/assignments/create"
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <CreateAssignment />
                </PrivateRoute>
              }
            />
            <Route
              path="/assignments/:id"
              element={
                <PrivateRoute>
                  <AssignmentDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/assignments/:id/submissions"
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <GradeSubmissions />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App
