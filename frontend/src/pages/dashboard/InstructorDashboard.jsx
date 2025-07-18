import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';

/**
 * Instructor dashboard component
 */
const InstructorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0,
    pendingGrading: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await courseService.getInstructorCourses();
        setStats({
          courseCount: data.courses?.length || 0,
          studentCount: data.courses?.reduce((sum, course) => sum + (course.enrolled_count || 0), 0) || 0,
          pendingGrading: 0 // Will be implemented in Phase 4
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
          Instructor Dashboard - {user?.fullName || `${user?.first_name} ${user?.last_name}`}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Link to="/my-courses" className="bg-purple-50 rounded-lg p-6 hover:bg-purple-100 transition-colors cursor-pointer">
            <h2 className="text-lg font-semibold text-purple-900">My Courses</h2>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.courseCount}</p>
            <p className="text-sm text-purple-700 mt-1">Active courses</p>
          </Link>
          
          <div className="bg-indigo-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-indigo-900">Total Students</h2>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.studentCount}</p>
            <p className="text-sm text-indigo-700 mt-1">Enrolled students</p>
          </div>
          
          <div className="bg-pink-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-pink-900">Pending Grading</h2>
            <p className="text-3xl font-bold text-pink-600 mt-2">{stats.pendingGrading}</p>
            <p className="text-sm text-pink-700 mt-1">Submissions to grade</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              to="/courses/create" 
              className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium">Create New Course</span>
              <span className="text-sm text-gray-600 ml-2">(Available)</span>
            </Link>
            <Link 
              to="/my-courses" 
              className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium">Manage My Courses</span>
              <span className="text-sm text-gray-600 ml-2">(Available)</span>
            </Link>
            <button 
              disabled 
              className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed"
            >
              <span className="font-medium">Grade Assignments</span>
              <span className="text-sm text-gray-500 ml-2">(Coming in Phase 4)</span>
            </button>
            <button 
              disabled 
              className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed"
            >
              <span className="font-medium">View Student Progress</span>
              <span className="text-sm text-gray-500 ml-2">(Coming in Phase 4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;