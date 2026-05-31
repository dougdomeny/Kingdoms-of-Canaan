(() => {
  const STORAGE_KEY = 'koc.gameState.v1';
  const BASE_WIDTH = 1600;
  const BASE_HEIGHT = 1200;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;

  const mapViewport = document.getElementById('map-viewport');
  const mapCanvas = document.getElementById('map-canvas');
  const zoomRange = document.getElementById('zoom-range');
  const zoomValue = document.getElementById('zoom-value');

  const defaultState = {
    zoom: 1,
    scrollLeft: 0,
    scrollTop: 0,
    units: [
      { id: 'israel', label: 'ISR', x: 420, y: 620 },
      { id: 'judah', label: 'JUD', x: 500, y: 720 },
      { id: 'assyria', label: 'ASS', x: 1080, y: 340 }
    ]
  };

  const state = loadState();
  let dragState = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return structuredClone(defaultState);
      }

      const parsed = JSON.parse(raw);
      const zoom = sanitizeNumber(parsed.zoom, MIN_ZOOM, MAX_ZOOM, defaultState.zoom);
      const units = Array.isArray(parsed.units)
        ? parsed.units
            .map((unit) => ({
              id: String(unit.id || ''),
              label: String(unit.label || '').slice(0, 4).toUpperCase() || 'UNT',
              x: sanitizeNumber(unit.x, 0, BASE_WIDTH, BASE_WIDTH / 2),
              y: sanitizeNumber(unit.y, 0, BASE_HEIGHT, BASE_HEIGHT / 2)
            }))
            .filter((unit) => unit.id)
        : structuredClone(defaultState.units);

      return {
        zoom,
        scrollLeft: sanitizeNumber(parsed.scrollLeft, 0, BASE_WIDTH * zoom, 0),
        scrollTop: sanitizeNumber(parsed.scrollTop, 0, BASE_HEIGHT * zoom, 0),
        units: units.length ? units : structuredClone(defaultState.units)
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

  function sanitizeNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, number));
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function syncMapSize() {
    mapCanvas.style.width = `${Math.round(BASE_WIDTH * state.zoom)}px`;
    mapCanvas.style.height = `${Math.round(BASE_HEIGHT * state.zoom)}px`;
    zoomRange.value = String(state.zoom);
    zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function renderUnits() {
    mapCanvas.querySelectorAll('.unit').forEach((node) => node.remove());

    state.units.forEach((unit) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'unit';
      button.textContent = unit.label;
      button.dataset.unitId = unit.id;
      positionUnit(button, unit);

      button.addEventListener('pointerdown', (event) => {
        dragState = {
          pointerId: event.pointerId,
          unitId: unit.id,
          element: button
        };
        button.classList.add('dragging');
        button.setPointerCapture(event.pointerId);
      });

      mapCanvas.appendChild(button);
    });
  }

  function positionUnit(element, unit) {
    element.style.left = `${Math.round(unit.x * state.zoom)}px`;
    element.style.top = `${Math.round(unit.y * state.zoom)}px`;
  }

  function onPointerMove(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const unit = state.units.find((item) => item.id === dragState.unitId);
    if (!unit) {
      return;
    }

    const bounds = mapCanvas.getBoundingClientRect();
    unit.x = sanitizeNumber((event.clientX - bounds.left) / state.zoom, 0, BASE_WIDTH, unit.x);
    unit.y = sanitizeNumber((event.clientY - bounds.top) / state.zoom, 0, BASE_HEIGHT, unit.y);

    positionUnit(dragState.element, unit);
  }

  function stopDrag(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState.element.classList.remove('dragging');
    dragState = null;
    saveState();
  }

  function setZoom(nextZoom) {
    const clampedZoom = sanitizeNumber(nextZoom, MIN_ZOOM, MAX_ZOOM, state.zoom);
    if (clampedZoom === state.zoom) {
      return;
    }

    const centerX = (mapViewport.scrollLeft + mapViewport.clientWidth / 2) / state.zoom;
    const centerY = (mapViewport.scrollTop + mapViewport.clientHeight / 2) / state.zoom;

    state.zoom = clampedZoom;
    syncMapSize();
    renderUnits();

    mapViewport.scrollLeft = Math.max(0, centerX * state.zoom - mapViewport.clientWidth / 2);
    mapViewport.scrollTop = Math.max(0, centerY * state.zoom - mapViewport.clientHeight / 2);

    state.scrollLeft = mapViewport.scrollLeft;
    state.scrollTop = mapViewport.scrollTop;
    saveState();
  }

  mapCanvas.addEventListener('pointermove', onPointerMove);
  mapCanvas.addEventListener('pointerup', stopDrag);
  mapCanvas.addEventListener('pointercancel', stopDrag);

  zoomRange.addEventListener('input', () => setZoom(Number(zoomRange.value)));

  mapViewport.addEventListener('scroll', () => {
    state.scrollLeft = mapViewport.scrollLeft;
    state.scrollTop = mapViewport.scrollTop;
    saveState();
  });

  syncMapSize();
  renderUnits();
  mapViewport.scrollLeft = state.scrollLeft;
  mapViewport.scrollTop = state.scrollTop;
})();
