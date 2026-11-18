const path = require('path');
const express = require('express');

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'students.db');

function openDatabase() {
  try {
    const Database = require('better-sqlite3');
    const db = new Database(DB_PATH);
    return {
      exec(sql) {
        db.exec(sql);
      },
      prepare(sql) {
        const stmt = db.prepare(sql);
        return {
          all(...params) {
            return stmt.all(...params);
          },
          get(...params) {
            return stmt.get(...params);
          },
          run(...params) {
            return stmt.run(...params);
          },
        };
      },
    };
  } catch (err) {
    console.warn('better-sqlite3 unavailable, using node:sqlite:', err.message);
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(DB_PATH);
    return {
      exec(sql) {
        db.exec(sql);
      },
      prepare(sql) {
        const stmt = db.prepare(sql);
        return {
          all(...params) {
            return stmt.all(...params);
          },
          get(...params) {
            return stmt.get(...params);
          },
          run(...params) {
            return stmt.run(...params);
          },
        };
      },
    };
  }
}

const db = openDatabase();

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    course TEXT NOT NULL
  )
`);

const countRow = db.prepare('SELECT COUNT(*) AS count FROM students').get();
if (countRow.count === 0) {
  const insert = db.prepare('INSERT INTO students (name, course) VALUES (?, ?)');
  insert.run('Amina Otieno', 'SWE 4070');
  insert.run('James Kamau', 'SWE 3010');
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));

app.get('/api/students', (req, res) => {
  const students = db.prepare('SELECT id, name, course FROM students ORDER BY id').all();
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const course = String(req.body?.course || '').trim();

  if (!name || !course) {
    return res.status(400).json({ error: 'Name and course are required.' });
  }

  const result = db.prepare('INSERT INTO students (name, course) VALUES (?, ?)').run(name, course);
  const student = db.prepare('SELECT id, name, course FROM students WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(student);
});

app.delete('/api/students/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid student id.' });
  }

  const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Bootstrap demo running at http://localhost:${PORT}`);
});
