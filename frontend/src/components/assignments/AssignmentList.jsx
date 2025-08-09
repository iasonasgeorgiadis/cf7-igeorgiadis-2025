import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import assignmentService from '../../services/assignmentService';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Assignment list component
 */
const AssignmentList = ({ lessonId, courseId }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';

  /**
   * Load assignments
   */
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        let data;
        if (lessonId) {
          data = await assignmentService.getAssignmentsByLesson(lessonId);
        } else if (courseId) {
          data = await assignmentService.getAssignmentsByCourse(courseId);
        } else {
          throw new Error('Either lessonId or courseId must be provided');
        }
        setAssignments(data);
      } catch (error) {
        setError('Failed to load assignments');
        console.error('Error loading assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [lessonId, courseId]);

  /**
   * Handle delete assignment
   */
  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      await assignmentService.deleteAssignment(assignmentId);
      setAssignments(assignments.filter(a => a.id !== assignmentId));
    } catch (error) {
      setError('Failed to delete assignment');
    }
  };

  /**
   * Get status badge for assignment
   */
  const getStatusBadge = (assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (assignment.submission) {
      if (assignment.submission.grade !== null) {
        return (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
            Graded: {assignment.submission.grade}/{assignment.max_points}
          </span>
        );
      }
      return (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
          Submitted
        </span>
      );
    }

    if (dueDate < now) {
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
          Past Due
        </span>
      );
    }

    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 3) {
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
          Due Soon
        </span>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Assignments</h3>
        {isInstructor && lessonId && (
          <Link
            to={`/lessons/${lessonId}/assignments/create`}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Add Assignment
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No assignments have been created yet.
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {assignment.title}
                    </h4>
                    {isStudent && getStatusBadge(assignment)}
                  </div>
                  
                  {assignment.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {assignment.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Points: {assignment.max_points}</span>
                    <span>•</span>
                    <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                    {isInstructor && (
                      <>
                        <span>•</span>
                        <span>Submissions: {assignment.submission_count || 0}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {isStudent ? (
                    <Link
                      to={`/assignments/${assignment.id}`}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      {assignment.submission ? 'View Submission' : 'Submit'}
                    </Link>
                  ) : isInstructor && (
                    <>
                      <Link
                        to={`/assignments/${assignment.id}/submissions`}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Grade
                      </Link>
                      <Link
                        to={`/assignments/${assignment.id}/edit`}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentList;