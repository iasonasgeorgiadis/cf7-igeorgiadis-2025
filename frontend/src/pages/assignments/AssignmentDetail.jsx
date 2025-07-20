import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Assignment detail page component
 */
const AssignmentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submissionContent, setSubmissionContent] = useState('');

  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';

  /**
   * Load assignment and submission data
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load assignment details
        const assignmentData = await assignmentService.getAssignmentById(id);
        setAssignment(assignmentData);

        // Load submission if student
        if (isStudent) {
          try {
            const submissionData = await submissionService.getMySubmission(id);
            setSubmission(submissionData);
            setSubmissionContent(submissionData.content || '');
          } catch (error) {
            // No submission yet
            if (error.response?.status !== 404) {
              // Error loading submission
            }
          }
        }
      } catch (error) {
        setError('Failed to load assignment');
        // Error loading assignment
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isStudent]);

  /**
   * Handle submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!submissionContent.trim()) {
      setError('Submission content is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const submissionData = await submissionService.submitAssignment(id, {
        content: submissionContent
      });
      setSubmission(submissionData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Get status information
   */
  const getStatusInfo = () => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (submission) {
      const submittedDate = new Date(submission.submitted_at);
      const isLate = submittedDate > dueDate;

      return {
        status: submission.grade !== null ? 'graded' : 'submitted',
        isLate,
        submittedDate,
        grade: submission.grade,
        feedback: submission.feedback
      };
    }

    const isPastDue = dueDate < now;
    return {
      status: isPastDue ? 'past_due' : 'pending',
      isPastDue
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Assignment not found</h1>
          <Link to="/courses" className="mt-4 text-blue-600 hover:text-blue-800">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

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
              to={`/courses/${assignment.course_id}`} 
              className="hover:text-gray-700"
            >
              {assignment.course?.title || 'Course'}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link 
              to={`/lessons/${assignment.lesson_id}`} 
              className="hover:text-gray-700"
            >
              {assignment.lesson?.title || 'Lesson'}
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900">{assignment.title}</li>
        </ol>
      </nav>

      <div className="bg-white shadow rounded-lg">
        {/* Assignment header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
              {assignment.description && (
                <p className="text-lg text-gray-600">{assignment.description}</p>
              )}
            </div>

            {isInstructor && (
              <Link
                to={`/assignments/${assignment.id}/submissions`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Submissions
              </Link>
            )}
          </div>

          {/* Assignment info */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">Points:</span>
              <span className="ml-2 font-medium">{assignment.max_points}</span>
            </div>
            <div>
              <span className="text-gray-500">Due:</span>
              <span className="ml-2 font-medium">
                {new Date(assignment.due_date).toLocaleString()}
              </span>
            </div>
            {isStudent && (
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2">
                  {statusInfo.status === 'graded' && (
                    <span className="text-green-600 font-medium">
                      Graded: {statusInfo.grade}/{assignment.max_points}
                    </span>
                  )}
                  {statusInfo.status === 'submitted' && (
                    <span className="text-blue-600 font-medium">
                      Submitted {statusInfo.isLate && '(Late)'}
                    </span>
                  )}
                  {statusInfo.status === 'past_due' && (
                    <span className="text-red-600 font-medium">Past Due</span>
                  )}
                  {statusInfo.status === 'pending' && (
                    <span className="text-yellow-600 font-medium">Not Submitted</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Assignment content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Instructions</h2>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {assignment.instructions}
              </div>
            </div>
          </div>

          {/* Submission section for students */}
          {isStudent && (
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-3">Your Submission</h2>
              
              {statusInfo.status === 'graded' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800 mb-2">
                    Grade: {statusInfo.grade}/{assignment.max_points} 
                    ({Math.round((statusInfo.grade / assignment.max_points) * 100)}%)
                  </div>
                  {statusInfo.feedback && (
                    <div className="mt-3">
                      <p className="font-medium text-green-800 mb-1">Instructor Feedback:</p>
                      <p className="text-green-700">{statusInfo.feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {submission ? (
                <div>
                  <div className="mb-4 text-sm text-gray-500">
                    Submitted on {new Date(submission.submitted_at).toLocaleString()}
                    {statusInfo.isLate && (
                      <span className="ml-2 text-red-600">(Late submission)</span>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {submission.content}
                    </pre>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your submission here..."
                    disabled={statusInfo.isPastDue || submitting}
                  />
                  
                  {statusInfo.isPastDue ? (
                    <p className="mt-2 text-red-600">
                      This assignment is past due and can no longer be submitted.
                    </p>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? <LoadingSpinner size="sm" /> : 'Submit Assignment'}
                    </button>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;