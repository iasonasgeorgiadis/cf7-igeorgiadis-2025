import { useAuth } from '../../contexts/AuthContext';

/**
 * Instructor dashboard component
 */
const InstructorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Instructor Dashboard - {user?.fullName || `${user?.first_name} ${user?.last_name}`}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-purple-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-purple-900">My Courses</h2>
            <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
            <p className="text-sm text-purple-700 mt-1">Active courses</p>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-indigo-900">Total Students</h2>
            <p className="text-3xl font-bold text-indigo-600 mt-2">0</p>
            <p className="text-sm text-indigo-700 mt-1">Enrolled students</p>
          </div>
          
          <div className="bg-pink-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-pink-900">Pending Grading</h2>
            <p className="text-3xl font-bold text-pink-600 mt-2">0</p>
            <p className="text-sm text-pink-700 mt-1">Submissions to grade</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              Create New Course
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              Manage My Courses
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              Grade Assignments
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              View Student Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;