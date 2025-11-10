// controllers/studentController.js
const db = require('../db/connect');
const { ObjectId } = require('mongodb'); // ← CORRECT WAY

exports.getStudentPortal = async (req, res) => {
  const user = req.session.user;
  let studentApp = null;
  let allStudents = [];

  try {
    // === 1. Get current student's application ===
    if (user.role === 'student' || user.role === 'admin') {
      studentApp = await db.getDb()
        .collection('applications')
        .findOne({ userId: new ObjectId(user.id) }); // ← FIXED
    }

    // === 2. Admin: Get ALL students ===
    if (user.role === 'admin') {
      // Ensure createdAt exists
      await db.getDb().collection('users').updateMany(
        { createdAt: { $exists: false } },
        { $set: { createdAt: new Date() } }
      );

      const cursor = db.getDb()
        .collection('users')
        .find({ role: 'student' })
        .sort({ createdAt: -1 });

      const students = await cursor.toArray();
      console.log(`DEBUG: Found ${students.length} students`);

      allStudents = await Promise.all(
        students.map(async (s) => {
          const app = await db.getDb()
            .collection('applications')
            .findOne({ userId: new ObjectId(s._id) }); // ← FIXED
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
