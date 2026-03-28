    /* ================================================================
       EVENTS
       ================================================================ */

    document.getElementById('calPopupClose').addEventListener('click', () => { document.getElementById('calPopup').classList.remove('show'); });

    document.addEventListener('wheel', e => {
      if (currentView !== 'calendar') return;
      const calView = e.target.closest('.cal-view');
      if (!calView) return;

      const now = Date.now();
      if (now - lastCalScroll < 500) return; // 500ms cooldown

      if (Math.abs(e.deltaY) < 20) return; // Ignore small scrolls

      if (e.deltaY > 0) {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        lastCalScroll = now;
        renderMainContent();
      } else if (e.deltaY < 0) {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        lastCalScroll = now;
        renderMainContent();
      }
    }, { passive: true });

    let lastIsMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile !== lastIsMobile) {
        lastIsMobile = isMobile;
        render();
      }
    });

    document.addEventListener('click', e => {

      const btn = e.target.closest('[data-action]');
      if (e.target.closest('.sb-settings-icon') == null && e.target.closest('.settings-dropdown') == null) {
        document.getElementById('sbSettings')?.classList.remove('show');
      }
      if (!e.target.closest('.top-add-btn') && !e.target.closest('.list-more-btn') && !e.target.closest('.header-dropdown') && !e.target.closest('.sb-list-more') && !e.target.closest('.sb-dropdown') && !e.target.closest('.group-dropdown')) {
        document.querySelectorAll('.header-dropdown, .sb-dropdown, .group-dropdown').forEach(d => d.classList.remove('show'));
      }
      if (!btn) return;
      const a = btn.dataset.action;

      if (a === 'nav') {
        currentView = btn.dataset.view;
        // Close mobile sidebar if open
        document.getElementById('sidebar')?.classList.remove('mobile-open');
        document.getElementById('sidebarOverlay')?.classList.remove('show');
        render();
      }
      else if (a === 'toggle-mobile-sidebar') {
        document.getElementById('sidebar')?.classList.toggle('mobile-open');
        document.getElementById('sidebarOverlay')?.classList.toggle('show');
      }
      else if (a === 'set-home-filter') {
        homeFilter = btn.dataset.filter; render();
      }
      else if (a === 'toggle-home-group') {
        for (const col of state.columns) {
          const group = findById(col.items, btn.dataset.id);
          if (group) { group.homeCollapsed = (group.homeCollapsed === false ? true : false); saveState(); render(); break; }
        }
      }
      else if (a === 'toggle-list-add') {
        e.stopPropagation();
        document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
        document.getElementById('addMenu-' + btn.dataset.id)?.classList.add('show');
      }
      else if (a === 'toggle-list-more') {
        e.stopPropagation();
        document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
        document.getElementById('moreMenu-' + btn.dataset.id)?.classList.add('show');
      }
      else if (a === 'toggle-cal') {
        showMiniCal = !showMiniCal;
        renderSidebar();
      }
      else if (a === 'toggle-sb-collapse') {
        state.sbCollapsed = !state.sbCollapsed;
        saveState();
        const sb = document.querySelector('.sidebar');
        if (sb) {
          if (state.sbCollapsed) sb.classList.add('collapsed');
          else sb.classList.remove('collapsed');
        }
        renderSidebar(); // re-render to change chevron direction
      }
      else if (a === 'toggle-settings') {
        document.getElementById('sbSettings')?.classList.toggle('show');
      }
      else if (a === 'clear-data') {
        if (confirm('Wipe everything?')) { state = defaultState(); saveState(); currentView = 'home'; render(); }
      }
      else if (a === 'export-data') {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const aLink = document.createElement('a');
        aLink.href = url;
        const todayStr = new Date().toISOString().split('T')[0];
        aLink.download = `todogle-backup-${todayStr}.json`;
        aLink.click();
        URL.revokeObjectURL(url);
        showToast('Data exported successfully');
        document.getElementById('sbSettings').classList.remove('show');
      }
      else if (a === 'import-data') {
        const input = document.getElementById('importFile');
        input.onchange = (ev) => {
          const file = ev.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (re) => {
            try {
              const parsed = JSON.parse(re.target.result);
              if (!parsed || !Array.isArray(parsed.columns)) throw new Error('Invalid structure');
              if (confirm('This will replace all current data. Continue?')) {
                state = parsed;
                saveState();
                currentView = 'home';
                render();
                showToast('Data imported successfully');
              }
            } catch (err) {
              showToast('Invalid backup file', true);
            }
          };
          reader.readAsText(file);
          input.value = '';
        };
        input.click();
        document.getElementById('sbSettings').classList.remove('show');
      }
      else if (a === 'add-col') {
        addingColNew = true; renderSidebar();
      }
      else if (a === 'delete-col') {
        if (confirm('Delete entire list?')) {
          state.columns = state.columns.filter(c => c.id !== btn.dataset.col);
          currentView = 'home'; saveState(); render();
        }
      }
      else if (a === 'rename-col') {
        e.stopPropagation();
        const colId = btn.dataset.col;
        const nameSpan = document.querySelector(`.list-name-txt[data-col="${colId}"]`);
        if (nameSpan) {
          const c = state.columns.find(x => x.id === colId);
          if (c) startInlineRename(nameSpan, c.name, (v) => { c.name = v; saveState(); });
        }
      }
      else if (a === 'toggle-task') {
        e.stopPropagation();
        const col = state.columns.find(c => c.id === btn.dataset.col);
        if (col) {
          const task = findById(col.items, btn.dataset.id);
          if (task) {
            task.completed = !task.completed;
            saveState();
            render();
          }
        }
      }
      else if (a === 'toggle-important') {
        const col = state.columns.find(c => c.id === btn.dataset.col);
        if (col) {
          const trg = findById(col.items, btn.dataset.id);
          if (trg) { trg.important = !trg.important; saveState(); render(); }
        }
      }
      else if (a === 'delete-task' || a === 'delete-group') {
        moveToTrash(btn.dataset.id, btn.dataset.col);
        render();
      }
      else if (a === 'rename-group') {
        e.stopPropagation();
        const colId = btn.dataset.col;
        const groupId = btn.dataset.id;
        const grpEl = document.querySelector(`[data-group-id="${groupId}"]`);
        if (grpEl) {
          const nameEl = grpEl.querySelector('.toggle-name, .home-group-name');
          const col = state.columns.find(c => c.id === colId);
          if (col && nameEl) {
            const grp = findById(col.items, groupId);
            if (grp) startInlineRename(nameEl, grp.name, (v) => { grp.name = v; saveState(); });
          }
        }
      }
      else if (a === 'rename-task') {
        e.stopPropagation();
        const colId = btn.dataset.col;
        const taskId = btn.dataset.id;
        const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskEl) {
          const nameEl = taskEl.querySelector('.task-name-txt, .home-task-name');
          const col = state.columns.find(c => c.id === colId);
          if (col && nameEl) {
            const task = findById(col.items, taskId);
            if (task) startInlineRename(nameEl, task.text, (v) => { task.text = v; saveState(); });
          }
        }
      }
      else if (a === 'show-add-task-modal' || a === 'show-add-task') {
        const targetId = btn.dataset.target || (state.columns.find(c => c.name.toLowerCase().includes('task'))?.id || state.columns[0]?.id);
        if (targetId) {
          addingTaskIn = targetId;
          const col = state.columns.find(c => c.id === targetId);
          if (col && currentView !== targetId && !btn.dataset.target) {
            currentView = targetId;
          }
          render();
          setTimeout(() => document.querySelector(`[data-task-input="${targetId}"]`)?.focus(), 150);
        }
      }
      else if (a === 'clear-list-completed') {
        const colId = btn.dataset.col;
        const col = state.columns.find(c => c.id === colId);
        if (col && confirm(`Permanently delete all completed tasks from ${col.name}?`)) {
          const clean = (items) => items.filter(i => {
            if (i.archived) return false;
            if (i.itemType === 'group' && i.children) i.children = clean(i.children);
            return true;
          });
          col.items = clean(col.items);
          saveState(); render(); showToast('Cleared list history');
        }
      }
      else if (a === 'delete-archived') {
        const colId = btn.dataset.col;
        const id = btn.dataset.id;
        const col = state.columns.find(c => c.id === colId);
        if (col) {
          const recursivelyFindAndRemove = (items, targetId) => {
            const idx = items.findIndex(i => i.id === targetId);
            if (idx !== -1) { items.splice(idx, 1); return true; }
            for (const item of items) {
              if (item.itemType === 'group' && item.children) {
                if (recursivelyFindAndRemove(item.children, targetId)) return true;
              }
            }
            return false;
          };
          recursivelyFindAndRemove(col.items, id);
          saveState(); render();
        }
      }
      else if (a === 'cancel-task') {
        addingTaskIn = null; render();
      }
      else if (a === 'show-add-group') {
        modalTarget = { columnId: btn.dataset.col, parentId: btn.dataset.target };
        document.getElementById('modalName').value = '';
        document.getElementById('modalStartDate').value = '';
        document.getElementById('modalDeadline').value = '';
        document.getElementById('groupModal').classList.add('show');
        setTimeout(() => document.getElementById('modalName')?.focus(), 50);
      }
      else if (a === 'empty-trash') {
        if (confirm('Empty entire trash completely?')) { state.trash = []; saveState(); render(); }
      }
      else if (a === 'restore-trash') {
        const idx = parseInt(btn.dataset.idx);
        const tItem = state.trash[idx];
        if (tItem) {
          const col = state.columns.find(c => c.id === tItem.listId);
          if (col) {
            col.items.push(tItem.item);
            state.trash.splice(idx, 1);
            saveState(); render();
          } else alert('Original list deleted!');
        }
      }
      else if (a === 'lp-open') {
        e.stopPropagation();
        emojiPickerTargetCol = btn.dataset.col;
        let lp = document.getElementById('emojiPicker');
        if (!lp) {
          document.body.insertAdjacentHTML('beforeend', `
        <div id="emojiPicker">
          <input type="text" id="epSearch" class="ep-search" placeholder="Search icon..." autocomplete="off">
          <div id="lpGrid" class="ep-grid"></div>
        </div>
      `);
          document.getElementById('epSearch').addEventListener('input', ev => filterIconPicker(ev.target.value));
        }
        lp = document.getElementById('emojiPicker');
        const rect = btn.getBoundingClientRect();
        lp.style.left = (rect.left) + 'px';
        lp.style.top = (rect.bottom + 8) + 'px';
        lp.classList.add('show');
        document.getElementById('epSearch').value = '';
        filterIconPicker('');
        setTimeout(() => document.getElementById('epSearch').focus(), 50);
      }
      else if (a === 'lp-select') {
        e.stopPropagation();
        if (emojiPickerTargetCol) {
          const c = state.columns.find(x => x.id === emojiPickerTargetCol);
          if (c) {
            c.icon = btn.dataset.icon;
            saveState();
            renderSidebar();
          }
        }
        document.getElementById('emojiPicker').classList.remove('show');
      }
      else if (a === 'toggle-collapse') {
        const col = state.columns.find(c => c.id === btn.closest('[data-col]')?.dataset?.col || currentView); // rough fallback
        // Wait, the button has no colId if nested. Oh wait, renderGroupNode passes colId to the trash btn but not the toggle header...
        for (const cc of state.columns) {
          const grp = findById(cc.items, btn.dataset.id);
          if (grp) {
            grp.collapsed = !grp.collapsed;
            saveState();
            const content = document.querySelector(`[data-content-id="${grp.id}"]`);
            const arrow = document.querySelector(`[data-arrow-id="${grp.id}"]`);
            if (content) content.classList.toggle('expanded', !grp.collapsed);
            if (arrow) arrow.classList.toggle('collapsed', grp.collapsed);
            break;
          }
        }
      }

      else if (a === 'toggle-sb-menu') {
        e.stopPropagation();
        document.querySelectorAll('.sb-dropdown, .header-dropdown, .settings-dropdown').forEach(d => d.classList.remove('show'));
        document.getElementById('sbMenu-' + btn.dataset.id)?.classList.add('show');
      }
      else if (a === 'toggle-group-menu') {
        e.stopPropagation();
        document.querySelectorAll('.sb-dropdown, .header-dropdown, .settings-dropdown, .group-dropdown').forEach(d => d.classList.remove('show'));
        document.getElementById('groupMenu-' + btn.dataset.id)?.classList.add('show');
      }
      else if (a === 'toggle-task-menu') {
        e.stopPropagation();
        document.querySelectorAll('.sb-dropdown, .header-dropdown, .settings-dropdown, .group-dropdown').forEach(d => d.classList.remove('show'));
        document.getElementById('taskMenu-' + btn.dataset.id)?.classList.add('show');
      }
      else if (a === 'task-sweep') {
        const colId = btn.dataset.col;
        const taskId = btn.dataset.id;
        for (const col of state.columns) {
          const task = findById(col.items, taskId);
          if (task && task.itemType === 'task' && task.completed && !task.archived) {
            task.archived = true;
            saveState(); render();
            showToast('1 task swept');
            break;
          }
        }
      }
      else if (a === 'go-to-task') {
        currentView = btn.dataset.col;
        render();
        setTimeout(() => {
          const el = document.querySelector(`[data-task-id="${btn.dataset.id}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'background 0.5s';
            el.style.background = 'rgba(129, 140, 248, 0.2)';
            setTimeout(() => { el.style.background = ''; }, 2000);
          }
        }, 300);
      }
      else if (a === 'toggle-list-sweep-menu') {
        e.stopPropagation();
        document.querySelectorAll('.sb-dropdown, .header-dropdown, .settings-dropdown, .group-dropdown').forEach(d => d.classList.remove('show'));
        document.getElementById('listSweepMenu-' + btn.dataset.id)?.classList.add('show');
      }
      else if (a === 'sweep-all') {
        let count = 0;
        const sweepRecursive = (items) => {
          for (const item of items) {
            if (item.itemType === 'task' && item.completed && !item.archived) {
              item.archived = true;
              count++;
            } else if (item.itemType === 'group' && !item.archived) {
              sweepRecursive(item.children || []);
            }
          }
        };
        state.columns.forEach(col => sweepRecursive(col.items));
        if (count > 0) {
          saveState(); render();
          showToast(`${count} tasks swept`);
        } else {
          showToast('Nothing to sweep', '#555');
        }
      }
      else if (a === 'list-sweep') {
        const colId = btn.dataset.id;
        const col = state.columns.find(c => c.id === colId);
        if (col) {
          let count = 0;
          const sweepRecursive = (items) => {
            for (const item of items) {
              if (item.itemType === 'task' && item.completed && !item.archived) {
                item.archived = true;
                count++;
              } else if (item.itemType === 'group' && !item.archived) {
                sweepRecursive(item.children || []);
              }
            }
          };
          sweepRecursive(col.items);
          if (count > 0) {
            saveState(); render();
            showToast(`${count} tasks swept from ${col.name}`);
          }
        }
      }
      else if (a === 'group-sweep') {
        const colId = btn.dataset.col;
        const groupId = btn.dataset.id;
        const col = state.columns.find(c => c.id === colId);
        if (col) {
          const group = findById(col.items, groupId);
          if (group) {
            let count = 0;
            if (group.type === 'ephemeral' && isGroupComplete(group, 'all')) {
              count = countCompletedTasks(group);
              group.archived = true;
            } else {
              const sweepRecursive = (items) => {
                for (const item of items) {
                  if (item.itemType === 'task' && item.completed && !item.archived) {
                    item.archived = true;
                    count++;
                  } else if (item.itemType === 'group' && !item.archived) {
                    sweepRecursive(item.children || []);
                  }
                }
              };
              sweepRecursive(group.children || []);
            }
            if (count > 0) {
              saveState();
              render();
              showToast(`${count} tasks swept`);
            }
          }
        }
      }
      else if (a === 'sb-rename') {
        e.stopPropagation();
        const colId = btn.dataset.id;
        const item = btn.closest('.sb-list-item');
        const nameSpan = item.querySelector('.sb-list-name-txt');
        if (nameSpan) {
          const c = state.columns.find(x => x.id === colId);
          if (c) {
            item.draggable = false;
            startInlineRename(nameSpan, c.name, (v) => { c.name = v; saveState(); });
          }
        }
        document.getElementById('sbMenu-' + colId)?.classList.remove('show');
      }
      else if (a === 'sb-delete') {
        e.stopPropagation();
        const colId = btn.dataset.id;
        const dropdown = document.getElementById('sbMenu-' + colId);
        dropdown.innerHTML = `
      <div style="padding:8px 14px;font-size:12px;color:#ccc;white-space:nowrap">Delete this list?</div>
      <button class="sb-dropdown-btn" data-action="sb-delete-confirm" data-id="${colId}" style="color:#ef4444">Confirm</button>
      <button class="sb-dropdown-btn" onclick="renderSidebar()">Cancel</button>
    `;
      }
      else if (a === 'sb-delete-confirm') {
        e.stopPropagation();
        state.columns = state.columns.filter(c => c.id !== btn.dataset.id);
        if (currentView === btn.dataset.id) currentView = 'home';
        saveState(); render();
      }
      else if (a === 'sb-mark-imp') {
        e.stopPropagation();
        const c = state.columns.find(x => x.id === btn.dataset.id);
        if (c) { c.important = !c.important; saveState(); renderSidebar(); }
      }
      else if (a === 'set-task-color') {
        e.stopPropagation();
        const col = state.columns.find(c => c.id === btn.dataset.col);
        if (col) {
          const task = findById(col.items, btn.dataset.id);
          if (task) {
            task.color = (task.color === btn.dataset.color) ? null : btn.dataset.color;
            saveState(); render();
          }
        }
      }
      else if (a === 'set-group-color') {
        e.stopPropagation();
        for (const col of state.columns) {
          const grp = findById(col.items, btn.dataset.id);
          if (grp) {
            grp.color = (grp.color === btn.dataset.color) ? null : btn.dataset.color;
            saveState(); render();
            break;
          }
        }
      }
      else if (a === 'cal-item-click') {
        e.stopPropagation();
        const p = document.getElementById('calPopup');
        document.getElementById('cpTitle').textContent = btn.dataset.name;
        document.getElementById('cpBread').textContent = btn.dataset.bread;
        document.getElementById('cpDate').textContent = "Due: " + btn.dataset.date;
        const rect = btn.getBoundingClientRect();
        p.style.left = Math.min(rect.right + 10, window.innerWidth - 260) + 'px';
        p.style.top = Math.max(10, rect.top - 20) + 'px';
        p.classList.add('show');
      }
      else if (a === 'cal-prev') { calendarDate.setMonth(calendarDate.getMonth() - 1); renderMainContent(); }
      else if (a === 'cal-next') { calendarDate.setMonth(calendarDate.getMonth() + 1); renderMainContent(); }
      else if (a === 'cal-today') { calendarDate = new Date(); renderMainContent(); }
      else if (a === 'cal-view-month') { calViewType = 'month'; renderMainContent(); }
      else if (a === 'cal-view-week') { calViewType = 'week'; renderMainContent(); }
      else if (a === 'cal-view-day') { calViewType = 'day'; renderMainContent(); }

    });

    document.addEventListener('change', e => {
      if (e.target.dataset.action === 'due-change') {
        const col = state.columns.find(c => c.id === e.target.dataset.col);
        if (col) {
          const trg = findById(col.items, e.target.dataset.id);
          if (trg) {
            if (trg.itemType === 'group') {
              trg.deadline = e.target.value || null;
            } else {
              trg.dueDate = e.target.value || null;
            }
            saveState(); render();
          }
        }
      } else if (e.target.dataset.action === 'start-change') {
        const col = state.columns.find(c => c.id === e.target.dataset.col);
        if (col) {
          const trg = findById(col.items, e.target.dataset.id);
          if (trg) {
            if (trg.itemType === 'group') trg.startDate = e.target.value || null;
            saveState(); render();
          }
        }
      }
    });

    document.addEventListener('keydown', e => {
      if (addingColNew && e.target.id === 'newColInput') {
        if (e.key === 'Enter') {
          const v = e.target.value.trim();
          if (v) { state.columns.push({ id: generateId(), name: v, items: [] }); saveState(); }
          addingColNew = false; render();
        }
        if (e.key === 'Escape') { addingColNew = false; render(); }
      }
      else if (addingTaskIn && e.target.classList.contains('inline-input')) {
        if (e.key === 'Enter') {
          const v = e.target.value.trim();
          if (v) {
            const col = state.columns.find(c => c.id === e.target.dataset.col);
            if (col) {
              const nTask = { id: generateId(), itemType: 'task', text: v, completed: false, important: false, dueDate: null, color: null };
              if (e.target.dataset.container === col.id) col.items.push(nTask);
              else {
                const grp = findById(col.items, e.target.dataset.container);
                if (grp) grp.children.push(nTask);
              }
              saveState(); e.target.value = '';
              const targetId = e.target.dataset.container;
              render();
              setTimeout(() => document.querySelector(`[data-task-input="${targetId}"]`)?.focus(), 150);
            }
          }
        }
        if (e.key === 'Escape') { addingTaskIn = null; render(); }
      }
    });


    function insertItemRelative(items, targetId, insertAfter, newItem) {
      const idx = items.findIndex(i => i.id === targetId);
      if (idx !== -1) {
        items.splice(idx + (insertAfter ? 1 : 0), 0, newItem);
        return true;
      }
      for (const item of items) {
        if (item.itemType === 'group' && item.children) {
          if (insertItemRelative(item.children, targetId, insertAfter, newItem)) return true;
        }
      }
      return false;
    }

    let draggedColIdx = null;
    let draggedItemId = null;
    let draggedItemType = null;

    document.addEventListener('dragstart', e => {
      const taskItem = e.target.closest('.task-item');
      const groupItem = e.target.closest('.toggle-group');

      if (taskItem && taskItem.draggable) {
        draggedItemId = taskItem.dataset.taskId;
        draggedItemType = 'task';
        taskItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
        return;
      } else if (groupItem && groupItem.draggable) {
        draggedItemId = groupItem.dataset.groupId;
        draggedItemType = 'group';
        groupItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
        return;
      }

      const sbItem = e.target.closest('.sb-list-item');
      if (sbItem && sbItem.draggable) {
        draggedColIdx = parseInt(sbItem.dataset.index);
        sbItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    document.addEventListener('dragover', e => {
      const sbItem = e.target.closest('.sb-list-item');
      if (sbItem && draggedColIdx !== null && sbItem.draggable) {
        e.preventDefault();
        const rect = sbItem.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
          sbItem.classList.add('drag-over-top');
          sbItem.classList.remove('drag-over-bottom');
        } else {
          sbItem.classList.add('drag-over-bottom');
          sbItem.classList.remove('drag-over-top');
        }
        return;
      }

      if (draggedItemId !== null) {
        e.preventDefault();
        const dropTarget = e.target.closest('.task-item') || e.target.closest('.toggle-group');
        if (dropTarget && dropTarget.dataset.taskId !== draggedItemId && dropTarget.dataset.groupId !== draggedItemId) {
          // Check if dropping into itself
          const draggedEl = document.querySelector('.dragging');
          if (draggedEl && draggedEl.contains(dropTarget)) return;

          const rect = dropTarget.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          if (e.clientY < mid) {
            dropTarget.classList.add('drag-over-top');
            dropTarget.classList.remove('drag-over-bottom');
          } else {
            dropTarget.classList.add('drag-over-bottom');
            dropTarget.classList.remove('drag-over-top');
          }
        }
      }
    });

    document.addEventListener('dragleave', e => {
      const sbItem = e.target.closest('.sb-list-item');
      if (sbItem && sbItem.draggable) {
        sbItem.classList.remove('drag-over-top', 'drag-over-bottom');
      }
      const dropTarget = e.target.closest('.task-item') || e.target.closest('.toggle-group');
      if (dropTarget) {
        dropTarget.classList.remove('drag-over-top', 'drag-over-bottom');
      }
    });

    document.addEventListener('drop', e => {
      const sbItem = e.target.closest('.sb-list-item');
      if (sbItem && sbItem.draggable && draggedColIdx !== null) {
        e.preventDefault();
        sbItem.classList.remove('drag-over-top', 'drag-over-bottom');
        const targetIdx = parseInt(sbItem.dataset.index);
        const rect = sbItem.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        let insertIdx = e.clientY < mid ? targetIdx : targetIdx + 1;

        if (draggedColIdx < insertIdx) insertIdx--;

        if (draggedColIdx !== insertIdx) {
          const col = state.columns.splice(draggedColIdx, 1)[0];
          state.columns.splice(insertIdx, 0, col);
          saveState();
          renderSidebar();
        }
        return;
      }

      if (draggedItemId !== null) {
        e.preventDefault();
        const dropTarget = e.target.closest('.task-item') || e.target.closest('.toggle-group');
        if (dropTarget) {
          dropTarget.classList.remove('drag-over-top', 'drag-over-bottom');
          const targetId = dropTarget.dataset.taskId || dropTarget.dataset.groupId;

          const draggedEl = document.querySelector('.dragging');
          if (draggedEl && draggedEl.contains(dropTarget)) return;

          if (targetId && targetId !== draggedItemId) {
            const rect = dropTarget.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            const insertAfter = e.clientY >= mid;

            // Search all lists for the item
            let foundItem = null;
            let sourceCol = null;

            for (const c of state.columns) {
              const item = extractById(c.items, draggedItemId);
              if (item) {
                foundItem = item;
                sourceCol = c;
                break;
              }
            }

            if (foundItem) {
              // Now find target in current view or all lists
              // Assuming it's dropped in the same column as we only render current column.
              const col = state.columns.find(c => c.id === currentView);
              if (col) {
                if (!insertItemRelative(col.items, targetId, insertAfter, foundItem)) {
                  // Fallback push to end if not found
                  col.items.push(foundItem);
                }
              } else if (sourceCol) {
                // if we are in 'home' view, currentView is 'home'.
                // Let's try to find by targetId across all columns.
                let placed = false;
                for (const c of state.columns) {
                  if (insertItemRelative(c.items, targetId, insertAfter, foundItem)) {
                    placed = true;
                    break;
                  }
                }
                if (!placed) sourceCol.items.push(foundItem);
              }
              saveState();
              render();
            }
          }
        }
      }
    });

    document.addEventListener('dragend', e => {
      const item = e.target.closest('.sb-list-item');
      if (item) item.classList.remove('dragging');
      document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
      document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
      draggedColIdx = null;
      draggedItemId = null;
      draggedItemType = null;
    });



    // Modal Logic
    document.getElementById('modalCancel').addEventListener('click', () => { document.getElementById('groupModal').classList.remove('show'); });
    document.querySelectorAll('.modal-type-btn').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-type-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    }));
    document.getElementById('modalCreate').addEventListener('click', () => {
      const name = document.getElementById('modalName').value.trim();
      if (!name || !modalTarget) return;
      const type = document.querySelector('input[name="modalType"]:checked')?.value || 'persistent';
      const nGrp = { id: generateId(), itemType: 'group', name, type, startDate: document.getElementById('modalStartDate').value || null, deadline: document.getElementById('modalDeadline').value || null, collapsed: false, color: null, children: [] };
      const col = state.columns.find(c => c.id === modalTarget.columnId);
      if (col) {
        if (modalTarget.parentId === modalTarget.columnId) col.items.push(nGrp);
        else { const p = findById(col.items, modalTarget.parentId); if (p) p.children.push(nGrp); }
        saveState(); render();
      }
      document.getElementById('groupModal').classList.remove('show');
    });

    loadState();
    render();


    // Handle outside click cancels for inline edits
    function cancelActiveInput() {
      let changed = false;
      if (document.querySelector('.sb-rename-input')) changed = true;
      if (addingColNew) { addingColNew = false; changed = true; }
      if (addingTaskIn) { addingTaskIn = null; changed = true; }
      return changed;
    }

    document.addEventListener('mousedown', e => {
      if (e.target.closest('.sb-rename-input') || e.target.closest('#newColInput') || e.target.closest('.inline-input-wrap') || e.target.closest('.top-add-btn') || e.target.closest('.add-btn')) {
        return;
      }
      if (document.querySelector('.sb-rename-input') || document.getElementById('newColInput') || addingTaskIn) {
        if (cancelActiveInput()) {
          render();
        }
      }
      if (!e.target.closest('.cal-task-chip') && !e.target.closest('#calPopup')) {
        document.getElementById('calPopup')?.classList.remove('show');
      }
      if (document.getElementById('emojiPicker')?.classList.contains('show') && !e.target.closest('#emojiPicker') && !e.target.closest('[data-action="ep-open"]')) {
        document.getElementById('emojiPicker').classList.remove('show');
      }
      if (e.target.closest('#sidebarOverlay')) {
        document.getElementById('sidebar')?.classList.remove('mobile-open');
        document.getElementById('sidebarOverlay')?.classList.remove('show');
      }
    });


    function showToast(msg, isErr = false) {
      let tc = document.getElementById('toast-container');
      if (!tc) {
        tc = document.createElement('div');
        tc.id = 'toast-container';
        document.body.appendChild(tc);
      }
      const t = document.createElement('div');
      t.className = 'toast' + (isErr ? ' error' : '');
      t.textContent = msg;
      tc.appendChild(t);
      setTimeout(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; }, 10);
      setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => { t.remove(); }, 300);
      }, 2500);
    }

    render();

