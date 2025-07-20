import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import lessonService from '../../services/lessonService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AssignmentList from '../../components/assignments/AssignmentList';

/**
 * Lesson view page component for students
 */
const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingComplete, setMarkingComplete] = useState(false);

  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';

  /**
   * Load lesson and assignments
   */
  useEffect(() => {
    const loadLessonData = async () => {
      try {
        // Load lesson details
        const lessonData = await lessonService.getLessonById(id);
        setLesson(lessonData);
      } catch (error) {
        setError('Failed to load lesson');
        console.error('Error loading lesson:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLessonData();
  }, [id]);

  /**
   * Handle mark as complete
   */
  const handleMarkComplete = async () => {
    if (!isStudent) return;

    setMarkingComplete(true);
    try {
      await lessonService.markLessonCompleted(id);
      // Refresh lesson data to show updated completion status
      const lessonData = await lessonService.getLessonById(id);
      setLesson(lessonData);
    } catch (error) {
      setError('Failed to mark lesson as complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  /**
   * Navigate to next/previous lesson
   */
  const navigateToLesson = (direction) => {
    if (!lesson) return;
    
    const targetOrder = lesson.order_number + direction;
    // In a real app, we'd need to fetch the lesson ID for the target order
    // For now, we'll just navigate back to the course
    navigate(`/courses/${lesson.course_id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Lesson not found</h1>
          <Link to="/courses" className="mt-4 text-blue-600 hover:text-blue-800">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  // Check if lesson is published for students
  if (isStudent && !lesson.is_published) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Lesson not available</h1>
          <p className="mt-2 text-gray-600">This lesson is not yet published.</p>
          <Link 
            to={`/courses/${lesson.course_id}`} 
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            Back to course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb navigation */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link to="/courses" className="hover:text-gray-700">Courses</Link>
          </li>
          <li>/</li>
          <li>
            <Link 
              to={`/courses/${lesson.course_id}`} 
              className="hover:text-gray-700"
            >
              {lesson.course?.title || 'Course'}
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900">{lesson.title}</li>
        </ol>
      </nav>

      <div className="bg-white shadow rounded-lg">
        {/* Lesson header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Lesson {lesson.order_number}
                </span>
                {lesson.duration_minutes && (
                  <span className="text-sm text-gray-500">
                    • {lesson.duration_minutes} minutes
                  </span>
                )}
                {isStudent && lesson.completed_at && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Completed
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-lg text-gray-600">{lesson.description}</p>
              )}
            </div>

            {isInstructor && (
              <Link
                to={`/lessons/${lesson.id}/edit`}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Lesson content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap">{lesson.content}</div>
          </div>

          {/* Assignments section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <AssignmentList lessonId={lesson.id} />
          </div>

          {/* Completion button for students */}
          {isStudent && !lesson.completed_at && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={handleMarkComplete}
                disabled={markingComplete}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {markingComplete ? <LoadingSpinner size="sm" /> : 'Mark as Complete'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={() => navigateToLesson(-1)}
              disabled={lesson.order_number === 1}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              ← Previous Lesson
            </button>
            <Link
              to={`/courses/${lesson.course_id}`}
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              Back to Course
            </Link>
            <button
              onClick={() => navigateToLesson(1)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Next Lesson →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;