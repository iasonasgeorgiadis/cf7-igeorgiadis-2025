import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Admin dashboard component
 */
const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Admin Dashboard - {user?.fullName || `${user?.first_name} ${user?.last_name}`}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-red-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900">Total Users</h2>
            <p className="text-3xl font-bold text-red-600 mt-2">0</p>
            <p className="text-sm text-red-700 mt-1">Registered users</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-orange-900">Total Courses</h2>
            <p className="text-3xl font-bold text-orange-600 mt-2">0</p>
            <p className="text-sm text-orange-700 mt-1">Active courses</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900">Active Enrollments</h2>
            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
            <p className="text-sm text-green-700 mt-1">Current enrollments</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900">Completion Rate</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">0%</p>
            <p className="text-sm text-blue-700 mt-1">Average completion</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button disabled className="text-left px-4 py-3 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed">
              <div className="font-medium">User Management</div>
              <div className="text-sm text-gray-600">Create, edit, and manage users</div>
              <div className="text-xs text-gray-500 mt-1">(Coming in Phase 5)</div>
            </button>
            <Link to="/courses" className="block text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="font-medium">Course Overview</div>
              <div className="text-sm text-gray-600">Monitor all courses and enrollments</div>
            </Link>
            <button disabled className="text-left px-4 py-3 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed">
              <div className="font-medium">System Statistics</div>
              <div className="text-sm text-gray-600">View detailed analytics</div>
              <div className="text-xs text-gray-500 mt-1">(Coming in Phase 5)</div>
            </button>
            <button disabled className="text-left px-4 py-3 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed">
              <div className="font-medium">Reports</div>
              <div className="text-sm text-gray-600">Generate system reports</div>
              <div className="text-xs text-gray-500 mt-1">(Coming in Phase 5)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;