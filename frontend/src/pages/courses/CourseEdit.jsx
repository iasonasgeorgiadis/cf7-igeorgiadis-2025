import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Edit course page component
 */
const CourseEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [course, setCourse] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  // Check if user is instructor and owns the course
  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courseData = await courseService.getCourseById(id);
        
        if (user?.role !== 'instructor' || courseData.instructor_id !== user?.userId) {
          navigate('/dashboard');
          return;
        }
        
        setCourse(courseData);
        setValue('title', courseData.title);
        setValue('description', courseData.description);
        setValue('capacity', courseData.capacity);
        setValue('prerequisiteIds', courseData.prerequisites?.map(p => p.id) || []);
      } catch (error) {
        console.error('Error loading course:', error);
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id, user, navigate, setValue]);

  // Load available courses for prerequisites
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await courseService.getAllCourses({ limit: 100 });
        // Filter out the current course to prevent self-reference
        setAvailableCourses(data.courses.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    };

    if (user?.role === 'instructor') {
      loadCourses();
    }
  }, [id, user]);

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

      await courseService.updateCourse(id, data);
      navigate(`/courses/${id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update course');
      setIsSubmitting(false);
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Course</h1>

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
                },
                validate: value => 
                  parseInt(value) >= course.enrolled_count || 
                  `Capacity cannot be less than current enrollment (${course.enrolled_count})`
              })}
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.capacity && (
              <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Current enrollment: {course.enrolled_count} students
            </p>
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
              {availableCourses
                .filter(c => c.instructor_id === user?.userId)
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
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
              onClick={() => navigate(`/courses/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Update Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEdit;