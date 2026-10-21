/**
 * macOS Desktop UI Interaction System
 * Built for Amirali Saleh Portfolio
 */

let zIndexCounter = 100;

// Setup live clock in top menu bar
function initClock() {
  const clockEl = document.getElementById('menu-clock');
  function updateTime() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    clockEl.textContent = now.toLocaleDateString('en-US', options).replace(/,/g, '');
  }
  updateTime();
  setInterval(updateTime, 1000);
}

// Window management: Dragging, bringing to front, tabs, close/minimize
function bringToFront(win) {
  zIndexCounter++;
  win.style.zIndex = zIndexCounter;
  document.querySelectorAll('.mac-window, .mac-dialog').forEach(w => w.classList.remove('active'));
  win.classList.add('active');
}

function makeDraggable(win) {
  const header = win.querySelector('.window-header');
  if (!header) return;

  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  header.addEventListener('mousedown', (e) => {
    // Prevent drag when clicking traffic lights
    if (e.target.closest('.traffic-lights') || e.target.closest('button')) return;

    isDragging = true;
    bringToFront(win);
    startX = e.clientX;
    startY = e.clientY;

    const rect = win.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    function onMouseMove(moveEvent) {
      if (!isDragging) return;
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;

      // Keep within bounds of menu bar at top
      if (newTop < 28) newTop = 28;

      win.style.left = `${newLeft}px`;
      win.style.top = `${newTop}px`;
      win.style.transform = 'none'; // Clear initial transform centering
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  win.addEventListener('mousedown', () => {
    bringToFront(win);
  });
}

// Window Open / Close handlers
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('hidden');
  bringToFront(win);

  // Mark running in dock if matching dock item exists
  const dockItem = document.querySelector(`.dock-item[data-window="${id}"]`);
  if (dockItem) {
    dockItem.classList.add('running');
  }
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('hidden');

  // Unmark running in dock
  const dockItem = document.querySelector(`.dock-item[data-window="${id}"]`);
  if (dockItem) {
    dockItem.classList.remove('running');
  }
}

// Dialog management
function openDialog(id) {
  const dlg = document.getElementById(id);
  if (!dlg) return;
  dlg.classList.remove('hidden');
  dlg.style.display = 'flex';
  zIndexCounter++;
  dlg.style.zIndex = zIndexCounter + 500;
}

function closeDialog(id) {
  const dlg = document.getElementById(id);
  if (!dlg) return;
  dlg.classList.add('hidden');
  dlg.style.display = 'none';
}

// Window Tab Switching
function initTabs() {
  document.querySelectorAll('.window-tabs').forEach(tabBar => {
    const tabs = tabBar.querySelectorAll('.tab-btn');
    const container = tabBar.closest('.window-body');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const targetPaneId = tab.dataset.tab;
        container.querySelectorAll('.tab-pane').forEach(pane => {
          if (pane.id === targetPaneId) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });
      });
    });
  });
}

// Initialize desktop icons selection and double-click actions
function initDesktopIcons() {
  const icons = document.querySelectorAll('.desktop-icon');
  
  icons.forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      icons.forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      
      const targetWindow = icon.dataset.window;
      if (targetWindow) {
        openWindow(targetWindow);
      }
    });

    icon.addEventListener('dblclick', () => {
      const targetWindow = icon.dataset.window;
      const targetDialog = icon.dataset.dialog;
      const targetUrl = icon.dataset.url;

      if (targetWindow) {
        openWindow(targetWindow);
      } else if (targetDialog) {
        openDialog(targetDialog);
      } else if (targetUrl) {
        window.open(targetUrl, '_blank');
      }
    });
  });

  // Deselect icons when clicking desktop background
  document.getElementById('desktop-canvas').addEventListener('click', () => {
    icons.forEach(i => i.classList.remove('selected'));
  });
}

// Initialize Dock interaction
function initDock() {
  const dockItems = document.querySelectorAll('.dock-item');
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      const winId = item.dataset.window;
      const dlgId = item.dataset.dialog;
      const targetUrl = item.dataset.url;

      if (winId) {
        const win = document.getElementById(winId);
        if (win && !win.classList.contains('hidden')) {
          // If already open and active, toggle or bring to front
          if (win.classList.contains('active')) {
            // minimize
            closeWindow(winId);
          } else {
            bringToFront(win);
          }
        } else {
          openWindow(winId);
        }
      } else if (dlgId) {
        openDialog(dlgId);
      } else if (targetUrl) {
        window.open(targetUrl, '_blank');
      }
    });
  });
}

// Init everything on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTabs();
  initDesktopIcons();
  initDock();

  // Setup all windows with draggable headers
  document.querySelectorAll('.mac-window').forEach(win => {
    makeDraggable(win);

    // Setup traffic lights
    const closeBtn = win.querySelector('.dot-red');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(win.id);
      });
    }

    const minBtn = win.querySelector('.dot-yellow');
    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(win.id);
      });
    }

    const maxBtn = win.querySelector('.dot-green');
    if (maxBtn) {
      maxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (win.dataset.maximized === 'true') {
          win.style.width = win.dataset.origW || '720px';
          win.style.height = win.dataset.origH || '500px';
          win.style.top = win.dataset.origTop || '100px';
          win.style.left = win.dataset.origLeft || '150px';
          win.dataset.maximized = 'false';
        } else {
          win.dataset.origW = win.style.width || win.offsetWidth + 'px';
          win.dataset.origH = win.style.height || win.offsetHeight + 'px';
          win.dataset.origTop = win.style.top || win.offsetTop + 'px';
          win.dataset.origLeft = win.style.left || win.offsetLeft + 'px';

          win.style.top = '36px';
          win.style.left = '12px';
          win.style.width = 'calc(100vw - 24px)';
          win.style.height = 'calc(100vh - 120px)';
          win.dataset.maximized = 'true';
        }
      });
    }
  });

  // Open the About/Finder window by default on load
  openWindow('win-about');
});
