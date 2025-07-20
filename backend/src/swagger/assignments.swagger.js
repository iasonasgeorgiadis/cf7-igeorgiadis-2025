/**
 * @swagger
 * /assignments/lesson/{lessonId}:
 *   get:
 *     summary: Get assignments for a lesson
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of assignments
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
 *                     lesson:
 *                       $ref: '#/components/schemas/Lesson'
 *                     assignments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Assignment'
 *       403:
 *         description: Not enrolled in course
 *       404:
 *         description: Lesson not found
 *
 * @swagger
 * /assignments/course/{courseId}:
 *   get:
 *     summary: Get all assignments for a course
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of course assignments
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
 *                     assignments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         allOf:
 *                           - $ref: '#/components/schemas/Assignment'
 *                           - type: object
 *                             properties:
 *                               lessonTitle:
 *                                 type: string
 *
 * @swagger
 * /assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assignment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   allOf:
 *                     - $ref: '#/components/schemas/Assignment'
 *                     - type: object
 *                       properties:
 *                         submissionStatus:
 *                           type: string
 *                           enum: [not_submitted, submitted, graded]
 *                         submission:
 *                           $ref: '#/components/schemas/Submission'
 *
 * @swagger
 * /assignments/upcoming:
 *   get:
 *     summary: Get upcoming assignments
 *     tags: [Assignments]
 *     description: Get upcoming assignments for enrolled courses (Students only)
 *     responses:
 *       200:
 *         description: List of upcoming assignments
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
 *                       title:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                         format: date-time
 *                       points:
 *                         type: integer
 *                       courseTitle:
 *                         type: string
 *                       lessonTitle:
 *                         type: string
 *                       daysUntilDue:
 *                         type: integer
 *
 * @swagger
 * /assignments/lesson/{lessonId}:
 *   post:
 *     summary: Create assignment
 *     tags: [Assignments]
 *     description: Create a new assignment for a lesson (Instructors only)
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - dueDate
 *               - points
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: JavaScript Functions Assignment
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 example: Create a function that calculates the factorial of a number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-02-01T23:59:59Z
 *               points:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 100
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Validation error or due date in past
 *       403:
 *         description: Forbidden - Must be course instructor
 *
 * @swagger
 * /assignments/{id}:
 *   put:
 *     summary: Update assignment
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               points:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       403:
 *         description: Forbidden - Must be course instructor
 *       404:
 *         description: Assignment not found
 *
 * @swagger
 * /assignments/{id}:
 *   delete:
 *     summary: Delete assignment
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *       400:
 *         description: Cannot delete assignment with submissions
 *       403:
 *         description: Forbidden - Must be course instructor
 *       404:
 *         description: Assignment not found
 *
 * @swagger
 * /assignments/stats/instructor:
 *   get:
 *     summary: Get instructor assignment statistics
 *     tags: [Assignments]
 *     description: Get assignment statistics for all instructor's courses
 *     responses:
 *       200:
 *         description: Assignment statistics
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
 *                     totalAssignments:
 *                       type: integer
 *                     totalSubmissions:
 *                       type: integer
 *                     gradedSubmissions:
 *                       type: integer
 *                     pendingSubmissions:
 *                       type: integer
 *                     avgGrade:
 *                       type: number
 *       403:
 *         description: Forbidden - Instructors only
 */