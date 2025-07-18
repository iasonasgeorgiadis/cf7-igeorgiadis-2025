import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Grade submissions page component for instructors
 */
const GradeSubmissions = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  /**
   * Load assignment and submissions
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load assignment details
        const assignmentData = await assignmentService.getAssignmentById(id);
        setAssignment(assignmentData);

        // Load all submissions
        const submissionsData = await submissionService.getSubmissionsByAssignment(id);
        setSubmissions(submissionsData);

        // Select first ungraded submission if available
        const ungraded = submissionsData.find(s => s.grade === null);
        if (ungraded) {
          selectSubmission(ungraded);
        } else if (submissionsData.length > 0) {
          selectSubmission(submissionsData[0]);
        }
      } catch (error) {
        setError('Failed to load submissions');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  /**
   * Select a submission to grade
   */
  const selectSubmission = (submission) => {
    setSelectedSubmission(submission);
    reset({
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
    setSuccess('');
  };

  /**
   * Handle grade submission
   */
  const onSubmit = async (data) => {
    if (!selectedSubmission) return;

    setGrading(true);
    setError('');
    setSuccess('');

    try {
      const gradeData = {
        grade: parseInt(data.grade),
        feedback: data.feedback
      };

      const updatedSubmission = await submissionService.gradeSubmission(
        selectedSubmission.id, 
        gradeData
      );

      // Update the submission in the list
      setSubmissions(submissions.map(s => 
        s.id === updatedSubmission.id ? updatedSubmission : s
      ));
      
      setSuccess('Grade saved successfully!');

      // Move to next ungraded submission
      const currentIndex = submissions.findIndex(s => s.id === selectedSubmission.id);
      const nextUngraded = submissions
        .slice(currentIndex + 1)
        .find(s => s.grade === null);
      
      if (nextUngraded) {
        selectSubmission(nextUngraded);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save grade');
    } finally {
      setGrading(false);
    }
  };

  /**
   * Get submission status badge
   */
  const getStatusBadge = (submission) => {
    const dueDate = new Date(assignment.due_date);
    const submitDate = new Date(submission.submitted_at);
    const isLate = submitDate > dueDate;

    if (submission.grade !== null) {
      return (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
          Graded
        </span>
      );
    }

    return (
      <span className={`px-2 py-1 text-xs rounded ${
        isLate 
          ? 'bg-red-100 text-red-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {isLate ? 'Late' : 'Pending'}
      </span>
    );
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Assignment not found</h1>
          <Link to="/courses" className="mt-4 text-blue-600 hover:text-blue-800">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to={`/lessons/${assignment.lesson_id}`} 
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Back to lesson
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Grade Submissions: {assignment.title}
        </h1>
        <p className="text-gray-600 mt-1">
          {submissions.length} submissions • Max points: {assignment.max_points}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission list */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold">Submissions</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {submissions.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">No submissions yet</p>
              ) : (
                submissions.map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => selectSubmission(submission)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedSubmission?.id === submission.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {submission.student.full_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(submission)}
                        {submission.grade !== null && (
                          <p className="text-sm font-medium mt-1">
                            {submission.grade}/{assignment.max_points}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Grading area */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="bg-white shadow rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">
                  {selectedSubmission.student.full_name}'s Submission
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted on {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  {new Date(selectedSubmission.submitted_at) > new Date(assignment.due_date) && (
                    <span className="ml-2 text-red-600">(Late submission)</span>
                  )}
                </p>
              </div>

              {/* Submission content */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-medium mb-3">Submission Content</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {selectedSubmission.content}
                  </pre>
                </div>
              </div>

              {/* Grading form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">
                    {success}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Grade input */}
                  <div>
                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                      Grade (out of {assignment.max_points})
                    </label>
                    <input
                      type="number"
                      id="grade"
                      {...register('grade', {
                        required: 'Grade is required',
                        min: {
                          value: 0,
                          message: 'Grade cannot be negative'
                        },
                        max: {
                          value: assignment.max_points,
                          message: `Grade cannot exceed ${assignment.max_points}`
                        }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.grade && (
                      <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                    )}
                  </div>

                  {/* Feedback */}
                  <div>
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                      Feedback (optional)
                    </label>
                    <textarea
                      id="feedback"
                      rows={4}
                      {...register('feedback')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Provide feedback to the student..."
                    />
                  </div>

                  {/* Submit button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={grading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {grading ? <LoadingSpinner size="sm" /> : 'Save Grade'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              Select a submission to grade
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradeSubmissions;