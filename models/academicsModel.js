const { getDb } = require('../db/connect');

async function getAllCourses() {
  const db = getDb();
  return db.collection('courses').find().toArray();
}

async function addCourse(course) {
  const db = getDb();
  return db.collection('courses').insertOne(course);
}

module.exports = { getAllCourses, addCourse };
