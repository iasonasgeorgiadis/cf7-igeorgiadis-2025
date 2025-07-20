import { useAuth } from '../../contexts/AuthContext';
import StudentDashboard from './StudentDashboard';
import InstructorDashboard from './InstructorDashboard';

/**
 * Dashboard component that renders role-specific dashboard
 */
const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'student':
      return <StudentDashboard />;
    case 'instructor':
      return <InstructorDashboard />;
    default:
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900">Invalid Role</h1>
            <p className="text-gray-600 mt-2">
              Your user role is not recognized. Please contact support.
            </p>
          </div>
        </div>
      );
  }
};

export default Dashboard;