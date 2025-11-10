// controllers/studentController.js
const db = require('../db/connect');
const ObjectId = require('mongodb').ObjectId;

exports.getStudentPortal = async (req, res) => {
  const user = req.session.user;
  let studentApp = null;
  let allStudents = [];

  try {
    // === 1. Get current student's application ===
    if (user.role === 'student' || user.role === 'admin') {
      studentApp = await db.getDb()
        .collection('applications')
        .findOne({ userId: ObjectId(user.id) });
    }

    // === 2. Admin: Get ALL students ===
    if (user.role === 'admin') {
      // First, ensure createdAt exists (run once, or auto-add)
      await db.getDb().collection('users').updateMany(
        { createdAt: { $exists: false } },
        { $set: { createdAt: new Date() } }
      );

      const cursor = db.getDb()
        .collection('users')
        .find({ role: 'student' })  // Exact match
        .sort({ createdAt: -1 });   // Falls back if missing

      const students = await cursor.toArray();
      console.log(`DEBUG: Found ${students.length} students with role 'student'`);  // ← Check server logs

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
      console.log(`DEBUG: Enriched students:`, allStudents.map(s => ({ name: s.name, role: s.role })));  // ← Logs names
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
