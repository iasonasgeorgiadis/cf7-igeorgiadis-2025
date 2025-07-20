/**
 * @swagger
 * /assignments/{assignmentId}/submit:
 *   post:
 *     summary: Submit assignment
 *     tags: [Submissions]
 *     description: Submit an assignment (Students only)
 *     parameters:
 *       - in: path
 *         name: assignmentId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 example: Here is my solution to the assignment...
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [solution.js, readme.md]
 *     responses:
 *       201:
 *         description: Assignment submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Already submitted or past due date
 *       403:
 *         description: Forbidden - Students only
 *       404:
 *         description: Assignment not found
 *
 * @swagger
 * /submissions/{id}:
 *   get:
 *     summary: Get submission by ID
 *     tags: [Submissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission details
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
 *                     - $ref: '#/components/schemas/Submission'
 *                     - type: object
 *                       properties:
 *                         assignment:
 *                           $ref: '#/components/schemas/Assignment'
 *                         student:
 *                           $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden - Can only view own submissions
 *       404:
 *         description: Submission not found
 *
 * @swagger
 * /submissions/pending:
 *   get:
 *     summary: Get pending submissions
 *     tags: [Submissions]
 *     description: Get all pending submissions for instructor's courses
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of pending submissions
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
 *                     submissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           assignment:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               courseTitle:
 *                                 type: string
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                           isLate:
 *                             type: boolean
 *                     total:
 *                       type: integer
 *       403:
 *         description: Forbidden - Instructors only
 *
 * @swagger
 * /assignments/{assignmentId}/submissions:
 *   get:
 *     summary: Get submissions for assignment
 *     tags: [Submissions]
 *     description: Get all submissions for an assignment (Instructors only)
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of submissions
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
 *                     assignment:
 *                       $ref: '#/components/schemas/Assignment'
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Submission'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         graded:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         avgGrade:
 *                           type: number
 *
 * @swagger
 * /assignments/{assignmentId}/submission:
 *   get:
 *     summary: Get student's submission
 *     tags: [Submissions]
 *     description: Get the authenticated student's submission for an assignment
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student's submission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       404:
 *         description: No submission found
 *
 * @swagger
 * /submissions/{id}/grade:
 *   put:
 *     summary: Grade submission
 *     tags: [Submissions]
 *     description: Grade a student's submission (Instructors only)
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
 *             required:
 *               - grade
 *             properties:
 *               grade:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *               feedback:
 *                 type: string
 *                 minLength: 10
 *                 example: Good work! Consider adding more comments to your code.
 *     responses:
 *       200:
 *         description: Submission graded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       403:
 *         description: Forbidden - Must be assignment instructor
 *       404:
 *         description: Submission not found
 *
 * @swagger
 * /courses/{courseId}/submissions:
 *   get:
 *     summary: Get course submissions
 *     tags: [Submissions]
 *     description: Get all submissions for a student in a course
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of course submissions
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
 *                     submissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           assignment:
 *                             $ref: '#/components/schemas/Assignment'
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                           grade:
 *                             type: integer
 *                           feedback:
 *                             type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalSubmissions:
 *                           type: integer
 *                         gradedSubmissions:
 *                           type: integer
 *                         avgGrade:
 *                           type: number
 *
 * @swagger
 * /courses/{courseId}/submission-stats:
 *   get:
 *     summary: Get course submission statistics
 *     tags: [Submissions]
 *     description: Get submission statistics for a course (Instructors only)
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course submission statistics
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
 *                     gradeDistribution:
 *                       type: object
 *                       properties:
 *                         A:
 *                           type: integer
 *                         B:
 *                           type: integer
 *                         C:
 *                           type: integer
 *                         D:
 *                           type: integer
 *                         F:
 *                           type: integer
 *
 * @swagger
 * /submissions/{id}:
 *   delete:
 *     summary: Delete submission
 *     tags: [Submissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *       403:
 *         description: Cannot delete graded submission
 *       404:
 *         description: Submission not found
 */