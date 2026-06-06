(() => {
  const STORAGE_KEY = 'koc.gameState.v1';
  const BASE_WIDTH = 1035;
  const BASE_HEIGHT = 1590;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const MAP_IMAGE_PATH = 'Game Map.png';

  const mapViewport = document.getElementById('map-viewport');
  const mapCanvas = document.getElementById('map-canvas');
  const spacesLayer = document.getElementById('spaces-layer');
  const showSpaceNamesToggle = document.getElementById('show-space-names');
  const mouseCoords = document.getElementById('mouse-coords');
  const zoomRange = document.getElementById('zoom-range');
  const zoomValue = document.getElementById('zoom-value');
  const spaceCount = document.getElementById('space-count');

  const regionLabelAnchors = [
    { name: 'Dan', x: 664, y: 96 },
    { name: 'Upper Galilee', x: 617, y: 214 },
    { name: 'Lower Galilee', x: 547, y: 391 },
    { name: 'Jezreel', x: 533, y: 470 },
    { name: 'Dor', x: 238, y: 600 },
    { name: 'Joppa', x: 283, y: 838 },
    { name: 'Philistia', x: 180, y: 1115 },
    { name: 'Wilderness', x: 186, y: 1320 },
    { name: 'Samaria', x: 464, y: 741 },
    { name: 'Shephela', x: 406, y: 925 },
    { name: 'Bethel', x: 542, y: 806 },
    { name: 'Jerusalem', x: 500, y: 953 },
    { name: 'Benjamin', x: 575, y: 990 },
    { name: 'Jeshimon', x: 620, y: 1060 },
    { name: 'Hebron', x: 360, y: 1150 },
    { name: 'Negev', x: 384, y: 1310 },
    { name: 'Wilderness', x: 200, y: 1350 },
    { name: 'Bashan', x: 804, y: 220 },
    { name: 'Geshur', x: 835, y: 322 },
    { name: 'Argob', x: 985, y: 334 },
    { name: 'Gilead', x: 818, y: 572 },
    { name: 'Jazer', x: 802, y: 770 },
    { name: 'Ammon', x: 954, y: 930 },
    { name: 'Mishor', x: 792, y: 990 },
    { name: 'Moab', x: 775, y: 1265 },
    { name: 'Valley of Siddim', x: 588, y: 1414 },
    { name: 'Edom', x: 760, y: 1480 }
  ];

  const supplementalEdgeSpaceSeeds = [
    { x: 982, y: 332 },
    { x: 968, y: 930 },
    { x: 980, y: 1115 },
    { x: 588, y: 1414 },
    { x: 760, y: 1480 },
    { x: 200, y: 1350 },
    { x: 176, y: 618 }
  ];

  const mergedSpaceGroups = [
    [2, 3],
    [26, 28]
  ];

  const removedSpaceIndices = [5, 35];

  const defaultState = {
    zoom: 1,
    scrollLeft: 0,
    scrollTop: 0,
    units: [
      { id: 'israel', label: 'ISR', x: 420, y: 620, spaceId: '' },
      { id: 'judah', label: 'JUD', x: 500, y: 720, spaceId: '' },
      { id: 'assyria', label: 'ASS', x: 1080, y: 340, spaceId: '' }
    ]
  };

  const detectedSpaces = [];
  let spacesById = new Map();
  let spaceLookupByPixel = null;
  let sourceMapWidth = 1035;
  let sourceMapHeight = 1590;

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
              y: sanitizeNumber(unit.y, 0, BASE_HEIGHT, BASE_HEIGHT / 2),
              spaceId: typeof unit.spaceId === 'string' ? unit.spaceId : ''
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

  function updateMouseCoordsText(sourceX, sourceY) {
    if (!mouseCoords) {
      return;
    }

    if (sourceX === null || sourceY === null) {
      mouseCoords.textContent = 'Mouse: -, -';
      return;
    }

    mouseCoords.textContent = `Mouse: ${Math.round(sourceX)}, ${Math.round(sourceY)}`;
  }

  function toSourceX(boardX) {
    return sanitizeNumber((boardX / BASE_WIDTH) * sourceMapWidth, 0, sourceMapWidth - 1, 0);
  }

  function toSourceY(boardY) {
    return sanitizeNumber((boardY / BASE_HEIGHT) * sourceMapHeight, 0, sourceMapHeight - 1, 0);
  }

  function toBoardX(sourceX) {
    return (sourceX / sourceMapWidth) * BASE_WIDTH;
  }

  function toBoardY(sourceY) {
    return (sourceY / sourceMapHeight) * BASE_HEIGHT;
  }

  function syncMapSize() {
    mapCanvas.style.width = `${Math.round(BASE_WIDTH * state.zoom)}px`;
    mapCanvas.style.height = `${Math.round(BASE_HEIGHT * state.zoom)}px`;
    zoomRange.value = String(state.zoom);
    zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
    renderSpaceMarkers(detectedSpaces);
  }

  function rgbToHsv(r, g, b) {
    const nr = r / 255;
    const ng = g / 255;
    const nb = b / 255;
    const max = Math.max(nr, ng, nb);
    const min = Math.min(nr, ng, nb);
    const delta = max - min;

    let hue = 0;
    if (delta !== 0) {
      if (max === nr) {
        hue = ((ng - nb) / delta) % 6;
      } else if (max === ng) {
        hue = (nb - nr) / delta + 2;
      } else {
        hue = (nr - ng) / delta + 4;
      }
    }

    hue = Math.round(hue * 60);
    if (hue < 0) {
      hue += 360;
    }

    const saturation = max === 0 ? 0 : delta / max;
    const value = max;
    return { hue, saturation, value };
  }

  function isBoundaryPixel(r, g, b, x, y, width, height) {
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1 || y < 20) {
      return true;
    }

    const { hue, saturation, value } = rgbToHsv(r, g, b);
    const isRedBoundary =
      (hue < 22 || hue > 338) &&
      saturation > 0.25 &&
      value > 0.28 &&
      r > g + 18 &&
      r > b + 18;
    const isWaterBoundary = hue > 165 && hue < 245 && saturation > 0.12 && value > 0.3;
    return isRedBoundary || isWaterBoundary;
  }

  function dilateMask(mask, width, height) {
    const dilated = new Uint8Array(mask.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = y * width + x;
        if (!mask[idx]) {
          continue;
        }

        for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny += 1) {
          for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx += 1) {
            dilated[ny * width + nx] = 1;
          }
        }
      }
    }

    return dilated;
  }

  function extractSpacesFromMask(blocked, width, height) {
    const visited = new Uint8Array(blocked.length);
    const queueX = new Int32Array(blocked.length);
    const queueY = new Int32Array(blocked.length);
    const spaces = [];
    const spaceIdMap = new Int32Array(blocked.length);
    const minArea = 3000;
    const maxArea = 100000;
    let nextId = 1;

    for (let y0 = 0; y0 < height; y0 += 1) {
      for (let x0 = 0; x0 < width; x0 += 1) {
        const startIdx = y0 * width + x0;
        if (visited[startIdx] || blocked[startIdx]) {
          continue;
        }

        let head = 0;
        let tail = 0;
        queueX[tail] = x0;
        queueY[tail] = y0;
        tail += 1;
        visited[startIdx] = 1;

        let area = 0;
        let sumX = 0;
        let sumY = 0;
        let minX = x0;
        let minY = y0;
        let maxX = x0;
        let maxY = y0;
        const pixels = [];

        while (head < tail) {
          const x = queueX[head];
          const y = queueY[head];
          head += 1;

          area += 1;
          sumX += x;
          sumY += y;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          pixels.push(y * width + x);

          const neighbors = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1]
          ];

          neighbors.forEach(([nx, ny]) => {
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
              return;
            }

            const neighborIdx = ny * width + nx;
            if (visited[neighborIdx] || blocked[neighborIdx]) {
              return;
            }

            visited[neighborIdx] = 1;
            queueX[tail] = nx;
            queueY[tail] = ny;
            tail += 1;
          });
        }

        if (area < minArea || area > maxArea) {
          continue;
        }

        const space = {
          id: `space-${nextId}`,
          index: nextId,
          area,
          centroidX: sumX / area,
          centroidY: sumY / area,
          minX,
          minY,
          maxX,
          maxY,
          name: ''
        };

        spaces.push(space);
        pixels.forEach((pixelIndex) => {
          spaceIdMap[pixelIndex] = nextId;
        });
        nextId += 1;
      }
    }

    return { spaces, spaceIdMap };
  }

  function findNearestLabelName(sourceX, sourceY) {
    let nearestName = 'Unknown';
    let nearestDistance = Number.POSITIVE_INFINITY;

    regionLabelAnchors.forEach((label) => {
      const dx = sourceX - label.x;
      const dy = sourceY - label.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < nearestDistance) {
        nearestDistance = distanceSquared;
        nearestName = label.name;
      }
    });

    return nearestName;
  }

  function assignSpaceNames(spaces) {
    const nameCounts = new Map();
    spaces
      .slice()
      .sort((a, b) => a.index - b.index)
      .forEach((space) => {
        const baseName = findNearestLabelName(space.centroidX, space.centroidY);
        const currentCount = (nameCounts.get(baseName) || 0) + 1;
        nameCounts.set(baseName, currentCount);
        space.name = currentCount === 1 ? baseName : `${baseName} ${currentCount}`;
      });
  }

  function addSupplementalEdgeSpaces(spaces) {
    const minDistanceSquared = 85 * 85;
    let nextIndex = spaces.reduce((maxIndex, space) => Math.max(maxIndex, space.index), 0) + 1;

    supplementalEdgeSpaceSeeds.forEach((seed) => {
      const overlapsExisting = spaces.some((space) => {
        const dx = seed.x - space.centroidX;
        const dy = seed.y - space.centroidY;
        return dx * dx + dy * dy < minDistanceSquared;
      });

      if (overlapsExisting) {
        return;
      }

      spaces.push({
        id: `space-${nextIndex}`,
        index: nextIndex,
        area: 0,
        centroidX: seed.x,
        centroidY: seed.y,
        minX: Math.max(0, seed.x - 10),
        minY: Math.max(0, seed.y - 10),
        maxX: Math.min(sourceMapWidth - 1, seed.x + 10),
        maxY: Math.min(sourceMapHeight - 1, seed.y + 10),
        name: ''
      });

      nextIndex += 1;
    });
  }

  function mergeConfiguredSpaces(spaces, pixelLookup, groups, removedIndices) {
    if (!groups.length && !removedIndices.length) {
      return;
    }

    const byIndex = new Map();
    spaces.forEach((space) => byIndex.set(space.index, space));

    const removed = new Set(removedIndices);
    const consumed = new Set();
    const mergedTargetByOld = new Map();
    const mergedOutput = [];

    groups.forEach((group) => {
      const indices = group
        .filter((index) => Number.isInteger(index))
        .sort((a, b) => a - b)
        .filter((index) => {
          if (removed.has(index) || consumed.has(index) || !byIndex.has(index)) {
            return false;
          }
          return true;
        });

      if (indices.length < 2) {
        return;
      }

      const targetIndex = indices[0];
      indices.forEach((index) => consumed.add(index));
      indices.forEach((index) => mergedTargetByOld.set(index, targetIndex));

      let totalWeight = 0;
      let weightedX = 0;
      let weightedY = 0;
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      let mergedArea = 0;

      indices.forEach((index) => {
        const space = byIndex.get(index);
        const weight = Math.max(1, space.area || 0);
        totalWeight += weight;
        weightedX += space.centroidX * weight;
        weightedY += space.centroidY * weight;
        mergedArea += space.area || 0;
        minX = Math.min(minX, space.minX);
        minY = Math.min(minY, space.minY);
        maxX = Math.max(maxX, space.maxX);
        maxY = Math.max(maxY, space.maxY);
      });

      mergedOutput.push({
        id: `space-${targetIndex}`,
        index: targetIndex,
        area: mergedArea,
        centroidX: weightedX / totalWeight,
        centroidY: weightedY / totalWeight,
        minX,
        minY,
        maxX,
        maxY,
        name: ''
      });
    });

    spaces.forEach((space) => {
      if (removed.has(space.index) || consumed.has(space.index)) {
        return;
      }

      mergedOutput.push(space);
    });

    mergedOutput.sort((a, b) => a.index - b.index);

    if (pixelLookup) {
      for (let i = 0; i < pixelLookup.length; i += 1) {
        const oldIndex = pixelLookup[i];
        if (oldIndex <= 0) {
          continue;
        }

        if (removed.has(oldIndex)) {
          pixelLookup[i] = 0;
          continue;
        }

        pixelLookup[i] = mergedTargetByOld.get(oldIndex) || oldIndex;
      }
    }

    spaces.length = 0;
    mergedOutput.forEach((space) => spaces.push(space));
  }

  function renderSpaceMarkers(spaces) {
    if (!spacesLayer) {
      return;
    }

    spacesLayer.innerHTML = '';

    spaces.forEach((space) => {
      const marker = document.createElement('div');
      marker.className = 'space-marker';
      marker.textContent = showSpaceNamesToggle && showSpaceNamesToggle.checked
        ? `${space.index} ${space.name}`
        : String(space.index);
      marker.title = space.name || `Space ${space.index}`;
      marker.style.left = `${Math.round(toBoardX(space.centroidX) * state.zoom)}px`;
      marker.style.top = `${Math.round(toBoardY(space.centroidY) * state.zoom)}px`;
      spacesLayer.appendChild(marker);
    });

    if (spaceCount) {
      spaceCount.textContent = `Spaces: ${spaces.length}`;
    }
  }

  function rebuildSpaceLookups() {
    spacesById = new Map();
    detectedSpaces.forEach((space) => {
      spacesById.set(space.id, space);
    });
  }

  function findNearestSpaceBySourcePoint(sourceX, sourceY) {
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    detectedSpaces.forEach((space) => {
      const dx = sourceX - space.centroidX;
      const dy = sourceY - space.centroidY;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < nearestDistance) {
        nearestDistance = distanceSquared;
        nearest = space;
      }
    });

    return nearest;
  }

  function findSpaceForBoardPoint(boardX, boardY) {
    if (!detectedSpaces.length) {
      return null;
    }

    const sourceX = toSourceX(boardX);
    const sourceY = toSourceY(boardY);

    if (spaceLookupByPixel) {
      const ix = Math.round(sourceX);
      const iy = Math.round(sourceY);
      const mapIndex = iy * sourceMapWidth + ix;
      const spaceIndex = spaceLookupByPixel[mapIndex];
      if (spaceIndex > 0) {
        return spacesById.get(`space-${spaceIndex}`) || null;
      }
    }

    return findNearestSpaceBySourcePoint(sourceX, sourceY);
  }

  function snapUnitToSpace(unit, space) {
    if (!space) {
      return;
    }

    unit.spaceId = space.id;
    unit.x = toBoardX(space.centroidX);
    unit.y = toBoardY(space.centroidY);
  }

  function snapAllUnitsToSpaces() {
    if (!detectedSpaces.length) {
      return;
    }

    state.units.forEach((unit) => {
      const fromStoredSpace = spacesById.get(unit.spaceId);
      if (fromStoredSpace) {
        snapUnitToSpace(unit, fromStoredSpace);
        return;
      }

      const targetSpace = findSpaceForBoardPoint(unit.x, unit.y);
      if (targetSpace) {
        snapUnitToSpace(unit, targetSpace);
      }
    });
  }

  function renderUnits() {
    mapCanvas.querySelectorAll('.unit').forEach((node) => node.remove());

    const stackCounters = new Map();

    state.units.forEach((unit) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'unit';
      button.textContent = unit.label;
      button.dataset.unitId = unit.id;

      const hasSpace = unit.spaceId && spacesById.has(unit.spaceId);
      const stackIndex = hasSpace ? stackCounters.get(unit.spaceId) || 0 : 0;
      if (hasSpace) {
        stackCounters.set(unit.spaceId, stackIndex + 1);
      }

      positionUnit(button, unit, stackIndex);

      if (hasSpace) {
        const space = spacesById.get(unit.spaceId);
        button.title = `${unit.label} in ${space.name}`;
      }

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

  function positionUnit(element, unit, stackIndex) {
    let baseX = unit.x;
    let baseY = unit.y;

    if (unit.spaceId && spacesById.has(unit.spaceId)) {
      const space = spacesById.get(unit.spaceId);
      baseX = toBoardX(space.centroidX);
      baseY = toBoardY(space.centroidY);
    }

    const offset = stackIndex * 3 * state.zoom;
    element.style.left = `${Math.round(baseX * state.zoom + offset)}px`;
    element.style.top = `${Math.round(baseY * state.zoom + offset)}px`;
  }

  function onPointerMove(event) {
    const bounds = mapCanvas.getBoundingClientRect();
    const boardX = sanitizeNumber((event.clientX - bounds.left) / state.zoom, 0, BASE_WIDTH, 0);
    const boardY = sanitizeNumber((event.clientY - bounds.top) / state.zoom, 0, BASE_HEIGHT, 0);
    updateMouseCoordsText(toSourceX(boardX), toSourceY(boardY));

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const pixelX = sanitizeNumber(event.clientX - bounds.left, 0, mapCanvas.clientWidth, 0);
    const pixelY = sanitizeNumber(event.clientY - bounds.top, 0, mapCanvas.clientHeight, 0);

    dragState.element.style.left = `${Math.round(pixelX)}px`;
    dragState.element.style.top = `${Math.round(pixelY)}px`;
  }

  function stopDrag(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const unit = state.units.find((item) => item.id === dragState.unitId);
    if (unit) {
      const bounds = mapCanvas.getBoundingClientRect();
      const boardX = sanitizeNumber((event.clientX - bounds.left) / state.zoom, 0, BASE_WIDTH, unit.x);
      const boardY = sanitizeNumber((event.clientY - bounds.top) / state.zoom, 0, BASE_HEIGHT, unit.y);

      if (detectedSpaces.length) {
        const targetSpace = findSpaceForBoardPoint(boardX, boardY);
        if (targetSpace) {
          snapUnitToSpace(unit, targetSpace);
        }
      } else {
        unit.x = boardX;
        unit.y = boardY;
      }
    }

    dragState.element.classList.remove('dragging');
    dragState = null;
    renderUnits();
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

  async function analyzeMapSpaces() {
    if (spaceCount) {
      spaceCount.textContent = 'Spaces: analyzing...';
    }

    const image = new Image();
    image.src = MAP_IMAGE_PATH;

    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error('Unable to load map image.')), { once: true });
    });

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    sourceMapWidth = width;
    sourceMapHeight = height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);

    const { data } = context.getImageData(0, 0, width, height);
    const blocked = new Uint8Array(width * height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = y * width + x;
        const offset = idx * 4;
        blocked[idx] = isBoundaryPixel(data[offset], data[offset + 1], data[offset + 2], x, y, width, height)
          ? 1
          : 0;
      }
    }

    const dilatedBlocked = dilateMask(blocked, width, height);
    const extraction = extractSpacesFromMask(dilatedBlocked, width, height);

    detectedSpaces.length = 0;
    detectedSpaces.push(...extraction.spaces);
    addSupplementalEdgeSpaces(detectedSpaces);
    mergeConfiguredSpaces(detectedSpaces, extraction.spaceIdMap, mergedSpaceGroups, removedSpaceIndices);
    assignSpaceNames(detectedSpaces);

    spaceLookupByPixel = extraction.spaceIdMap;
    rebuildSpaceLookups();
    snapAllUnitsToSpaces();
    renderSpaceMarkers(detectedSpaces);
    renderUnits();
    saveState();
  }

  mapCanvas.addEventListener('pointermove', onPointerMove);
  mapCanvas.addEventListener('pointerup', stopDrag);
  mapCanvas.addEventListener('pointercancel', stopDrag);
  mapCanvas.addEventListener('pointerleave', () => {
    updateMouseCoordsText(null, null);
  });

  zoomRange.addEventListener('input', () => setZoom(Number(zoomRange.value)));

  if (showSpaceNamesToggle) {
    showSpaceNamesToggle.addEventListener('change', () => {
      renderSpaceMarkers(detectedSpaces);
    });
  }

  mapViewport.addEventListener('scroll', () => {
    state.scrollLeft = mapViewport.scrollLeft;
    state.scrollTop = mapViewport.scrollTop;
    saveState();
  });

  syncMapSize();
  renderUnits();
  mapViewport.scrollLeft = state.scrollLeft;
  mapViewport.scrollTop = state.scrollTop;

  analyzeMapSpaces().catch(() => {
    if (spaceCount) {
      spaceCount.textContent = 'Spaces: unavailable';
    }
  });
})();
