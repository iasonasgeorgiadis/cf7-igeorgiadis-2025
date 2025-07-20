/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *       - in: query
 *         name: instructor
 *         schema:
 *           type: string
 *         description: Filter by instructor name
 *     responses:
 *       200:
 *         description: List of courses
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
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
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
 *                     - $ref: '#/components/schemas/Course'
 *                     - type: object
 *                       properties:
 *                         instructor:
 *                           $ref: '#/components/schemas/User'
 *                         isEnrolled:
 *                           type: boolean
 *                         enrollmentCount:
 *                           type: integer
 *       404:
 *         description: Course not found
 *
 * @swagger
 * /courses/my-courses:
 *   get:
 *     summary: Get instructor's courses
 *     tags: [Courses]
 *     description: Get all courses created by the authenticated instructor
 *     responses:
 *       200:
 *         description: List of instructor's courses
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Course'
 *                       - type: object
 *                         properties:
 *                           enrolledStudents:
 *                             type: integer
 *                           activeLessons:
 *                             type: integer
 *       403:
 *         description: Forbidden - Instructors only
 *
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     description: Create a new course (Instructors only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - code
 *               - description
 *               - credits
 *               - capacity
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: Introduction to JavaScript
 *               code:
 *                 type: string
 *                 pattern: '^[A-Z]{2,4}[0-9]{3,4}$'
 *                 example: CS101
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 example: Learn the fundamentals of JavaScript programming
 *               credits:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 6
 *                 example: 3
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 300
 *                 example: 30
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: []
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Instructors only
 *
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update course
 *     tags: [Courses]
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
 *               credits:
 *                 type: integer
 *               capacity:
 *                 type: integer
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       403:
 *         description: Forbidden - Must be course instructor
 *       404:
 *         description: Course not found
 *
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       400:
 *         description: Cannot delete course with active enrollments
 *       403:
 *         description: Forbidden - Must be course instructor
 *       404:
 *         description: Course not found
 *
 * @swagger
 * /courses/{id}/prerequisites/check:
 *   get:
 *     summary: Check prerequisites for a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Prerequisite check result
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
 *                     missingPrerequisites:
 *                       type: array
 *                       items:
 *                         type: string
 *                     completedPrerequisites:
 *                       type: array
 *                       items:
 *                         type: string
 */