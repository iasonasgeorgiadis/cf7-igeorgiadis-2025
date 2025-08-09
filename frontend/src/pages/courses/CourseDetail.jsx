import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import enrollmentService from '../../services/enrollmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LessonList from '../../components/lessons/LessonList';

/**
 * Course detail page component
 */
const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';
  const isOwner = isInstructor && course?.instructor_id === user?.userId;

  /**
   * Load course details
   */
  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courseData = await courseService.getCourseById(id);
        setCourse(courseData);

        // Check enrollment eligibility for students
        if (isStudent) {
          const eligibilityData = await enrollmentService.checkEligibility(id);
          setEligibility(eligibilityData);
        }
      } catch (error) {
        setError('Failed to load course details');
        // Error loading course
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id, isStudent]);

  /**
   * Handle enrollment
   */
  const handleEnroll = async () => {
    setEnrolling(true);
    setError('');

    try {
      await enrollmentService.enrollInCourse(course.id);
      // Reload the current page to show updated enrollment status
      window.location.reload();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to enroll in course');
      setEnrolling(false);
    }
  };

  /**
   * Handle delete course
   */
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      await courseService.deleteCourse(course.id);
      navigate('/my-courses');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete course');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
          <Link to="/courses" className="mt-4 text-blue-600 hover:text-blue-800">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        {/* Course header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-lg text-gray-600">{course.description}</p>
            </div>
            
            {isOwner && (
              <div className="flex gap-2 ml-4">
                <Link
                  to={`/courses/${course.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Course info */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Course Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Instructor</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {course.instructor?.full_name || 'Unknown'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {course.enrolled_count} / {course.capacity} students enrolled
                  {course.is_full && (
                    <span className="ml-2 text-red-600 font-semibold">(FULL)</span>
                  )}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Available Spots</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {course.remaining_capacity} spots remaining
                </dd>
              </div>

              {course.prerequisites && course.prerequisites.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Prerequisites</dt>
                  <dd className="mt-1">
                    <ul className="list-disc list-inside text-sm text-gray-900">
                      {course.prerequisites.map((prereq) => (
                        <li key={prereq.id}>
                          <Link
                            to={`/courses/${prereq.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {prereq.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Enrollment section for students */}
          {isStudent && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Enrollment</h2>
              
              {eligibility && (
                <div className="space-y-4">
                  {eligibility.canEnroll ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800">You are eligible to enroll in this course</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium mb-2">
                        You cannot enroll in this course:
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-700">
                        {eligibility.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                      
                      {eligibility.missingPrerequisites && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-yellow-800">
                            Missing prerequisites:
                          </p>
                          <ul className="list-disc list-inside text-sm text-yellow-700">
                            {eligibility.missingPrerequisites.map((prereq) => (
                              <li key={prereq.id}>{prereq.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleEnroll}
                    disabled={!eligibility.canEnroll || enrolling}
                    className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                      eligibility.canEnroll
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } disabled:opacity-50`}
                  >
                    {enrolling ? <LoadingSpinner size="sm" /> : 'Enroll in Course'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Enrollment list for instructors */}
          {isOwner && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Enrolled Students</h2>
              <Link
                to={`/courses/${course.id}/students`}
                className="text-blue-600 hover:text-blue-800"
              >
                View enrolled students ({course.enrolled_count})
              </Link>
            </div>
          )}
        </div>

        {/* Lessons section */}
        <div className="p-6 border-t border-gray-200">
          <LessonList courseId={course.id} isOwner={isOwner} />
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;