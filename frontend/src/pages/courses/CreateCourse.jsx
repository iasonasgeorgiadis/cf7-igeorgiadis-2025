import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Create course page component
 */
const CreateCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      capacity: 30,
      prerequisiteIds: []
    }
  });

  // Check if user is instructor
  useEffect(() => {
    if (user?.role !== 'instructor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Load available courses for prerequisites
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await courseService.getAllCourses({ limit: 100 });
        setAvailableCourses(data.courses);
      } catch (error) {
        // Error loading courses
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  /**
   * Handle form submission
   */
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Convert prerequisiteIds to array if needed
      if (data.prerequisiteIds && !Array.isArray(data.prerequisiteIds)) {
        data.prerequisiteIds = [data.prerequisiteIds];
      }

      const course = await courseService.createCourse(data);
      navigate(`/courses/${course.id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create course');
      setIsSubmitting(false);
    }
  };

  if (loadingCourses) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Course Title
            </label>
            <input
              {...register('title', {
                required: 'Course title is required',
                minLength: {
                  value: 3,
                  message: 'Title must be at least 3 characters'
                },
                maxLength: {
                  value: 255,
                  message: 'Title must be less than 255 characters'
                }
              })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., Introduction to Web Development"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Course Description
            </label>
            <textarea
              {...register('description', {
                required: 'Course description is required',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters'
                }
              })}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Provide a detailed description of what students will learn..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
              Course Capacity
            </label>
            <input
              {...register('capacity', {
                required: 'Capacity is required',
                min: {
                  value: 1,
                  message: 'Capacity must be at least 1'
                },
                max: {
                  value: 500,
                  message: 'Capacity cannot exceed 500'
                }
              })}
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.capacity && (
              <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="prerequisiteIds" className="block text-sm font-medium text-gray-700">
              Prerequisites (Optional)
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Select courses that students must complete before enrolling
            </p>
            <select
              {...register('prerequisiteIds')}
              multiple
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              size={5}
            >
              {availableCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Hold Ctrl/Cmd to select multiple prerequisites
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/my-courses')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;