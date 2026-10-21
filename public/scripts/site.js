// public/scripts/site.js – shared behaviour for every page.
// Loaded with `defer`, so the DOM is ready when this runs.

// ---------- Mobile navigation ----------
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  menu.querySelectorAll('a, button').forEach(el => el.addEventListener('click', () => setOpen(false)));
})();

// ---------- Dialogs (Donate) ----------
(function () {
  document.querySelectorAll('[data-open-dialog]').forEach(button => {
    const dialog = document.getElementById(button.dataset.openDialog);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    button.addEventListener('click', () => dialog.showModal());
  });

  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelectorAll('[data-close-dialog]').forEach(btn =>
      btn.addEventListener('click', () => dialog.close())
    );
    // Clicking the backdrop (outside the content) closes the dialog; Esc is built in
    dialog.addEventListener('click', e => {
      if (e.target === dialog) dialog.close();
    });
  });
})();

// ---------- Restore form values after a server-side validation error ----------
// Forms carry their previous values as JSON in data-restore.
(function () {
  document.querySelectorAll('form[data-restore]').forEach(form => {
    let values;
    try {
      values = JSON.parse(form.dataset.restore || '{}');
    } catch (_) {
      return;
    }
    Object.entries(values).forEach(([name, value]) => {
      if (typeof value !== 'string' || !value) return;
      const field = form.elements.namedItem(name);
      if (!field || field.readOnly || field.type === 'password' || field.type === 'hidden') return;
      field.value = value;
    });
  });
})();

// ---------- Register: show the fields for the chosen role ----------
(function () {
  const roleSelect = document.getElementById('role');
  const adminSecretDiv = document.getElementById('admin-secret');
  const studentDiv = document.getElementById('student-fields');
  if (!roleSelect || !adminSecretDiv || !studentDiv) return;

  function toggleFields() {
    const role = roleSelect.value;
    adminSecretDiv.hidden = role !== 'admin';
    studentDiv.hidden = role !== 'student';
    document.getElementById('adminSecret').required = role === 'admin';
    document.getElementById('studentNumber').required = role === 'student';
    document.getElementById('programOfStudy').required = role === 'student';
  }

  roleSelect.addEventListener('change', toggleFields);
  toggleFields();
})();

// ---------- Sortable tables ----------
// <th class="sortable" data-sort="text|date|status"> sorts its column on click.
// Date cells carry an ISO timestamp in data-value. A first column headed "#"
// is renumbered after sorting.
(function () {
  const STATUS_ORDER = { pending: 0, approved: 1, rejected: 2 };

  function cellValue(row, index) {
    const cell = row.children[index];
    return cell ? (cell.dataset.value ?? cell.textContent).trim() : '';
  }

  function compare(a, b, type) {
    if (type === 'date') {
      // Empty dates ('' or '—') always sort last
      const ta = Date.parse(a), tb = Date.parse(b);
      if (isNaN(ta) || isNaN(tb)) return isNaN(ta) - isNaN(tb);
      return ta - tb;
    }
    if (type === 'status') {
      return (STATUS_ORDER[a.toLowerCase()] ?? 99) - (STATUS_ORDER[b.toLowerCase()] ?? 99);
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  document.querySelectorAll('table').forEach(table => {
    const headers = table.querySelectorAll('th.sortable');
    const tbody = table.querySelector('tbody');
    if (!headers.length || !tbody) return;
    const firstHeader = table.querySelector('thead th');
    const renumber = firstHeader && firstHeader.textContent.trim() === '#';

    headers.forEach(header => {
      header.tabIndex = 0;
      header.setAttribute('aria-sort', 'none');

      function sort() {
        const index = Array.from(header.parentNode.children).indexOf(header);
        const ascending = header.getAttribute('aria-sort') !== 'ascending';
        headers.forEach(h => {
          h.classList.remove('asc', 'desc');
          h.setAttribute('aria-sort', 'none');
        });
        header.classList.add(ascending ? 'asc' : 'desc');
        header.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');

        const type = header.dataset.sort || 'text';
        const rows = Array.from(tbody.rows);
        rows.sort((ra, rb) => {
          const result = compare(cellValue(ra, index), cellValue(rb, index), type);
          return ascending ? result : -result;
        });
        const offset = parseInt(table.dataset.offset || '0', 10);
        rows.forEach((row, i) => {
          tbody.appendChild(row);
          if (renumber) row.children[0].textContent = offset + i + 1;
        });
      }

      header.addEventListener('click', sort);
      header.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          sort();
        }
      });
    });
  });
})();
