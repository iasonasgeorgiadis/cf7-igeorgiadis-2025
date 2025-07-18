import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import enrollmentService from '../../services/enrollmentService';

/**
 * Student dashboard component
 */
const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeCount: 0,
    completedCount: 0,
    pendingAssignments: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const enrollments = await enrollmentService.getMyCourses();
        const active = enrollments.filter(e => e.status === 'active').length;
        const completed = enrollments.filter(e => e.status === 'completed').length;
        setStats({
          activeCount: active,
          completedCount: completed,
          pendingAssignments: 0 // Will be implemented in Phase 3
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome, {user?.fullName || `${user?.first_name} ${user?.last_name}`}!
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900">Enrolled Courses</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.activeCount}</p>
            <p className="text-sm text-blue-700 mt-1">Active enrollments</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900">Completed Courses</h2>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.completedCount}</p>
            <p className="text-sm text-green-700 mt-1">Courses completed</p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900">Pending Assignments</h2>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingAssignments}</p>
            <p className="text-sm text-yellow-700 mt-1">Assignments due</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Actions</h2>
          <div className="space-y-3">
            <Link 
              to="/courses" 
              className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium">Browse Available Courses</span>
            </Link>
            <Link 
              to="/my-courses" 
              className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium">View My Courses</span>
            </Link>
            <button 
              disabled 
              className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed"
            >
              <span className="font-medium">Check Assignments</span>
              <span className="text-sm text-gray-500 ml-2">(Coming in Phase 3)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;