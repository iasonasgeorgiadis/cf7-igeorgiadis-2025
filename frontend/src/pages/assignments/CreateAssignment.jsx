import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import assignmentService from '../../services/assignmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Create assignment page component
 */
const CreateAssignment = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Set default due date to 7 days from now
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      max_points: 100,
      due_date: defaultDueDate.toISOString().split('T')[0]
    }
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      // Convert data types
      const assignmentData = {
        ...data,
        max_points: parseInt(data.max_points),
        due_date: new Date(data.due_date).toISOString()
      };

      await assignmentService.createAssignment(lessonId, assignmentData);
      navigate(-1); // Go back to previous page
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create assignment');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Assignment</h1>
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
              Assignment Title *
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
              placeholder="Brief description of the assignment"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
              Instructions *
            </label>
            <textarea
              id="instructions"
              rows={8}
              {...register('instructions', {
                required: 'Instructions are required',
                minLength: {
                  value: 20,
                  message: 'Instructions must be at least 20 characters'
                }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed instructions for completing the assignment..."
            />
            {errors.instructions && (
              <p className="mt-1 text-sm text-red-600">{errors.instructions.message}</p>
            )}
          </div>

          {/* Max Points */}
          <div>
            <label htmlFor="max_points" className="block text-sm font-medium text-gray-700">
              Maximum Points *
            </label>
            <input
              type="number"
              id="max_points"
              {...register('max_points', {
                required: 'Maximum points is required',
                min: {
                  value: 1,
                  message: 'Points must be at least 1'
                },
                max: {
                  value: 1000,
                  message: 'Points cannot exceed 1000'
                }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.max_points && (
              <p className="mt-1 text-sm text-red-600">{errors.max_points.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
              Due Date *
            </label>
            <input
              type="date"
              id="due_date"
              {...register('due_date', {
                required: 'Due date is required',
                validate: value => {
                  const selectedDate = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return selectedDate >= today || 'Due date must be in the future';
                }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.due_date && (
              <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
            )}
          </div>

          {/* Form actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignment;