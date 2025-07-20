/**
 * @swagger
 * /enrollments/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollments]
 *     description: Enroll the authenticated student in a course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Already enrolled or prerequisites not met
 *       403:
 *         description: Forbidden - Students only
 *       404:
 *         description: Course not found
 *
 * @swagger
 * /enrollments/drop:
 *   post:
 *     summary: Drop a course
 *     tags: [Enrollments]
 *     description: Drop an enrolled course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Course dropped successfully
 *       400:
 *         description: Not enrolled or already dropped
 *       403:
 *         description: Forbidden - Students only
 *
 * @swagger
 * /enrollments/my-courses:
 *   get:
 *     summary: Get enrolled courses
 *     tags: [Enrollments]
 *     description: Get all courses the student is enrolled in
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, dropped]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of enrolled courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       code:
 *                         type: string
 *                       enrollmentDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [active, completed, dropped]
 *                       progress:
 *                         type: number
 *                       currentLesson:
 *                         type: string
 *       403:
 *         description: Forbidden - Students only
 *
 * @swagger
 * /enrollments/statistics:
 *   get:
 *     summary: Get enrollment statistics
 *     tags: [Enrollments]
 *     description: Get student's enrollment statistics
 *     responses:
 *       200:
 *         description: Enrollment statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEnrolled:
 *                       type: integer
 *                     activeCourses:
 *                       type: integer
 *                     completedCourses:
 *                       type: integer
 *                     droppedCourses:
 *                       type: integer
 *                     totalCredits:
 *                       type: integer
 *                     avgProgress:
 *                       type: number
 *                     totalAssignments:
 *                       type: integer
 *                     completedAssignments:
 *                       type: integer
 *                     pendingAssignments:
 *                       type: integer
 *       403:
 *         description: Forbidden - Students only
 *
 * @swagger
 * /enrollments/check-eligibility/{courseId}:
 *   get:
 *     summary: Check enrollment eligibility
 *     tags: [Enrollments]
 *     description: Check if student can enroll in a course
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Eligibility check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     eligible:
 *                       type: boolean
 *                     reasons:
 *                       type: array
 *                       items:
 *                         type: string
 *                     prerequisitesMet:
 *                       type: boolean
 *                     alreadyEnrolled:
 *                       type: boolean
 *                     courseFull:
 *                       type: boolean
 *       403:
 *         description: Forbidden - Students only
 *       404:
 *         description: Course not found
 *
 * @swagger
 * /enrollments/course/{courseId}:
 *   get:
 *     summary: Get course enrollments
 *     tags: [Enrollments]
 *     description: Get all students enrolled in a course (Instructors only)
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of enrolled students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           enrollmentDate:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           progress:
 *                             type: number
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     completed:
 *                       type: integer
 *                     dropped:
 *                       type: integer
 *       403:
 *         description: Forbidden - Must be course instructor
 *       404:
 *         description: Course not found
 */