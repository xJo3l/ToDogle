

    /* ================================================================
       STATE MANAGEMENT
       ================================================================ */
    const STORAGE_KEY = 'todogle_state';
    let state = null;
    let currentView = 'home';
    let homeFilter = 'all';
    let addingTaskIn = null;
    let addingColNew = false;
    let calViewType = 'month';
    let modalTarget = null;
    let showMiniCal = false;
    let calendarDate = new Date();
    let lastCalScroll = 0;

    function generateId() { return '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

    const listColors = ['#4A9EFF', '#8B5CF6', '#14B8A6', '#F59E0B', '#EC4899'];
    function getListColor(index) { return listColors[index % listColors.length]; }

    const taskColors = ['#EC4899','#EF4444','#F59E0B','#22C55E','#14B8A6','#3B82F6','#8B5CF6','#6B7280'];
    function buildColorPicker(action, id, colId, currentColor) {
      let dots = '';
      taskColors.forEach(c => {
        const act = (currentColor === c) ? ' active' : '';
        dots += `<div class="color-dot${act}" data-action="${action}" data-color="${c}" data-id="${id}" data-col="${colId}" style="background:${c}"></div>`;
      });
      return `<div class="group-dropdown-item" style="flex-direction:column;align-items:flex-start;gap:6px;cursor:default">
        <span style="font-size:12px;color:#888">Color label</span>
        <div class="color-picker-row">${dots}</div>
      </div>`;
    }

    function defaultState() {
      const cols = [
        { name: 'My Tasks', icon: '📋' }
      ];
      return {
        columns: cols.map(c => ({ id: generateId(), name: c.name, icon: c.icon, items: [], completedCollapsed: true })),
        trash: []
      };
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { state = JSON.parse(raw); }
      } catch (e) { }
      if (!state) state = defaultState();
      if (!state.trash) state.trash = [];
      if (state.sbCollapsed === undefined) state.sbCollapsed = false;
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function today() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function parseDate(str) { if (!str) return null; const d = new Date(str + 'T00:00:00'); return isNaN(d) ? null : d; }
    function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
    function formatDateShort(str) {
      const d = parseDate(str); if (!d) return '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[d.getMonth()] + ' ' + d.getDate();
    }

    function deadlineColor(dateStr, isHome = false, isCompleted = false) {
      if (isCompleted) return 'gray';
      const dl = parseDate(dateStr); if (!dl) return '';
      const diff = daysBetween(today(), dl);
      if (diff < 0) return 'red';
      if (diff <= 2) return isHome ? 'gray' : 'red';
      if (diff <= 5) return 'yellow';
      return 'gray';
    }

    function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    function findById(items, id) {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.itemType === 'group' && item.children) {
          const found = findById(item.children, id);
          if (found) return found;
        }
      }
      return null;
    }

    function extractById(items, id) {
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) return items.splice(idx, 1)[0];
      for (const item of items) {
        if (item.itemType === 'group' && item.children) {
          const found = extractById(item.children, id);
          if (found) return found;
        }
      }
      return null;
    }

    function startInlineRename(targetEl, initialValue, onSave) {
      targetEl.innerHTML = `<input type="text" class="inline-rename-input" value="${escHtml(initialValue)}" style="width:100%;color:inherit;background:#222;border:1px solid #444;outline:none;padding:2px 4px;border-radius:4px;font-family:inherit;font-size:inherit" autofocus>`;
      const inp = targetEl.querySelector('input');
      const finish = (save) => {
        if (save) {
          const val = inp.value.trim();
          if (val) onSave(val);
        }
        render();
      };
      inp.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
        if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
      });
      inp.addEventListener('blur', () => finish(true));
      inp.addEventListener('click', ev => ev.stopPropagation());
      setTimeout(() => { inp.focus(); inp.select(); }, 50);
    }

    function isTaskVisible(task, filter, inheritedDeadline = null) {
      if (!filter || filter === 'all') return true;
      if (task.completed) return false;
      const effDue = task.dueDate || inheritedDeadline;
      if (!effDue) return false;
      const t = today();
      const d = parseDate(effDue);
      if (!d) return false;
      const diff = daysBetween(t, d);
      if (filter === 'today' && diff === 0) return true;
      if (filter === '5days' && diff >= 0 && diff <= 4) return true;
      if (filter === '10days' && diff >= 0 && diff <= 9) return true;
      return false;
    }

    function countCompletedTasks(g) {
      let count = 0;
      for (const c of (g.children || [])) {
        if (c.itemType === 'task' && c.completed && !c.archived) count++;
        else if (c.itemType === 'group' && !c.archived) count += countCompletedTasks(c);
      }
      return count;
    }

    function getProgress(group, filter, inheritedDeadline = null) {
      if (!group.children) return { completed: 0, total: 0 };
      let total = 0, completed = 0;
      const currentDeadline = group.deadline || inheritedDeadline;
      for (const c of group.children) {
        if (c.itemType === 'task') {
          if (isTaskVisible(c, filter, currentDeadline) && !c.archived) {
            total++;
            if (c.completed) completed++;
          }
        } else if (c.itemType === 'group' && !c.archived) {
          const pg = getProgress(c, filter, currentDeadline);
          if (pg.total > 0) {
            total++;
            if (pg.completed === pg.total) completed++;
          }
        }
      }
      return { completed, total };
    }

    function isGroupComplete(group, filter, inheritedDeadline = null) {
      const pg = getProgress(group, filter, inheritedDeadline);
      return pg.total > 0 && pg.completed === pg.total;
    }

    function hasOverdueChild(group, filter, inheritedDeadline = null) {
      if (!group.children) return false;
      const t = today();
      const currentDeadline = group.deadline || inheritedDeadline;
      for (const c of group.children) {
        if (c.itemType === 'task' && !c.completed && isTaskVisible(c, filter, currentDeadline)) {
          const effDue = c.dueDate || currentDeadline;
          if (effDue) {
            const d = parseDate(effDue);
            if (d && d < t) return true;
          }
        }
        if (c.itemType === 'group' && hasOverdueChild(c, filter, currentDeadline)) return true;
      }
      return false;
    }

    function moveToTrash(id, colId) {
      const list = state.columns.find(c => c.id === colId);
      if (!list) return;
      const item = extractById(list.items, id);
      if (item) {
        state.trash.push({ deletedAt: new Date().toISOString(), item, listId: colId });
        saveState();
      }
    }

    /* ================================================================
       DATA AGGREGATORS
       ================================================================ */
    function getAllTasksNested(items, path, colName, colId, result, inheritedDeadline = null) {
      for (const item of items) {
        if (item.itemType === 'task') {
          result.push({ ...item, path: [...path], colName, colId, effectiveDueDate: item.dueDate || inheritedDeadline });
        } else if (item.itemType === 'group') {
          if (item.deadline) {
            result.push({ ...item, path: [...path], colName, colId }); // group itself as deadline item
          }
          const currentDeadline = item.deadline || inheritedDeadline;
          getAllTasksNested(item.children || [], [...path, item.name], colName, colId, result, currentDeadline);
        }
      }
    }

    function getAll() {
      const all = [];
      state.columns.forEach(col => getAllTasksNested(col.items, [], col.name, col.id, all));
      return all;
    }

    /* ================================================================
       EMOJI PICKER
       ================================================================ */
    const emojiCategories = [
      { name: 'Common', emojis: ['📋', '✅', '📌', '🔖', '⭐', '🏠', '💡', '🎯', '🔥', '⚡', '💎', '🛠️', '📊', '📈', '🗂️', '🗃️'] },
      { name: 'Study/Work', emojis: ['📚', '📖', '✏️', '🖊️', '📝', '💼', '🏫', '🎓', '🔬', '💻', '🖥️', '⌨️', '📐', '📏', '🔭'] },
      { name: 'Life', emojis: ['🏃', '💪', '🧘', '🍎', '💊', '🛒', '🏋️', '🚗', '✈️', '🏖️', '🎵', '🎮', '📷', '🌱', '☕'] },
      { name: 'Projects', emojis: ['🚀', '🛸', '🌍', '🔮', '🎨', '🏗️', '⚙️', '🔧', '🔩', '🧩', '🎲', '🏆', '🥇', '💰', '📡'] },
      { name: 'People', emojis: ['👥', '👤', '🤝', '💬', '📞', '📧', '❤️', '🧠', '👁️', '🙏', '🫂', '🤖', '👨‍💻', '👩‍💻', '🧑‍🎓'] }
    ];

    let emojiPickerTargetCol = null;

    const lucideIconList = [
      'folder','book-open','briefcase','star','bookmark','tag','flag','zap','clipboard','layers',
      'pencil','lightbulb','globe','code','music','bell','graduation-cap','list','cpu','heart',
      'camera','coffee','compass','dumbbell','film','flask-conical','gamepad-2','gift','hammer',
      'headphones','home','inbox','key','leaf','map','microscope','moon','palette','plane','rocket',
      'shield','shopping-cart','sun','target','terminal','tree-pine','trophy','umbrella','user','wallet'
    ];

    function renderLucideIcons() {
      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
      }
    }

    function filterIconPicker(query) {
      const grid = document.getElementById('lpGrid');
      if (!grid) return;
      const q = query.toLowerCase();
      const filtered = q ? lucideIconList.filter(n => n.includes(q)) : lucideIconList;
      if (filtered.length === 0) {
        grid.innerHTML = `<div class="ep-empty">No icon found</div>`;
        return;
      }
      grid.innerHTML = filtered.map(name =>
        `<div class="ep-emoji" data-action="lp-select" data-icon="${name}" title="${name}" style="display:flex;align-items:center;justify-content:center;color:#a0a0a0;width:32px;height:32px">
          <i data-lucide="${name}" style="width:18px;height:18px;stroke:#a0a0a0;stroke-width:1.5"></i>
        </div>`
      ).join('');
      renderLucideIcons();
    }

    function filterEmojiPicker(query) { filterIconPicker(query); }
