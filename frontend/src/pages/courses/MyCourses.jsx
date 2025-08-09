import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import enrollmentService from '../../services/enrollmentService';
import CourseCard from '../../components/courses/CourseCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * My Courses page component
 */
const MyCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';

  /**
   * Load data based on user role
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        if (isStudent) {
          // Load enrolled courses and statistics
          const [enrollments, stats] = await Promise.all([
            enrollmentService.getMyCourses(activeTab === 'completed' ? 'completed' : 'active'),
            enrollmentService.getStatistics()
          ]);
          setEnrolledCourses(enrollments);
          setStatistics(stats);
        } else if (isInstructor) {
          // Load instructor's courses
          const data = await courseService.getInstructorCourses();
          setCourses(data.courses);
        }
      } catch (error) {
        setError('Failed to load courses');
        // Error loading data
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isStudent, isInstructor, activeTab]);

  /**
   * Handle course deletion
   */
  const handleCourseDeleted = (courseId) => {
    setCourses(courses.filter(course => course.id !== courseId));
  };

  /**
   * Handle enrollment change
   */
  const handleEnrollmentChange = () => {
    // Reload data when enrollment status changes
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          
          {isInstructor && (
            <Link
              to="/courses/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create New Course
            </Link>
          )}
        </div>

        {/* Student statistics */}
        {isStudent && statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Active Courses</h3>
              <p className="text-2xl font-bold text-gray-900">{statistics.active_courses || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Completed Courses</h3>
              <p className="text-2xl font-bold text-gray-900">{statistics.completed_courses || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Credits</h3>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_credits || 0}</p>
            </div>
          </div>
        )}

        {/* Tabs for students */}
        {isStudent && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Courses
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed Courses
              </button>
            </nav>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Course grid */}
      {isStudent ? (
        enrolledCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">
              {activeTab === 'active' 
                ? "You haven't enrolled in any courses yet." 
                : "You haven't completed any courses yet."}
            </p>
            {activeTab === 'active' && (
              <Link
                to="/courses"
                className="text-blue-600 hover:text-blue-800"
              >
                Browse available courses
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((enrollment) => (
              <div key={enrollment.id} className="relative">
                <CourseCard
                  course={enrollment.course}
                  onEnrollmentChange={handleEnrollmentChange}
                  hideOwnerTag={true}
                />
                {enrollment.status === 'completed' && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      Completed
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        courses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
            <Link
              to="/courses/create"
              className="text-blue-600 hover:text-blue-800"
            >
              Create your first course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="relative">
                <CourseCard
                  course={course}
                  onEnrollmentChange={handleEnrollmentChange}
                  hideOwnerTag={true}
                  onDelete={handleCourseDeleted}
                />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default MyCourses;