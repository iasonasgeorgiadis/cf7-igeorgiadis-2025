import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import enrollmentService from '../../services/enrollmentService';
import courseService from '../../services/courseService';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Course card component
 */
const CourseCard = ({ course, onEnrollmentChange, hideOwnerTag = false, onDelete, disableNavigation = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState('');

  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';
  const isOwnCourse = isInstructor && course.instructor_id === user?.userId;

  /**
   * Handle enrollment
   */
  const handleEnroll = async (e) => {
    e.stopPropagation();
    setIsEnrolling(true);
    setError('');

    try {
      await enrollmentService.enrollInCourse(course.id);
      if (onEnrollmentChange) {
        onEnrollmentChange();
      }
      // Show success feedback
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setIsEnrolling(false);
    }
  };

  /**
   * Navigate to course details
   */
  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  /**
   * Handle course deletion
   */
  const handleDelete = async (e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await courseService.deleteCourse(course.id);
      if (onDelete) {
        onDelete(course.id);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete course');
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 ${!disableNavigation ? 'cursor-pointer' : ''}`}
      onClick={!disableNavigation ? handleClick : undefined}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
        {isOwnCourse && !hideOwnerTag && (
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Your Course
          </span>
        )}
      </div>

      <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Instructor: {course.instructor?.full_name || 'Unknown'}
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Capacity: {course.enrolled_count || 0} / {course.capacity}
          {course.is_full && (
            <span className="ml-2 text-red-600 font-semibold">FULL</span>
          )}
        </div>

        {course.prerequisites && course.prerequisites.length > 0 && (
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Prerequisites: {course.prerequisites.map(p => p.title).join(', ')}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}

      <div className="flex justify-between items-center">
        <div>
          {course.remaining_capacity > 0 ? (
            <span className="text-sm text-green-600">
              {course.remaining_capacity} spots available
            </span>
          ) : (
            <span className="text-sm text-red-600">No spots available</span>
          )}
        </div>

        {isStudent && !course.is_enrolled && (
          <button
            onClick={handleEnroll}
            disabled={isEnrolling || course.is_full}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              course.is_full
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {isEnrolling ? <LoadingSpinner size="sm" /> : 'Enroll'}
          </button>
        )}

        {isStudent && course.is_enrolled && (
          <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded">
            Enrolled
          </span>
        )}

        {isOwnCourse && onDelete && (
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            aria-label="Delete course"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;