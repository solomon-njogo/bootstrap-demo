const form = document.getElementById('studentForm');
const nameInput = document.getElementById('nameInput');
const courseInput = document.getElementById('courseInput');
const formAlert = document.getElementById('formAlert');
const studentsTableBody = document.getElementById('studentsTableBody');
const studentCount = document.getElementById('studentCount');

function showAlert(message) {
  formAlert.textContent = message;
  formAlert.classList.remove('d-none');
}

function hideAlert() {
  formAlert.classList.add('d-none');
  formAlert.textContent = '';
}

function renderStudents(students) {
  studentCount.textContent = String(students.length);

  if (students.length === 0) {
    studentsTableBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-muted py-4">No students yet. Add one with the form.</td></tr>';
    return;
  }

  studentsTableBody.innerHTML = students
    .map(
      (s) => `
      <tr>
        <td>${s.id}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.course)}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-danger" data-id="${s.id}">
            Delete
          </button>
        </td>
      </tr>`
    )
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadStudents() {
  const res = await fetch('/api/students');
  if (!res.ok) {
    throw new Error('Could not load students.');
  }
  const students = await res.json();
  renderStudents(students);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAlert();

  const name = nameInput.value.trim();
  const course = courseInput.value.trim();

  if (!name || !course) {
    showAlert('Please fill in both name and course.');
    return;
  }

  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, course }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    showAlert(data.error || 'Could not save the student.');
    return;
  }

  form.reset();
  nameInput.focus();
  await loadStudents();
});

studentsTableBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;

  const id = button.getAttribute('data-id');
  const res = await fetch('/api/students/' + id, { method: 'DELETE' });

  if (!res.ok && res.status !== 204) {
    showAlert('Could not delete that student.');
    return;
  }

  hideAlert();
  await loadStudents();
});

loadStudents().catch(() => {
  studentsTableBody.innerHTML =
    '<tr><td colspan="4" class="text-center text-danger py-4">Could not reach the API.</td></tr>';
});
