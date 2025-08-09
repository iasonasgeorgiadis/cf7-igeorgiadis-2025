import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import lessonService from '../../services/lessonService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Create lesson page component
 */
const CreateLesson = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      content: '',
      duration_minutes: 30,
      is_published: false
    }
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      // Convert duration to number
      const lessonData = {
        ...data,
        duration_minutes: parseInt(data.duration_minutes)
      };

      await lessonService.createLesson(courseId, lessonData);
      navigate(`/courses/${courseId}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create lesson');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Lesson</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Lesson Title *
            </label>
            <input
              type="text"
              id="title"
              {...register('title', {
                required: 'Title is required',
                minLength: {
                  value: 3,
                  message: 'Title must be at least 3 characters'
                },
                maxLength: {
                  value: 200,
                  message: 'Title must not exceed 200 characters'
                }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description', {
                maxLength: {
                  value: 500,
                  message: 'Description must not exceed 500 characters'
                }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the lesson"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Lesson Content *
            </label>
            <textarea
              id="content"
              rows={10}
              {...register('content', {
                required: 'Content is required',
                minLength: {
                  value: 50,
                  message: 'Content must be at least 50 characters'
                }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the lesson content..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              You can use Markdown formatting for rich text content
            </p>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              id="duration_minutes"
              {...register('duration_minutes', {
                required: 'Duration is required',
                min: {
                  value: 1,
                  message: 'Duration must be at least 1 minute'
                },
                max: {
                  value: 480,
                  message: 'Duration cannot exceed 480 minutes (8 hours)'
                }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.duration_minutes && (
              <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>
            )}
          </div>

          {/* Published status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_published"
              {...register('is_published')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
              Publish lesson immediately
            </label>
          </div>

          {/* Form actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Link
              to={`/courses/${courseId}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLesson;