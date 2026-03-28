    /* ================================================================
       RENDERING - SIDEBAR
       ================================================================ */
    function renderSidebar() {
      const isMobile = window.innerWidth <= 768;
      const sb = document.getElementById('sidebar');

      // Count Overdue
      const t = today();
      const overdueCount = getAll().filter(i => i.itemType === 'task' && !i.completed && (i.effectiveDueDate || i.dueDate) && parseDate(i.effectiveDueDate || i.dueDate) < t).length;
      const ovdBadge = overdueCount > 0 ? `<div class="sb-badge">${overdueCount}</div>` : '';

      const svgHome = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
      const svgCal = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
      const svgStar = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
      const svgOvd = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
      const svgComp = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      const svgTrash = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

      const sidebarToggleHtml = isMobile 
        ? `<button class="sb-mobile-close" data-action="toggle-mobile-sidebar">✕</button>`
        : `<button class="sb-toggle-btn" data-action="toggle-sb-collapse" style="margin-left:auto">${state.sbCollapsed ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>'}</button>`;

      let topNav = `
    <div class="sb-top">
      <div class="app-logo-wrap">
        <svg fill="none" stroke="#fff" stroke-linecap="round" stroke-width="2.5" viewBox="0 0 24 24" height="24" width="24" style="flex-shrink:0;"><rect height="18" rx="2" ry="2" width="18" x="3" y="3"></rect><polyline points="9 11 12 14 22 4"></polyline></svg>
        <div class="app-logo" style="color:#e8e8e8;background:none;filter:none;-webkit-text-fill-color:white;min-width:0;overflow:hidden;">ToDogle</div>
        ${sidebarToggleHtml}
      </div>
      <a href="#" class="sb-nav-item${currentView === 'home' ? ' active' : ''}" data-action="nav" data-view="home">${svgHome} Home</a>
      <a href="#" class="sb-nav-item${currentView === 'calendar' ? ' active' : ''}" data-action="nav" data-view="calendar">${svgCal} Calendar</a>
      <a href="#" class="sb-nav-item${currentView === 'important' ? ' active' : ''}" data-action="nav" data-view="important">${svgStar} Important</a>
      <a href="#" class="sb-nav-item${currentView === 'overdue' ? ' active' : ''}" data-action="nav" data-view="overdue">${svgOvd} Overdue ${ovdBadge}</a>
    </div>
    <div class="sb-divider"></div>
  `;

      let listsHtml = '<div class="sb-lists">';
      listsHtml += `<div class="sb-lists-header"><span>Lists</span><span data-action="add-col" style="cursor:pointer;font-size:16px;">+</span></div>`;

      if (addingColNew) {
        listsHtml += `<input type="text" id="newColInput" style="background:#222;color:#e8e8e8;font-size:12px;padding:6px;border-radius:4px;border:1px solid #444;margin-bottom:8px" placeholder="List name..." autofocus>`;
      }

      state.columns.forEach((col, i) => {
        let cnt = 0;
        const countOpen = (items) => {
          items.forEach(it => {
            if (it.itemType === 'task' && !it.completed) cnt++;
            else if (it.itemType === 'group') countOpen(it.children || []);
          })
        };
        countOpen(col.items);

        const starIcon = col.important ? '<span style="color:#fbbf24;font-size:12px;margin-left:6px">★</span>' : '';
        const isActiveCol = currentView === col.id;
        const iconName = (col.icon && lucideIconList.includes(col.icon)) ? col.icon : 'folder';
        const iconColor = isActiveCol ? '#ffffff' : '#a0a0a0';
        listsHtml += `<div class="sb-list-item${isActiveCol ? ' active' : ''}" data-action="nav" data-view="${col.id}" draggable="true" data-index="${i}">
      
      <div class="sidebar-lucide-icon" data-action="lp-open" data-col="${col.id}" title="Change icon">
        <i data-lucide="${iconName}" style="width:16px;height:16px;stroke:${iconColor};stroke-width:1.5;fill:none;"></i>
      </div>
      <div style="flex:1;display:flex;align-items:center;min-width:0;">
        <span class="sb-list-name-txt">${escHtml(col.name)}</span>
        ${starIcon}
      </div>
      ${cnt > 0 ? `<div class="sb-list-count">${cnt}</div>` : ''}
      <div class="sb-list-more" data-action="toggle-sb-menu" data-id="${col.id}">⋯</div>
      
      <div class="sb-dropdown" id="sbMenu-${col.id}">
        <button class="sb-dropdown-btn" data-action="sb-rename" data-id="${col.id}">Rename</button>
        <button class="sb-dropdown-btn" data-action="sb-mark-imp" data-id="${col.id}">Mark as Important</button>
        <button class="sb-dropdown-btn" data-action="sb-delete" data-id="${col.id}" style="color:#ef4444">Delete</button>
      </div>
    </div>`;
      });
      listsHtml += '</div>';

      let botNav = `
    <div class="sb-bottom">
      <div class="sb-list-item${currentView === 'completed' ? ' active' : ''}" data-action="nav" data-view="completed">${svgComp} Completed</div>
      <div class="sb-list-item${currentView === 'trash' ? ' active' : ''}" data-action="nav" data-view="trash">${svgTrash} Trash</div>
      <div class="sb-divider" style="margin:4px 0"></div>
      <div class="sb-user">
        <div class="sb-user-avatar" style="background:#333;color:#e8e8e8;border:1px solid #444">JD</div>
        <div class="sb-user-name">Guest User</div>
        <div class="sb-settings-icon" data-action="toggle-settings">⚙</div>
        <div class="settings-dropdown" id="sbSettings">
          <button class="settings-btn" data-action="export-data">Export Data</button>
          <button class="settings-btn" data-action="import-data">Import Data</button>
          <button class="settings-btn" data-action="clear-data" style="color:#e05555">Clear All Data</button>
          <input type="file" id="importFile" accept=".json" style="display:none">
        </div>
      </div>
    </div>
  `;

      sb.innerHTML = topNav + listsHtml + botNav;
      if (addingColNew) setTimeout(() => document.getElementById('newColInput')?.focus(), 50);
      // Render Lucide icons after sidebar HTML is set
      renderLucideIcons(sb);
    }

    /* ================================================================
       RENDERING - MAIN CONTENT
       ================================================================ */
    function getMobileHeaderHtml(title, options = {}) {
      if (window.innerWidth > 768) return '';
      const { actionType = null, colId = null } = options;
      
      let actionBtn = '';
      if (actionType === 'sweep-all') {
        actionBtn = `<button class="mobile-sweep-btn" data-action="sweep-all">Sweep All</button>`;
      } else if (actionType === 'list-sweep' && colId) {
        actionBtn = `<button class="mobile-sweep-btn" data-action="list-sweep" data-id="${colId}">Sweep</button>`;
      }

      return `
        <div class="mobile-header">
          <button class="mobile-menu-btn" data-action="toggle-mobile-sidebar">
            <span style="font-size: 24px; line-height: 1;">☰</span>
          </button>
          <div class="mobile-app-title">${escHtml(title)}</div>
          <div style="width: 80px; display: flex; justify-content: flex-end;">${actionBtn}</div>
        </div>
      `;
    }

    let lastRenderedView = null;
    function renderMainContent() {
      const mc = document.getElementById('mainContent');
      if (currentView === 'calendar') mc.classList.add('full-width-view');
      else mc.classList.remove('full-width-view');

      if (currentView === 'home') mc.innerHTML = buildHomeView();
      else if (currentView === 'calendar') mc.innerHTML = buildCalendarView();
      else if (currentView === 'important') mc.innerHTML = buildImportantView();
      else if (currentView === 'overdue') mc.innerHTML = buildOverdueView();
      else if (currentView === 'completed') mc.innerHTML = buildCompletedView();
      else if (currentView === 'trash') mc.innerHTML = buildTrashView();
      else {
        const col = state.columns.find(c => c.id === currentView);
        if (col) mc.innerHTML = buildListView(col);
        else { currentView = 'home'; render(); return; }
      }
      lastRenderedView = currentView;
    }

    function getBreadcrumb(i) {
      return [i.colName, ...i.path].join(' → ');
    }

    const svgStar = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    const svgOvd = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

    function buildHomeView() {
      const all = getAll();
      const homeTasks = all.filter(i => i.itemType === 'task' && isTaskInCategory(i, homeFilter, i.effectiveDueDate));
      const totalTasks = homeTasks.length;
      const completedTasks = homeTasks.filter(i => i.completed).length;
      const overallPct = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
      const dashOffset = 163.36 * (1 - overallPct);

      const pills = [
        { id: 'today', label: 'Today' },
        { id: '5days', label: 'In 5 Days' },
        { id: '10days', label: 'In 10 Days' },
        { id: 'all', label: 'All' }
      ];
      const isMobile = window.innerWidth <= 768;
      
      let pillsHtml = `<div class="${isMobile ? 'hpill-container' : ''}" style="${isMobile ? '' : 'display:flex;gap:4px;'}">`;
      pills.forEach(p => {
        const act = (homeFilter === p.id) ? 'active ' : '';
        const style = isMobile ? '' : 'padding:3px 10px;border-radius:999px;font-size:12px;cursor:pointer;background:transparent;border:0.5px solid transparent;color:#555;';
        pillsHtml += `<button class="hpill ${act}" data-action="set-home-filter" data-filter="${p.id}" style="${style}">${p.label}</button>`;
      });
      pillsHtml += '</div>';

      if (isMobile) {
        let contentHtml = '<div style="display:flex;flex-wrap:wrap;gap:16px;">';
        state.columns.forEach((col) => {
          let colContent = '';
          for (const item of col.items) {
            colContent += renderItem(item, 0, col.id, homeFilter, true);
          }
          if (colContent !== '') {
            const completedInCol = countCompletedTasks(col);
            contentHtml += `
            <div style="flex: 1 1 100%; border-radius:12px; background:#1a1a1a; padding:16px; margin-bottom:12px; border:1px solid #2a2a2a;">
              <div class="home-col-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:16px; font-weight:600; color:#e8e8e8;">${escHtml(col.name)}</span>
                <div style="position:relative">
                  <div class="action-btn list-sweep-btn" data-action="toggle-list-sweep-menu" data-id="${col.id}" style="font-size:16px; opacity:1; cursor:pointer; color:#e8e8e8;">⋯</div>
                  <div class="group-dropdown" id="listSweepMenu-${col.id}" style="right:0; top:100%;">
                    <div class="group-dropdown-item${completedInCol === 0 ? ' disabled' : ''}" data-action="list-sweep" data-id="${col.id}">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path></svg>
                      Sweep
                    </div>
                  </div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;">${colContent}</div>
            </div>`;
          }
        });
        
        if (contentHtml === '<div style="display:flex;flex-wrap:wrap;gap:16px;">') {
          contentHtml = `
            <div class="empty-state" style="padding:40px 16px;">
              <div style="color:#666;font-size:14px;font-weight:500">No tasks due in this period</div>
            </div>
          `;
        } else {
          contentHtml += '</div>';
        }

        const pPct = overallPct * 100;
        const mobileHeader = getMobileHeaderHtml('Home', { actionType: 'sweep-all' });

        return `
          <div class="view-header">
            ${mobileHeader}
            <div style="margin-bottom:12px;"></div>
            ${pillsHtml}
          </div>
          <div class="home-view" style="padding-top:0">
            ${contentHtml}
          </div>
        `;
      }

      let contentHtml = '<div style="display:flex;flex-wrap:wrap;gap:24px;padding:24px 80px;">';
      
      let visibleCols = [];
      state.columns.forEach((col) => {
        let colContent = '';
        for (const item of col.items) {
          colContent += renderItem(item, 0, col.id, homeFilter, true);
        }
        if (colContent !== '') {
          visibleCols.push({ col, colContent });
        }
      });

      const anyVisible = visibleCols.length > 0;
      
      if (anyVisible) {
        const cStyle = visibleCols.length <= 3 
          ? 'flex: 1 1 calc(20% - 24px); min-width: 260px; max-width: 320px;' 
          : 'flex: 1 1 calc(20% - 24px); min-width: 200px; max-width: calc(20% - 24px);';
          
        visibleCols.forEach(data => {
          const col = data.col;
          const completedInCol = countCompletedTasks(col);
          const customWidth = state.colWidths && state.colWidths[col.id];
          const colStyle = customWidth 
            ? `flex:0 0 ${customWidth}px; width:${customWidth}px; position:relative;`
            : `${cStyle} position:relative;`;

          contentHtml += `
          <div class="home-col" data-col-id="${col.id}" style="${colStyle}">
            <div class="home-col-header" style="display:flex; justify-content:space-between; align-items:center; font-size:14px; font-weight:500; color:#aaa; padding-bottom:8px; border-bottom:1px solid #2a2a2a; margin-bottom:12px;">
              <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtml(col.name)}</span>
              <div style="position:relative">
                <div class="action-btn list-sweep-btn" data-action="toggle-list-sweep-menu" data-id="${col.id}" style="font-size:16px; opacity:0; transition:opacity 0.2s; cursor:pointer;">⋯</div>
                <div class="group-dropdown" id="listSweepMenu-${col.id}" style="right:0; top:100%;">
                  <div class="group-dropdown-item${completedInCol === 0 ? ' disabled' : ''}" data-action="list-sweep" data-id="${col.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path></svg>
                    Sweep
                  </div>
                </div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:16px;">${data.colContent}</div>
            <div class="col-resizer" data-id="${col.id}"></div>
          </div>`;
        });
      }
      contentHtml += '</div>';

      if (!anyVisible) {
        contentHtml = `
          <div class="empty-state" style="padding:100px 32px;">
            <div style="color:#666;font-size:14px;font-weight:500">No tasks due in this period</div>
            <div style="color:#444;font-size:12px;margin-top:4px">Switch to All to see everything</div>
          </div>
        `;
      }

      const pColor = 'rgba(255,255,255,0.3)';
      const pPct = overallPct * 100;

      return `
        <div class="view-header" style="display:flex;flex-direction:row;align-items:center;gap:16px;padding:32px 80px 0 80px;">
          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:8px;">
            <div class="view-title" style="font-size:22px;font-weight:500;">Home</div>
            ${pillsHtml}
          </div>
          <button data-action="sweep-all" style="margin-left:auto;background:transparent;border:0.5px solid #3a3a3a;border-radius:6px;padding:5px 14px;font-size:12px;color:#888;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;transition:0.15s ease;" onmouseenter="this.style.background='#1e1e1e';this.style.color='#ccc';this.style.borderColor='#444'" onmouseleave="this.style.background='transparent';this.style.color='#888';this.style.borderColor='#3a3a3a'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Sweep All
          </button>
        </div>
        <div style="margin-top:24px;width:100%;padding:0 80px;">
            <div style="display:flex;justify-content:flex-end;margin-bottom:6px;">
              <span style="font-size:12px;color:#555;font-weight:500;">${completedTasks}/${totalTasks}</span>
            </div>
            <div style="width:100%;height:4px;border-radius:999px;background:#2a2a2a;overflow:hidden;">
              <div style="height:100%;width:${pPct}%;background:${pColor};border-radius:999px;transition:width 0.4s ease;"></div>
            </div>
          </div>
        </div>
        <div class="home-view" style="padding-top:0">
          ${contentHtml}
        </div>
      `;
    }

    function buildFlatList(tasks, title, iconStr = '', emptySvg = '', emptyTitle = '', emptySub = '') {
      const isMobile = window.innerWidth <= 768;
      const mobileHeader = getMobileHeaderHtml(title);
      const desktopHeader = isMobile ? '' : `<div class="view-title">${iconStr} ${title}</div>`;
      let html = `<div class="view-header">${mobileHeader}${desktopHeader}</div><div class="flat-list">`;
      if (tasks.length === 0) {
        html += `<div class="empty-state" style="padding:100px 20px;">
      ${emptySvg}
      <div style="color:#888;font-size:14px;font-weight:500;margin-top:12px">${emptyTitle}</div>
      <div style="color:#666;font-size:12px;margin-top:4px">${emptySub}</div>
    </div>`;
      } else {
        tasks.forEach(i => html += renderTaskInfoRow(i, i.colId));
      }
      html += `</div>`;
      return html;
    }

    function buildCalendarView() {
      const all = getAll();
      const tStr = today().toDateString();
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrev = new Date(year, month, 0).getDate();

      let totalCells = firstDay + daysInMonth;
      const rem = totalCells % 7;
      if (rem !== 0) {
        totalCells += (7 - rem);
      }

      const isMobile = window.innerWidth <= 768;
      const mobileHeader = getMobileHeaderHtml('Calendar');
      let html = `<div class="view-header">${mobileHeader}</div><div class="cal-view" style="display:flex; flex-direction:column; flex:1; overflow:hidden; height:100%;">`;

      if (isMobile && calViewType === 'month') {
        const mDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const numRows = Math.ceil(totalCells / 7);
        
        // Unified Mobile Header built inside Calendar view to avoid duplicates
        html = `
          <div class="mobile-calendar-header" style="display:flex; align-items:center; gap:16px; padding:12px 16px; background:#191919; border-bottom:1px solid #222; width:100%; box-sizing:border-box;">
            <button class="mobile-menu-btn" data-action="toggle-mobile-sidebar">
              <span style="font-size: 24px; line-height: 1;">☰</span>
            </button>
            <div style="flex: 1;">
               <div style="font-size:18px; font-weight:700; color:#e8e8e8;">${months[month]} ${year}</div>
            </div>
            <div style="display:flex; align-items:center; gap:4px;">
              <button data-action="cal-prev" style="background:transparent; border:none; color:#aaa; font-size:20px; padding:4px 8px;">‹</button>
              <button data-action="cal-today" style="background:#222; border:1px solid #333; border-radius:12px; color:#e8e8e8; padding:2px 12px; font-size:12px;">Today</button>
              <button data-action="cal-next" style="background:transparent; border:none; color:#aaa; font-size:20px; padding:4px 8px;">›</button>
            </div>
          </div>
          <div class="cal-view" style="display:flex; flex-direction:column; flex:1; overflow:hidden; width:100%;">
            <div style="display:grid; grid-template-columns:repeat(7, 1fr); border-bottom:1px solid #222; background:transparent; width:100%;">
              ${mDays.map(d => `<div style="text-align:center; font-size:10px; color:#555; padding:4px 0;">${d}</div>`).join('')}
            </div>
            <div style="display:grid; grid-template-columns:repeat(7, 1fr); grid-template-rows:repeat(${numRows}, 1fr); flex:1; background:#111; width:100%;">
        `;

        function buildMobileDayCell(dt, isOther, isToday, all) {
          const dayTasks = all.filter(i => {
            if (i.completed || i.archived) return false;
            const due = i.itemType === 'task' ? i.dueDate : i.deadline;
            return due && parseDate(due)?.toDateString() === dt.toDateString();
          });

          const dayNum = dt.getDate();
          let taskBars = '';
          const limit = 3;
          for (let j = 0; j < dayTasks.length; j++) {
            if (j >= limit) break;
            const t = dayTasks[j];
            const name = t.itemType === 'task' ? t.text : t.name;
            const color = t.color || '#333';
            taskBars += `<div style="height:14px; background:${color}; width:100%; margin:1px 0; border-radius:3px; font-size:9px; line-height:14px; color:#fff; padding:0 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; box-sizing:border-box; font-weight:500;">${escHtml(name)}</div>`;
          }

          const numStyle = isToday 
            ? `background:#e8e8e8; color:#111; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center;`
            : `color:${isOther ? '#2a2a2a' : '#888'};`;

          return `
            <div class="cal-cell-mobile" style="border-right:1px solid #222; border-bottom:1px solid #222; padding:2px; display:flex; flex-direction:column; align-items:center; background:${isToday ? '#1a1a1a' : 'transparent'}; cursor:pointer;" data-action="cal-add-task" data-date="${toIsoDate(dt)}">
              <span style="font-size:12px; font-weight:500; ${numStyle}">${dayNum}</span>
              <div style="margin-top:2px; width:100%; display:flex; flex-direction:column; align-items:center; gap:1px; overflow:hidden;">
                ${taskBars}
              </div>
            </div>
          `;
        }

        for (let i = firstDay - 1; i >= 0; i--) html += buildMobileDayCell(new Date(year, month - 1, daysInPrev - i), true, false, all);
        for (let d = 1; d <= daysInMonth; d++) {
          const dt = new Date(year, month, d);
          html += buildMobileDayCell(dt, false, dt.toDateString() === tStr, all);
        }
        const trailingCount = totalCells - firstDay - daysInMonth;
        for (let i = 1; i <= trailingCount; i++) html += buildMobileDayCell(new Date(year, month + 1, i), true, false, all);
        
        html += `</div>`;
      } else if (calViewType === 'month') {
        // Desktop Header
        html += `
  <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 0;">
    <div style="display:flex; align-items:center; gap:8px;">
      <button data-action="cal-today" style="background:transparent; border:0.5px solid #3a3a3a; border-radius:6px; color:#aaa; padding:5px 14px; cursor:pointer; font-size:13px;">Today</button>
      <div style="display:flex; gap:0;">
        <button data-action="cal-prev" style="background:transparent; border:none; color:#aaa; padding:5px 8px; cursor:pointer; font-size:16px;">‹</button>
        <button data-action="cal-next" style="background:transparent; border:none; color:#aaa; padding:5px 8px; cursor:pointer; font-size:16px;">›</button>
      </div>
    </div>
    <div style="font-size:20px; font-weight:500; color:#e8e8e8;">${months[month]} ${year}</div>
    <div style="display:flex; gap:4px;">
      <button data-action="cal-view-month" style="background:${calViewType === 'month' ? '#2a2a2a' : 'transparent'}; border:none; border-radius:6px; color:${calViewType === 'month' ? '#e8e8e8' : '#aaa'}; padding:5px 14px; cursor:pointer; font-size:13px;">Month</button>
      <button data-action="cal-view-week" style="background:${calViewType === 'week' ? '#2a2a2a' : 'transparent'}; border:none; border-radius:6px; color:${calViewType === 'week' ? '#e8e8e8' : '#aaa'}; padding:5px 14px; cursor:pointer; font-size:13px;">Week</button>
      <button data-action="cal-view-day" style="background:${calViewType === 'day' ? '#2a2a2a' : 'transparent'}; border:none; border-radius:6px; color:${calViewType === 'day' ? '#e8e8e8' : '#aaa'}; padding:5px 14px; cursor:pointer; font-size:13px;">Day</button>
    </div>
  </div>`;

        // Day headers
        html += `<div style="display:grid; grid-template-columns:repeat(7, 1fr);">`;
        const mDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        mDays.forEach(d => {
          html += `<div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#666; text-align:center; padding:8px 0; border-bottom:1px solid #2e2e2e;">${d}</div>`;
        });
        html += `</div>`;

        // Grid
        html += `<div style="display:grid; grid-template-columns:repeat(7, 1fr); flex:1; overflow-y:auto; border-left:1px solid #2e2e2e;">`;

        function buildDayCell(dt, isOther, isToday, all) {
          const dayTasks = all.filter(i => {
            if (i.completed || i.archived) return false;
            const due = i.itemType === 'task' ? i.dueDate : i.deadline;
            return due && parseDate(due)?.toDateString() === dt.toDateString();
          });
          let chipsHtml = '';
          const limit = 3;
          for (let j = 0; j < dayTasks.length; j++) {
            if (j >= limit) {
              chipsHtml += `<div style="color:#555;font-size:11px;margin-top:2px;">+${dayTasks.length - limit} more</div>`;
              break;
            }
            const i_item = dayTasks[j];
            const name = i_item.itemType === 'task' ? i_item.text : i_item.name;
            let bColor = 'transparent';
            const colIdx = state.columns.findIndex(c => c.id === i_item.colId || c.items.some(x => x.id === i_item.id || (x.children && x.children.some(y => y.id === i_item.id))));
            if (colIdx !== -1) bColor = listColors[colIdx % listColors.length];
            const chipBg = i_item.color ? i_item.color : '#2a2a2a';
            const chipTextColor = i_item.color ? '#fff' : '#ccc';
            chipsHtml += `<div class="cal-task-chip-new" style="border-left:1px solid ${bColor}; background:${chipBg}; border-radius:4px; padding:2px 8px; font-size:12px; color:${chipTextColor}; margin-bottom:2px; width:100%; box-sizing:border-box; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" data-action="cal-item-click" data-name="${escHtml(name)}" data-bread="${escHtml(getBreadcrumb(i_item))}" data-date="${formatDateShort(dt)}">${escHtml(name)}</div>`;
          }
          const dayNum = dt.getDate();
          const numStyle = isToday
            ? `background:#fff; color:#111; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-size:13px;`
            : `font-size:13px; color:${isToday ? 'white' : '#888'}; display:block;`;
          return `<div class="cal-cell-new" style="min-height:120px; border-right:1px solid #2e2e2e; border-bottom:1px solid #2e2e2e; padding:8px; vertical-align:top; background:${isToday ? '#1f1f1f' : 'transparent'}; transition:background 0.2s; border-top:1px solid #2e2e2e; cursor:pointer;" data-action="cal-add-task" data-date="${toIsoDate(dt)}">
            <div style="margin-bottom:4px;"><span style="${numStyle}">${dayNum}</span></div>
            ${chipsHtml}
          </div>`;
        }
        for (let i = firstDay - 1; i >= 0; i--) html += buildDayCell(new Date(year, month - 1, daysInPrev - i), true, false, all);
        for (let d = 1; d <= daysInMonth; d++) {
          const dt = new Date(year, month, d);
          html += buildDayCell(dt, false, dt.toDateString() === tStr, all);
        }
        const trailingCount = totalCells - firstDay - daysInMonth;
        for (let i = 1; i <= trailingCount; i++) html += buildDayCell(new Date(year, month + 1, i), true, false, all);
        html += `</div>`;
      } else if (calViewType === 'week') {
        // Basic week view placeholder
        html += `<div style="display:grid; grid-template-columns:repeat(7, 1fr);">`;
        const mDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        mDays.forEach(d => {
          html += `<div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#666; text-align:center; padding:8px 0; border-bottom:1px solid #2e2e2e;">${d}</div>`;
        });
        html += `</div><div class="empty-state" style="padding:100px 20px;"><div style="color:#666;font-size:14px;">Week view coming soon</div></div>`;
      } else {
        html += buildDayView(calendarDate);
      }

      html += `</div>`;
      return html;
    }

    function buildDayView(date) {
      const all = getAll();
      const tasks = all.filter(i => {
        if (i.completed || i.archived) return false;
        const due = i.itemType === 'task' ? i.dueDate : i.deadline;
        return due && parseDate(due)?.toDateString() === date.toDateString();
      });
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateStr = monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
      const emptySvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
      return buildFlatList(tasks, dateStr, '', emptySvg, 'No tasks for this day', 'Enjoy your free time!');
    }

    function buildImportantView() {
      const all = getAll();
      const tasks = all.filter(i => i.itemType === 'task' && !i.completed && i.important);
      const emptySvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
      return buildFlatList(tasks, 'Important', svgStar, emptySvg, 'No important tasks yet', 'Star a task to mark it as important');
    }

    function buildOverdueView() {
      const all = getAll();
      const t = today();
      const tasks = all.filter(i => i.itemType === 'task' && !i.completed && (i.effectiveDueDate || i.dueDate) && parseDate(i.effectiveDueDate || i.dueDate) < t);
      tasks.sort((a, b) => parseDate(a.effectiveDueDate || a.dueDate) - parseDate(b.effectiveDueDate || b.dueDate)); // most overdue first
      const emptySvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
      return buildFlatList(tasks, 'Overdue', svgOvd, emptySvg, "You're all caught up", 'No tasks are past their due date');
    }

    // Helper to render standalone task row (flat lists)
    function renderTaskInfoRow(task, colId) {
      let duChip = '';
      if (task.dueDate) {
        duChip = `<span class="deadline-chip ${deadlineColor(task.dueDate, false, task.completed)}">${formatDateShort(task.dueDate)}</span>`;
      }
      const isOvd = task.dueDate && parseDate(task.dueDate) < today() && !task.completed;
      const starActive = task.important ? ' active' : '';

      return `<div class="task-item" data-task-id="${task.id}">
    <div class="task-checkbox" data-action="toggle-task" data-id="${task.id}" data-col="${colId}">✓</div>
    <div class="task-info">
      <div style="display:flex;align-items:center">
        <span class="task-text">${escHtml(task.text)}</span>
        ${isOvd ? '<span class="overdue-dot" style="margin-right:8px"></span>' : ''}
        ${duChip}
      </div>
      <span class="task-bread">${escHtml(getBreadcrumb(task))}</span>
    </div>
    <div class="task-actions">
      <div class="action-btn star${starActive}" data-action="toggle-important" data-id="${task.id}" data-col="${colId}">★</div>
      <div class="action-btn" title="Set due date">📅<input type="date" class="inline-due-input" data-action="due-change" data-id="${task.id}" data-col="${colId}" value="${task.dueDate || ''}"></div>
      <div class="action-btn trash" data-action="delete-task" data-id="${task.id}" data-col="${colId}">×</div>
    </div>
  </div>`;
    }

    /* ================================================================
       LIST VIEW RENDERING
       ================================================================ */
    function buildListView(col) {
      const idx = state.columns.findIndex(c => c.id === col.id);
      const isMobile = window.innerWidth <= 768;
      const color = 'transparent';
      const mobileHeader = getMobileHeaderHtml(col.name, { actionType: 'list-sweep', colId: col.id });

      let headStr = isMobile ? '' : `
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="view-title"><div style="width:16px;height:16px;border-radius:4px;background:${color};flex-shrink:0;"></div> <span class="list-name-txt" data-action="rename-col" data-col="${col.id}" style="cursor:text;display:block;">${escHtml(col.name)}</span></div>
        <div style="display:flex;gap:8px;position:relative;align-items:center;flex-shrink:0;">
        <button class="top-add-btn" data-action="show-add-task" data-target="${col.id}" data-col="${col.id}">+ Add Task</button>
        <button class="top-add-btn" data-action="show-add-group" data-target="${col.id}" data-col="${col.id}">+ Add Group</button>
        <div style="position:relative">
          <button class="list-more-btn" data-action="toggle-list-more" data-id="${col.id}">⋮</button>
          <div class="header-dropdown" id="moreMenu-${col.id}" style="right:0">
            <button class="hd-btn" data-action="rename-col" data-col="${col.id}">Rename List</button>
            <button class="hd-btn" data-action="delete-col" data-col="${col.id}" style="color:#ef4444">Delete List</button>
          </div>
        </div>
      </div>
      </div>
      <div class="list-color-line" style="background:${color}"></div>
      `;

      let head = `
    <div class="view-header">
      ${mobileHeader}
      ${headStr}
    </div>
  `;

      let body = `<div class="list-content">`;
      
      if (isMobile) {
        let contentHtml = '';
        for (const item of col.items) contentHtml += renderItem(item, 0, col.id, null, true);
        
        if (contentHtml === '') {
           body += `<div class="empty-state" style="padding:40px 16px;"><div style="color:#666;font-size:14px;font-weight:500">This list is empty</div></div>`;
        } else {
           body += `
            <div class="mobile-list-card">
              <div style="display:flex;flex-direction:column;gap:8px;">${contentHtml}</div>
            </div>`;
        }
      } else {
        if (col.items.length === 0) {
          if (addingTaskIn !== col.id) {
            body += `<div class="empty-state" style="padding:100px 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <path d="M9 12l2 2 4-4"></path>
            <line x1="16" y1="8" x2="16" y2="8"></line>
            <line x1="8" y1="8" x2="8" y2="8"></line>
          </svg>
          <div style="color:#9b9b9b;font-size:14px;font-weight:500;margin-top:12px">This list is empty</div>
          <div style="color:#666;font-size:12px;margin-top:4px">Click + Add to create a group or task</div>
        </div>`;
          }
        } else {
          for (const item of col.items) body += renderItem(item, 0, col.id);
        }
      }

      // Bottom adds
      if (addingTaskIn === col.id) {
        body += `<div class="inline-input-wrap" style="margin-top:16px">
      <input class="inline-input" data-task-input="${col.id}" data-container="${col.id}" data-col="${col.id}" placeholder="Task name…" autofocus>
      <div class="inline-cancel" data-action="cancel-task">×</div></div>`;
      } else {

      }

      body += `</div>`;
      return head + body;
    }

    function renderItem(item, depth, colId, filter, isHome = false, inheritedDeadline = null) {
      const isMobile = window.innerWidth <= 768;
      const useHomeStyle = isHome || isMobile;
      if (item.itemType === 'task') return renderTaskNode(item, depth, colId, filter, useHomeStyle, inheritedDeadline);
      return renderGroupNode(item, depth, colId, filter, useHomeStyle, inheritedDeadline);
    }

    function renderTaskNode(task, depth, colId, filter, isHome = false, inheritedDeadline = null) {
      if (!isTaskVisible(task, filter, inheritedDeadline)) return '';
      if (task.archived) return '';
      let duChip = '';
      if (task.dueDate) duChip = `<span class="deadline-chip ${deadlineColor(task.dueDate, isHome, task.completed)}">${formatDateShort(task.dueDate)}</span>`;
      const starActive = task.important ? ' active' : '';
      const isOvd = task.dueDate && parseDate(task.dueDate) < today() && !task.completed;

      const compCls = task.completed ? ' completed' : '';
      const checkCls = task.completed ? 'task-checkbox checked' : 'task-checkbox';
      const textCls = task.completed ? 'task-text done' : 'task-text';
      const taskAccent = task.color ? `border-left:3px solid ${task.color};padding-left:11px;` : '';
      const depthCls = (depth > 0) ? ` depth-${depth}` : '';

      if (isHome) {
        return `<div class="task-item${compCls}${depthCls} home-task-row" data-task-id="${task.id}" style="padding:0;height:28px;background:transparent;border:none;position:relative;">
    <div class="${checkCls}" data-action="toggle-task" data-id="${task.id}" data-col="${colId}" style="width:16px;height:16px;border-width:1.5px;font-size:10px">✓</div>
    <div class="task-info">
      <div style="display:flex;align-items:center;min-width:0;">
        <span class="${textCls} home-task-name" style="color:${task.completed ? '#888' : '#aaa'};display:block;">${escHtml(task.text)}</span>
        ${isOvd ? '<span class="overdue-dot" style="margin-right:8px;flex-shrink:0;"></span>' : ''}
        ${duChip ? `<div style="flex-shrink:0;">${duChip}</div>` : ''}
      </div>
    </div>
    <div class="home-task-dots-wrap" style="position:relative;margin-left:4px;flex-shrink:0;">
      <div class="action-btn home-task-dots" data-action="toggle-task-menu" data-id="${task.id}" style="opacity:0;transition:opacity 0.2s;font-size:14px;width:20px;height:20px;">⋯</div>
      <div class="group-dropdown" id="taskMenu-${task.id}" style="right:0;top:100%;min-width:160px;">
        ${buildColorPicker('set-task-color', task.id, colId, task.color)}
        <div class="group-dropdown-divider"></div>
        <div class="group-dropdown-item${task.completed ? '' : ' disabled'}" data-action="task-sweep" data-id="${task.id}" data-col="${colId}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path></svg>
          Sweep
        </div>
        <div class="group-dropdown-item" data-action="go-to-task" data-id="${task.id}" data-col="${colId}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          Go to this
        </div>
      </div>
    </div>
  </div>`;
      }

      return `<div class="task-item${compCls}${depthCls}" data-task-id="${task.id}" draggable="true" style="${taskAccent}">
    <div class="${checkCls}" data-action="toggle-task" data-id="${task.id}" data-col="${colId}">✓</div>
    <div class="task-info">
      <div style="display:flex;align-items:center;min-width:0;">
        <span class="${textCls} task-name-txt">${escHtml(task.text)}</span>
        ${isOvd ? '<span class="overdue-dot" style="margin-right:8px;flex-shrink:0;"></span>' : ''}
        ${duChip ? `<div style="flex-shrink:0;">${duChip}</div>` : ''}
      </div>
    </div>
    <div class="task-actions" style="position:relative">
      <div class="action-btn" data-action="toggle-task-menu" data-id="${task.id}" title="Actions">⋮</div>
      <div class="group-dropdown" id="taskMenu-${task.id}" style="right:0;top:100%;min-width:160px;">
        ${buildColorPicker('set-task-color', task.id, colId, task.color)}
        <div class="group-dropdown-divider"></div>
        <div class="group-dropdown-item" data-action="rename-task" data-id="${task.id}" data-col="${colId}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Rename
        </div>
        <div class="group-dropdown-item" data-action="toggle-important" data-id="${task.id}" data-col="${colId}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${task.important ? '#fbbf24' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          ${task.important ? 'Unmark important' : 'Mark as important'}
        </div>
        <div class="group-dropdown-item" onclick="try{this.querySelector('input').showPicker()}catch(e){}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Set due date
          <input type="date" class="inline-due-input" data-action="due-change" data-id="${task.id}" data-col="${colId}" value="${task.dueDate || ''}">
        </div>
        <div class="group-dropdown-divider"></div>
        <div class="group-dropdown-item" data-action="delete-task" data-id="${task.id}" data-col="${colId}" style="color:#ef4444">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          Delete
        </div>
      </div>
    </div>
  </div>`;
    }

    function renderGroupNode(group, depth, colId, filter, isHome = false, inheritedDeadline = null) {
      if (group.archived) return '';

      const currentDeadline = group.deadline || inheritedDeadline;
      let childrenHtml = '';
      for (const c of (group.children || [])) childrenHtml += renderItem(c, depth + 1, colId, filter, isHome, currentDeadline);

      if (filter && filter !== 'all' && childrenHtml === '') return '';

      const { completed, total } = getProgress(group, filter, inheritedDeadline);
      const pPct = total > 0 ? (completed / total) * 100 : 0;
      const pColor = total === 0 ? '#2a2a2a' : 'rgba(255,255,255,0.4)';
      const groupCompleted = total > 0 && completed === total;

      let chip = '';
      if (group.startDate || group.deadline) {
        let text = '';
        if (group.startDate && group.deadline) text = `${formatDateShort(group.startDate)} - ${formatDateShort(group.deadline)}`;
        else if (group.startDate) text = `Starts ${formatDateShort(group.startDate)}`;
        else text = `Due ${formatDateShort(group.deadline)}`;

        let clr = group.deadline ? deadlineColor(group.deadline, isHome, groupCompleted) : 'gray';
        if (hasOverdueChild(group, filter, inheritedDeadline)) clr = 'red';
        chip = `<span class="deadline-chip ${clr}">${text}</span>`;
      } else if (hasOverdueChild(group, filter, inheritedDeadline)) {
        chip = `<span class="deadline-chip red">Overdue</span>`;
      }

      if (isHome) {
        const col = (filter && filter !== 'all') ? false : (group.homeCollapsed !== false);
        const arrow = col ? '▶' : '▼';
        const completedTasksCount = countCompletedTasks(group);
        const maxH = col ? '0' : '1000px'; // A sufficiently large value for expanded content
        const groupAccent = group.color ? `border-left:3px solid ${group.color};padding-left:5px;` : '';
        const depthCls = (depth > 0) ? ` depth-${depth}` : '';
        const levelCls = (depth >= 0) ? ` level-${depth}` : '';
        return `
          <div class="home-group${depthCls}" data-group-id="${group.id}" style="position:relative">
            <div class="home-group-header${levelCls}" style="cursor:pointer;display:flex;align-items:center;padding:6px 0;position:relative;" data-action="toggle-home-group" data-id="${group.id}">
              <div style="font-size:10px;color:#555;width:16px;text-align:left;transition:transform 0.2s;flex-shrink:0;">${arrow}</div>
              <div style="display:flex;align-items:center;min-width:0;flex:1;margin-left:8px;">
                <div class="home-group-name" style="color:#ccc;font-weight:500;flex:0 1 auto;">${escHtml(group.name)}</div>
                ${chip ? `<div style="margin-left:8px;flex-shrink:0;">${chip}</div>` : ''}
              </div>
              <div style="position:relative;margin-left:4px;flex-shrink:0;">
                <div class="action-btn home-group-dots" data-action="toggle-group-menu" data-id="${group.id}" style="opacity:0;transition:opacity 0.2s;font-size:14px;">⋯</div>
                <div class="group-dropdown" id="groupMenu-${group.id}" style="right:0;top:100%;">
                  ${buildColorPicker('set-group-color', group.id, colId, group.color)}
                  <div class="group-dropdown-divider"></div>
                  <div class="group-dropdown-item" data-action="rename-group" data-id="${group.id}" data-col="${colId}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Rename
                  </div>
                  <div class="group-dropdown-item${completedTasksCount === 0 ? ' disabled' : ''}" data-action="group-sweep" data-id="${group.id}" data-col="${colId}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path></svg>
                    Sweep
                  </div>
                  <div class="group-dropdown-item" data-action="delete-group" data-id="${group.id}" data-col="${colId}" style="color:#ef4444">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Delete
                  </div>
                </div>
              </div>
            </div>
            <div class="home-group-content" style="max-height:${maxH}; overflow:${col ? 'hidden' : 'visible'}; transition:max-height 0.3s ease;">
              <div style="padding-left:16px;display:flex;flex-direction:column;gap:0;">${childrenHtml}</div>
            </div>
          </div>
        `;
      }

      const col = group.collapsed;
      if (addingTaskIn === group.id) {
        childrenHtml += `<div class="inline-input-wrap" style="padding:4px 14px">
      <input class="inline-input" data-task-input="${group.id}" data-container="${group.id}" data-col="${colId}" placeholder="Task name…" autofocus>
      <div class="inline-cancel" data-action="cancel-task">×</div></div>`;
      } else {
        childrenHtml += `<div class="add-btn-wrap" style="padding:4px 14px;">
      <div class="add-btn" data-action="show-add-task" data-target="${group.id}" data-col="${colId}" style="font-size:12px;padding:4px 10px">+ Add task</div>
      <div class="add-btn" data-action="show-add-group" data-target="${group.id}" data-col="${colId}" style="font-size:12px;padding:4px 10px">+ Add nested group</div>
    </div>`;
      }

      const badge = `<span class="type-badge ${group.type}" style="margin-left:8px">${group.type === 'persistent' ? 'STAYS' : 'AUTO-ARCHIVE'}</span>`;

      const inlineProg = `<div style="width:40px;height:4px;border-radius:999px;background:#2a2a2a;overflow:hidden;flex-shrink:0"><div style="height:100%;width:${pPct}%;background:${pColor};transition:width 0.3s"></div></div><div style="font-size:11px;color:#555;margin-left:8px;font-weight:500;min-width:26px;text-align:right">${completed}/${total}</div>`;

      const completedTasksCount = countCompletedTasks(group);
      const isArchiveDisabled = completedTasksCount === 0 ? ' style="color:#444;pointer-events:none"' : '';

      const groupAccentList = group.color ? `border-left:3px solid ${group.color};padding-left:11px;` : '';

      const depthCls = (depth > 0) ? ` depth-${depth}` : '';
      const levelCls = (depth >= 0) ? ` level-${depth}` : '';

      return `
  <div class="toggle-group${depthCls}" data-group-id="${group.id}" draggable="true">
    <div class="toggle-header${levelCls}" data-action="toggle-collapse" data-id="${group.id}" style="${groupAccentList}">
      <div class="toggle-arrow${col ? ' collapsed' : ''}" data-arrow-id="${group.id}">▼</div>
      <div style="display:flex;align-items:center;min-width:0;flex:1;">
        <div class="toggle-name" style="flex:0 1 auto;">${escHtml(group.name)}</div>
        ${badge}${chip ? `<div style="flex-shrink:0;">${chip}</div>` : ''}
      </div>
      ${inlineProg}
      <div class="task-actions" style="opacity:1;margin-left:8px;position:relative;z-index:2">
        <div style="position:relative">
          <div class="action-btn" data-action="toggle-group-menu" data-id="${group.id}">⋯</div>
          <div class="group-dropdown" id="groupMenu-${group.id}" style="right:0;top:100%;">
            ${buildColorPicker('set-group-color', group.id, colId, group.color)}
            <div class="group-dropdown-divider"></div>
            <div class="group-dropdown-item" onclick="try{this.querySelector('input').showPicker()}catch(e){}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="12" y1="14" x2="12" y2="18"></line><line x1="10" y1="16" x2="14" y2="16"></line></svg>
              Set start date
              <input type="date" class="inline-due-input" data-action="start-change" data-id="${group.id}" data-col="${colId}" value="${group.startDate || ''}">
            </div>
            <div class="group-dropdown-item" onclick="try{this.querySelector('input').showPicker()}catch(e){}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="12" cy="16" r="3"></circle><path d="M12 14.5v1.5l1 1"></path></svg>
              Set deadline
              <input type="date" class="inline-due-input" data-action="due-change" data-id="${group.id}" data-col="${colId}" value="${group.deadline || ''}">
            </div>
            <div class="group-dropdown-divider"></div>
            <div class="group-dropdown-item" data-action="rename-group" data-id="${group.id}" data-col="${colId}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              Rename
            </div>
            <div class="group-dropdown-item${completedTasksCount === 0 ? ' disabled' : ''}" data-action="group-sweep" data-id="${group.id}" data-col="${colId}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path></svg>
              Sweep
            </div>
            <div class="group-dropdown-divider"></div>
            <div class="group-dropdown-item" data-action="delete-group" data-id="${group.id}" data-col="${colId}" style="color:#ef4444">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Delete
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="toggle-content${col ? '' : ' expanded'}" data-content-id="${group.id}">
      <div class="toggle-inner"><div class="${depth >= 0 ? 'nested-indent' : ''}">${childrenHtml}</div></div>
    </div>
  </div>`;
    }

    function buildCompletedView() {
      let mainHtml = `<div class="flat-list" style="display:flex;flex-direction:column;gap:16px">`;
      let hasAny = false;

      state.columns.forEach(col => {
        let listHtml = `
          <div>
            <div style="font-size:13px;text-transform:uppercase;color:#555;font-weight:600;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
              <span>${escHtml(col.name)}</span>
              <div class="action-btn" data-action="clear-list-completed" data-col="${col.id}" style="width:auto;padding:0 8px;font-size:11px;color:#9b9b9b">Clear all</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">`;

        let hasItemsInList = false;

        const gather = (items, pathStr) => {
          let html = '';
          items.forEach(i => {
            if (i.archived) {
              hasItemsInList = true;
              hasAny = true;
              if (i.itemType === 'group') {
                const maxH = '1000px'; // Archived groups are initially collapsed, but can be expanded
                html += `<div class="toggle-group" style="margin-top:8px">
                  <div class="toggle-header" onclick="this.nextElementSibling.classList.toggle('expanded');this.querySelector('.toggle-arrow').classList.toggle('collapsed')">
                    <div class="toggle-arrow collapsed">▼</div>
                    <div class="toggle-name" style="text-decoration:line-through;color:#888">${escHtml(i.name)}</div>
                    <div class="action-btn trash" data-action="delete-archived" data-id="${i.id}" data-col="${col.id}" style="margin-left:auto;opacity:1;width:24px;height:24px;font-size:14px">×</div>
                  </div>
                  <div class="toggle-content">
                    <div class="toggle-inner"><div style="padding-left:24px;display:flex;flex-direction:column;gap:4px">`;
                const gatherTasks = (children) => {
                  let inner = '';
                  children.forEach(c => {
                    if (c.itemType === 'task') {
                      inner += `<div class="task-item" style="padding:4px 0;background:transparent;border:none"><div class="task-text done" style="color:#888">${escHtml(c.text)}</div></div>`;
                    } else if (c.itemType === 'group' && c.children) {
                      inner += gatherTasks(c.children);
                    }
                  });
                  return inner;
                };
                html += gatherTasks(i.children || []);
                html += `</div></div></div></div>`;
              } else {
                html += `<div class="task-item" style="padding:4px 0;background:transparent;border:none;justify-content:space-between">
                  <div style="display:flex;flex-direction:column;min-width:0">
                    <div class="task-text done" style="color:#888">${escHtml(i.text)}</div>
                    ${pathStr ? `<div style="font-size:11px;color:#888;margin-top:2px">${escHtml(pathStr)}</div>` : ''}
                  </div>
                  <div class="action-btn trash" data-action="delete-archived" data-id="${i.id}" data-col="${col.id}" style="opacity:1;flex-shrink:0;width:24px;height:24px;font-size:14px">×</div>
                </div>`;
              }
            } else if (i.itemType === 'group' && i.children) {
              html += gather(i.children, i.name);
            }
          });
          return html;
        };

        const itemsHtml = gather(col.items, '');
        if (hasItemsInList) {
          listHtml += itemsHtml + `</div></div>`;
          mainHtml += listHtml;
        }
      });

      if (!hasAny) mainHtml += `<div class="empty-state"><div class="empty-title" style="color:#9b9b9b">No completed tasks yet</div></div>`;
      mainHtml += `</div>`;

      const isMobile = window.innerWidth <= 768;
      const mobileHeader = getMobileHeaderHtml('Completed');
      const desktopHeader = isMobile ? '' : `<div style="display:flex;align-items:center;justify-content:space-between"><div class="view-title">✓ Completed</div></div>`;
      let head = `<div class="view-header">${mobileHeader}${desktopHeader}</div>`;

      return head + mainHtml;
    }

    function buildTrashView() {
      const isMobile = window.innerWidth <= 768;
      const mobileHeader = getMobileHeaderHtml('Trash');
      const desktopHeader = isMobile ? '' : `<div style="display:flex;align-items:center;justify-content:space-between"><div class="view-title">🗑 Trash</div>
    ${state.trash.length > 0 ? `<button class="add-btn" data-action="empty-trash" style="color:#ef4444;border-color:#ef4444;margin:0;width:auto">Empty Trash</button>` : ''}
  </div>`;
      let html = `<div class="view-header">${mobileHeader}${desktopHeader}</div><div class="flat-list" style="display:flex;flex-direction:column;gap:8px">`;
      if (state.trash.length === 0) {
        html += `<div class="empty-state"><div class="empty-title" style="color:#9b9b9b">Trash is empty</div></div>`;
      } else {
        state.trash.forEach((tItem, idx) => {
          const name = tItem.item.itemType === 'task' ? tItem.item.text : tItem.item.name;
          html += `<div class="task-item" style="border:1px solid #2e2e2e">
        <div class="task-info">
          <span class="task-text">${escHtml(name)}</span>
          <span class="task-bread">Deleted: ${formatDateShort(tItem.deletedAt)}</span>
        </div>
        <button class="add-btn" data-action="restore-trash" data-idx="${idx}" style="width:auto;margin:0;padding:6px 12px">Restore</button>
      </div>`;
        });
      }
      html += `</div>`;
      return html;
    }

    function renderBottomNav() {
      const bn = document.getElementById('bottomNav');
      if (!bn) return;
      if (window.innerWidth > 768) {
        bn.style.display = 'none';
        return;
      }
      bn.style.display = 'flex';

      const navItems = [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'calendar', label: 'Calendar', icon: 'calendar' },
        { id: 'important', label: 'Important', icon: 'star' },
        { id: 'overdue', label: 'Overdue', icon: 'clock' }
      ];

      bn.innerHTML = navItems.map(item => `
        <a href="#" class="bn-item${currentView === item.id ? ' active' : ''}" data-action="nav" data-view="${item.id}">
          <i data-lucide="${item.icon}"></i>
          <span class="bn-label">${item.label}</span>
        </a>
      `).join('');

      renderLucideIcons(bn);
    }

    function render() {
      // Save scroll positions across potential containers
      const scrolls = [];
      ['.home-view', '.list-content', '.cal-view', '#sidebar', '.grid-mobile'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el) scrolls.push({ sel, top: el.scrollTop });
      });

      const sb = document.querySelector('.sidebar');
      if (sb) {
        if (state.sbCollapsed) sb.classList.add('collapsed'); else sb.classList.remove('collapsed');
      }
      
      renderSidebar();
      renderBottomNav();
      renderMainContent();
      
      // Toggle FAB visibility
      const fab = document.getElementById('fab');
      if (fab) {
        fab.style.display = (window.innerWidth <= 768 && currentView === 'home') ? 'flex' : 'none';
      }

      // Restore scroll positions
      scrolls.forEach(s => {
        const el = document.querySelector(s.sel);
        if (el) el.scrollTop = s.top;
      });
    }

    function renderHierarchicalSelector() {
      const drop = document.getElementById('qtSelectorDropdown');
      if (!drop) return;
      
      let html = '';
      const buildNode = (item, level) => {
        const hasGroups = item.children && item.children.some(c => c.itemType === 'group' && !c.archived);
        const isExpanded = qtExpandedIds.has(item.id);
        const isSelected = qtSelectedId === item.id;
        
        let nodeHtml = `
          <div class="qs-item-row">
            <div style="display:flex; align-items:center;">
              ${hasGroups ? `<div class="qs-toggle-arrow ${isExpanded ? 'expanded' : ''}" data-action="qt-toggle" data-id="${item.id}">▸</div>` : '<div style="width:36px;"></div>'}
              <div class="qs-item ${isSelected ? 'selected' : ''}" data-action="qt-select" data-id="${item.id}" data-name="${escHtml(item.name)}">
                ${escHtml(item.name)}
              </div>
            </div>
        `;
        if (hasGroups) {
          nodeHtml += `<div class="qs-group-children ${isExpanded ? 'show' : ''}">
            ${item.children.filter(c => c.itemType === 'group' && !c.archived).map(c => buildNode(c, level + 1)).join('')}
          </div>`;
        }
        nodeHtml += `</div>`;
        return nodeHtml;
      };
      
      state.columns.forEach(col => {
        const hasGroups = col.items && col.items.some(i => i.itemType === 'group' && !i.archived);
        const isExpanded = qtExpandedIds.has(col.id);
        const isSelected = qtSelectedId === col.id;
        html += `
          <div class="qs-item-row">
            <div style="display:flex; align-items:center;">
              ${hasGroups ? `<div class="qs-toggle-arrow ${isExpanded ? 'expanded' : ''}" data-action="qt-toggle" data-id="${col.id}">▸</div>` : '<div style="width:36px;"></div>'}
              <div class="qs-item ${isSelected ? 'selected' : ''}" data-action="qt-select" data-id="${col.id}" data-name="${escHtml(col.name)}">
                <strong>${escHtml(col.name)}</strong>
              </div>
            </div>
        `;
        if (hasGroups) {
          html += `<div class="qs-group-children ${isExpanded ? 'show' : ''}">
            ${col.items.filter(i => i.itemType === 'group' && !i.archived).map(i => buildNode(i, 1)).join('')}
          </div>`;
        }
        html += `</div>`;
      });
      drop.innerHTML = html;
    }
