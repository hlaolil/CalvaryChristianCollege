// controllers/studentController.js
const db = require('../db/connect');
const { paginate, emptyPage } = require('../utils/pagination');

const NO_APPLICATION = { status: 'No Application', program: '—', semester: '—' };

exports.getStudentPortal = async (req, res, next) => {
  const user = req.session.user;
  let studentApp = null;
  let allStudents = [];
  let page = emptyPage('page');

  try {
    const database = db.getDb();

    // === 1. Current student's application (students promoted from applicants have one) ===
    if (user.role === 'student') {
      studentApp = await database.collection('applications').findOne({ userId: user.id });
    }

    // === 2. Admin: one page of students, joined to their applications in a single query ===
    if (user.role === 'admin') {
      let students;
      ({ items: students, page } = await paginate(database.collection('users'), {
        query: { role: 'student' },
        sort: { createdAt: -1 },
        projection: { name: 1, email: 1, studentNumber: 1, phoneNumber: 1, programOfStudy: 1, createdAt: 1 },
        pageParam: 'page',
        req
      }));

      const ids = students.map(s => s._id.toString());
      const applications = await database.collection('applications')
        .find({ userId: { $in: ids } })
        .project({ userId: 1, status: 1, program: 1, semester: 1, submittedAt: 1 })
        .toArray();
      const byUser = new Map(applications.map(a => [a.userId, a]));

      allStudents = students.map(s => ({
        ...s,
        application: byUser.get(s._id.toString()) || NO_APPLICATION
      }));
    }

    res.render('student-portal', {
      title: 'Student Portal',
      studentApp,
      allStudents,
      page,
      error: null
    });
  } catch (err) {
    next(err);
  }
};
