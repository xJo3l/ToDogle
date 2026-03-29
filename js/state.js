

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
    let qtSelectedId = null;
    let qtExpandedIds = new Set();
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
        trash: [],
        colWidths: {},
        aiChats: [],
        activeAiChatId: null,
        aiResponseMode: 'planning',
        aiPendingFiles: []
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
      if (state.colWidths === undefined) state.colWidths = {};
      if (!Array.isArray(state.aiChats)) {
        if (Array.isArray(state.aiChat) && state.aiChat.length > 0) {
          const migratedMessages = state.aiChat.map(msg => ({ ...msg, id: msg.id || generateId() }));
          const migratedTitle = getAiSessionTitle(migratedMessages);
          const migratedAt = migratedMessages[0]?.timestamp || Date.now();
          state.aiChats = [{
            id: generateId(),
            title: migratedTitle,
            createdAt: migratedAt,
            updatedAt: migratedMessages[migratedMessages.length - 1]?.timestamp || migratedAt,
            messages: migratedMessages
          }];
          state.activeAiChatId = state.aiChats[0].id;
        } else {
          state.aiChats = [];
        }
      }
      delete state.aiChat;
      if (state.activeAiChatId && !state.aiChats.some(chat => chat.id === state.activeAiChatId)) {
        state.activeAiChatId = null;
      }
      if (state.aiResponseMode !== 'planning' && state.aiResponseMode !== 'fast') state.aiResponseMode = 'planning';
      if (!Array.isArray(state.aiPendingFiles)) state.aiPendingFiles = [];
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function today() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function toIsoDate(d) {
      if (!d) return null;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
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

    function isTaskInCategory(task, filter, inheritedDeadline = null) {
      if (!filter || filter === 'all') return true;
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

    function isTaskVisible(task, filter, inheritedDeadline = null) {
      if (task.completed && (filter && filter !== 'all')) return false;
      return isTaskInCategory(task, filter, inheritedDeadline);
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
          if (isTaskInCategory(c, filter, currentDeadline) && !c.archived) {
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
          if (!item.archived) result.push({ ...item, path: [...path], colName, colId, effectiveDueDate: item.dueDate || inheritedDeadline });
        } else if (item.itemType === 'group' && !item.archived) {
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

    function getAiGreetingText() {
      const { openTasks, importantTasks, datedTasks } = getAiContextSummary();
      if (importantTasks.length) {
        return `Hi, I'm your planning copilot. I can see important work like "${importantTasks[0].text}". Tell me what you're aiming for and I'll help you turn it into a clear plan.`;
      }
      if (datedTasks.length) {
        const nearest = datedTasks[0];
        return `Hi, I'm your planning copilot. Your next visible deadline looks like "${nearest.text}" on ${formatDateShort(nearest.effectiveDueDate || nearest.dueDate)}. Tell me the goal and I'll help you organize the next steps.`;
      }
      if (openTasks.length) {
        return `Hi, I'm your planning copilot. You have ${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} in ToDogle right now. Tell me what you want to make progress on and I'll help structure it.`;
      }
      return `Hi, I'm your planning copilot. Your board is pretty clear right now, which makes this a good moment to define your next goal. Tell me what you're working toward and I'll help map it out.`;
    }

    function createAiGreetingMessage() {
      return {
        id: generateId(),
        role: 'assistant',
        text: getAiGreetingText(),
        timestamp: Date.now()
      };
    }

    function getAiSessionTitle(messages) {
      const firstUser = (messages || []).find(msg => msg.role === 'user' && msg.text && msg.text.trim());
      if (!firstUser) return 'New chat';
      const plain = firstUser.text.trim().replace(/\s+/g, ' ');
      return plain.length > 32 ? plain.slice(0, 29) + '...' : plain;
    }

    function createAiSession() {
      const greeting = createAiGreetingMessage();
      return {
        id: generateId(),
        title: 'New chat',
        createdAt: greeting.timestamp,
        updatedAt: greeting.timestamp,
        messages: [greeting]
      };
    }

    function getActiveAiChat() {
      if (!state || !Array.isArray(state.aiChats)) return null;
      return state.aiChats.find(chat => chat.id === state.activeAiChatId) || null;
    }

    function formatChatDate(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    function getAiContextSummary() {
      const all = getAll();
      const openTasks = all.filter(i => i.itemType === 'task' && !i.completed && !i.archived);
      const importantTasks = openTasks.filter(i => i.important);
      const datedTasks = openTasks.filter(i => i.effectiveDueDate || i.dueDate)
        .sort((a, b) => parseDate(a.effectiveDueDate || a.dueDate) - parseDate(b.effectiveDueDate || b.dueDate))
        .slice(0, 3);

      return { openTasks, importantTasks, datedTasks };
    }

    function buildAiReply(prompt, mode = 'planning', files = []) {
      const text = prompt.trim();
      const lower = text.toLowerCase();
      const { openTasks, importantTasks, datedTasks } = getAiContextSummary();
      const focusLine = importantTasks.length
        ? `Your highest-signal focus looks like ${importantTasks.slice(0, 2).map(t => `"${t.text}"`).join(' and ')}.`
        : openTasks.length
          ? `You currently have ${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} in ToDogle.`
          : `Your board is pretty clear right now, so this is a good time to define the next milestone.`;
      const fileLine = files.length ? `I also noted ${files.length} attached file${files.length === 1 ? '' : 's'}. ` : '';

      if (mode === 'fast') {
        if (lower.includes('goal') || lower.includes('plan') || lower.includes('roadmap')) {
          return `${fileLine}${focusLine} Quick plan: choose one weekly outcome, split into three tasks, and start the smallest one today.`;
        }
        return `${fileLine}${focusLine} Share your goal in one line and I'll give a short next-step plan.`;
      }

      if (lower.includes('goal') || lower.includes('plan') || lower.includes('roadmap')) {
        const dueLine = datedTasks.length
          ? `Closest deadlines: ${datedTasks.map(t => `${t.text} (${formatDateShort(t.effectiveDueDate || t.dueDate)})`).join(', ')}.`
          : `I don't see near-term deadlines yet, so we can build the plan around momentum instead of urgency.`;
        return `${fileLine}${focusLine} Try this plan: 1. Pick one concrete outcome for this week. 2. Break it into 3 small tasks you can finish in under 30 minutes each. 3. Mark one as today's must-do. ${dueLine}`;
      }

      if (lower.includes('study') || lower.includes('learn') || lower.includes('exam')) {
        return `${fileLine}${focusLine} A strong study rhythm would be: one deep work block, one quick review block, and one recap note at the end of the day. If you want, paste the subject or exam and I can help you sketch a weekly schedule.`;
      }

      if (lower.includes('routine') || lower.includes('habit') || lower.includes('consisten')) {
        return `${fileLine}${focusLine} Keep the routine tiny at first: one anchor habit in the morning, one check-in at midday, and one reset task at night. The goal is consistency before intensity.`;
      }

      if (lower.includes('overwhelm') || lower.includes('stress') || lower.includes('stuck')) {
        return `${fileLine}${focusLine} When things feel crowded, shrink the horizon. Pick one task to finish, one task to move, and one task to ignore for today. That usually creates enough space to think clearly again.`;
      }

      return `${fileLine}${focusLine} I can help you turn that into a weekly plan, daily checklist, or a step-by-step breakdown. Share the goal in one sentence and I'll map out the next moves.`;
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
