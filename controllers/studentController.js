// controllers/studentController.js
const db = require('../db/connect');
const ObjectId = require('mongodb').ObjectId;

exports.getStudentPortal = async (req, res) => {
  const user = req.session.user;
  let studentApp = null;
  let allStudents = [];

  try {
    // === 1. Get current student's application (if any) ===
    if (user.role === 'student' || user.role === 'admin') {
      studentApp = await db.getDb()
        .collection('applications')
        .findOne({ userId: ObjectId(user.id) });
    }

    // === 2. Admin: Get ALL students (users with role 'student') ===
    if (user.role === 'admin') {
      const cursor = db.getDb()
        .collection('users')
        .find({ role: 'student' })
        .sort({ createdAt: -1 });

      const students = await cursor.toArray();

      // Enrich with application data
      allStudents = await Promise.all(
        students.map(async (s) => {
          const app = await db.getDb()
            .collection('applications')
            .findOne({ userId: ObjectId(s._id) });
          return {
            ...s,
            application: app || { status: 'No Application', program: '—', semester: '—' }
          };
        })
      );
    }

    res.render('student-portal', {
      title: 'Student Portal',
      user,
      studentApp,
      allStudents,
      error: null
    });
  } catch (err) {
    console.error('Student portal error:', err);
    res.render('student-portal', {
      title: 'Student Portal',
      user,
      studentApp: null,
      allStudents: [],
      error: 'Failed to load portal.'
    });
  }
};
