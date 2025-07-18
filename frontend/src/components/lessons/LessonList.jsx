import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import lessonService from '../../services/lessonService';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Lesson list component for displaying course lessons
 */
const LessonList = ({ courseId, isOwner }) => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);

  const isStudent = user?.role === 'student';

  /**
   * Load lessons for the course
   */
  useEffect(() => {
    const loadLessons = async () => {
      try {
        const data = await lessonService.getLessonsByCourse(courseId);
        setLessons(data);
      } catch (error) {
        setError('Failed to load lessons');
        console.error('Error loading lessons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [courseId]);

  /**
   * Handle drag start
   */
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Handle drop
   */
  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) return;

    const reorderedLessons = [...lessons];
    const [draggedLesson] = reorderedLessons.splice(draggedItem, 1);
    reorderedLessons.splice(dropIndex, 0, draggedLesson);

    // Update local state immediately for UI responsiveness
    setLessons(reorderedLessons);
    setDraggedItem(null);

    try {
      // Send new order to backend
      const lessonIds = reorderedLessons.map(lesson => lesson.id);
      await lessonService.reorderLessons(courseId, lessonIds);
    } catch (error) {
      // Revert on error
      setError('Failed to reorder lessons');
      const data = await lessonService.getLessonsByCourse(courseId);
      setLessons(data);
    }
  };

  /**
   * Handle delete lesson
   */
  const handleDelete = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      await lessonService.deleteLesson(lessonId);
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
    } catch (error) {
      setError('Failed to delete lesson');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Course Lessons</h2>
        {isOwner && (
          <Link
            to={`/courses/${courseId}/lessons/create`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Lesson
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No lessons have been added to this course yet.
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              draggable={isOwner}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`bg-white border rounded-lg p-6 ${
                isOwner ? 'cursor-move hover:shadow-md' : ''
              } ${draggedItem === index ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Lesson {lesson.order_number}
                    </span>
                    {lesson.is_published ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {lesson.title}
                  </h3>
                  
                  {lesson.description && (
                    <p className="text-gray-600 mb-3">{lesson.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Duration: {lesson.duration_minutes || 0} minutes</span>
                    <span>•</span>
                    <span>{lesson.assignments_count || 0} assignments</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {isStudent ? (
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View
                    </Link>
                  ) : isOwner && (
                    <>
                      <Link
                        to={`/lessons/${lesson.id}/edit`}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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

      {isOwner && lessons.length > 1 && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          Drag and drop lessons to reorder them
        </p>
      )}
    </div>
  );
};

export default LessonList;