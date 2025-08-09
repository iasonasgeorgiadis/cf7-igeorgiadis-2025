import { Link } from 'react-router-dom';

/**
 * Register page component - simplified for exercise
 */
const Register = () => {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registration
          </h2>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-blue-50 p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-blue-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Registration Not Available
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Registration functionality is not implemented for this exercise. 
              Please use the existing test accounts to log in.
            </p>
            <div className="bg-white rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Test Accounts:</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Instructor:</span> instructor@lms.com / TeachPass123!
                </div>
                <div>
                  <span className="font-medium">Student:</span> student@lms.com / StudyPass123!
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;