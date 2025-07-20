/**
 * @swagger
 * /courses/{courseId}/lessons:
 *   get:
 *     summary: Get all lessons for a course
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of lessons
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
 *                     $ref: '#/components/schemas/Lesson'
 *       403:
 *         description: Not enrolled in course
 *       404:
 *         description: Course not found
 *
 * @swagger
 * /lessons/{id}:
 *   get:
 *     summary: Get lesson by ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lesson details
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
 *                     - $ref: '#/components/schemas/Lesson'
 *                     - type: object
 *                       properties:
 *                         course:
 *                           $ref: '#/components/schemas/Course'
 *                         assignments:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Assignment'
 *       403:
 *         description: Not enrolled in course
 *       404:
 *         description: Lesson not found
 *
 * @swagger
 * /courses/{courseId}/lessons:
 *   post:
 *     summary: Create a new lesson
 *     tags: [Lessons]
 *     description: Create a new lesson for a course (Instructors only)
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *               - content
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: Introduction to Variables
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 example: Learn about JavaScript variables and data types
 *               content:
 *                 type: string
 *                 minLength: 50
 *                 example: In this lesson, we will explore...
 *               duration:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 300
 *                 example: 45
 *               order:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Lesson'
 *       403:
 *         description: Forbidden - Must be course instructor
 *       404:
 *         description: Course not found
 *
 * @swagger
 * /lessons/{id}:
 *   put:
 *     summary: Update lesson
 *     tags: [Lessons]
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
 *               content:
 *                 type: string
 *               duration:
 *                 type: integer
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *       403:
 *         description: Forbidden - Must be course instructor
 *       404:
 *         description: Lesson not found
 *
 * @swagger
 * /lessons/{id}:
 *   delete:
 *     summary: Delete lesson
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lesson deleted successfully
 *       400:
 *         description: Cannot delete lesson with assignments
 *       403:
 *         description: Forbidden - Must be course instructor
 *       404:
 *         description: Lesson not found
 *
 * @swagger
 * /courses/{courseId}/lessons/reorder:
 *   put:
 *     summary: Reorder lessons
 *     tags: [Lessons]
 *     description: Reorder lessons within a course (Instructors only)
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *               - lessons
 *             properties:
 *               lessons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - order
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     order:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       200:
 *         description: Lessons reordered successfully
 *       403:
 *         description: Forbidden - Must be course instructor
 *       404:
 *         description: Course not found
 *
 * @swagger
 * /courses/{courseId}/lessons/progress:
 *   get:
 *     summary: Get lesson progress
 *     tags: [Lessons]
 *     description: Get student's progress for lessons in a course
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lesson progress information
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
 *                     totalLessons:
 *                       type: integer
 *                     completedLessons:
 *                       type: integer
 *                     progressPercentage:
 *                       type: number
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           isCompleted:
 *                             type: boolean
 *                           completionDate:
 *                             type: string
 *                             format: date-time
 *       403:
 *         description: Forbidden - Students only
 *       404:
 *         description: Course not found or not enrolled
 */