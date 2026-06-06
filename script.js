(() => {
  const STORAGE_KEY = 'koc.gameState.v1';
  const BASE_WIDTH = 1035;
  const BASE_HEIGHT = 1590;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const MAP_IMAGE_PATH = 'Game Map.png';

  const mapViewport = document.getElementById('map-viewport');
  const mapCanvas = document.getElementById('map-canvas');
  const adjacencyLayer = document.getElementById('adjacency-layer');
  const spacesLayer = document.getElementById('spaces-layer');
  const showSpaceNamesToggle = document.getElementById('show-space-names');
  const mouseCoords = document.getElementById('mouse-coords');
  const zoomRange = document.getElementById('zoom-range');
  const zoomValue = document.getElementById('zoom-value');
  const spaceCount = document.getElementById('space-count');
  const currentTurnLabel = document.getElementById('current-turn');
  const currentPhaseLabel = document.getElementById('current-phase');
  const phaseHelpLabel = document.getElementById('phase-help');
  const nextPhaseButton = document.getElementById('next-phase');
  const resetGameButton = document.getElementById('reset-game');

  const TOTAL_TURNS = 9;
  const PHASES = [
    {
      id: 'growth',
      label: 'Growth Phase',
      helpText: 'Leader enters and growth effects resolve.',
      nextLabel: 'Advance to Action Phase'
    },
    {
      id: 'action',
      label: 'Action Phase',
      helpText: 'Movement and combat are resolved in this phase.',
      nextLabel: 'Advance to End Phase'
    },
    {
      id: 'end',
      label: 'End Phase',
      helpText: 'Leaders and invaders are removed from the board.',
      nextLabel: 'Advance to Next Turn'
    }
  ];

  const leaderSchedule = new Map([
    [1, { unitTypeId: 'hebrew-joshua', anchor: { x: 500, y: 953 }, preferredSpaceName: 'Jerusalem' }],
    [5, { unitTypeId: 'hebrew-david', anchor: { x: 500, y: 953 }, preferredSpaceName: 'Jerusalem' }],
    [6, { unitTypeId: 'egypt-shishak', anchor: { x: 180, y: 1115 }, preferredSpaceName: 'Philistia' }],
    [7, { unitTypeId: 'aram-syria-hazael', anchor: { x: 835, y: 322 }, preferredSpaceName: 'Geshur' }],
    [8, { unitTypeId: 'assyria-sargon', anchor: { x: 985, y: 334 }, preferredSpaceName: 'Argob' }],
    [9, { unitTypeId: 'babylonia-nebuchadnezzar', anchor: { x: 977, y: 1115 }, preferredSpaceName: 'Eastern Desert' }]
  ]);

  const invaderNations = new Set(['Egypt', 'Aram-Syria', 'Assyria', 'Babylonia']);

  const regionLabelAnchors = [
    { name: 'Dan', x: 664, y: 96 },
    { name: 'Phoenicia', x: 550, y: 155 },
        { name: 'Upper Galilee', x: 617, y: 214 },
    { name: 'Lower Galilee', x: 547, y: 391 },
    { name: 'Jezreel', x: 533, y: 470 },
    { name: 'Dor', x: 413, y: 533 },
    { name: 'Joppa', x: 283, y: 838 },
    { name: 'Philistia', x: 180, y: 1115 },
    { name: 'Wilderness', x: 186, y: 1320 },
    { name: 'Samaria', x: 464, y: 741 },
        { name: 'Shechem', x: 609, y: 661 },
    { name: 'Shephela', x: 406, y: 925 },
    { name: 'Bethel', x: 542, y: 806 },
    { name: 'Jerusalem', x: 500, y: 953 },
        { name: 'Bethlehem', x: 493, y: 1036 },
    { name: 'Benjamin', x: 575, y: 990 },
        { name: 'Jericho', x: 615, y: 904 },
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
    { name: 'Edom', x: 760, y: 1480 },
        { name: 'Eastern Desert', x: 977, y: 1115 }
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
    [17, 23],
    [26, 28]
  ];

  const removedSpaceIndices = [5, 35];

  const configuredSpaceCentroids = new Map([
    [29, { x: 1000, y: 130 }]
  ]);

  const UNIT_IMAGE_FILES = [
    'Ammon.png',
    'Amorite.png',
    'Aram-Syria Hazael.png',
    'Aram-Syria.png',
    'Assyria Sargon.png',
    'Assyria.png',
    'Assyrria Shalmaneser.png',
    'Babylonia Nebuchadnezzar.png',
    'Babylonia.png',
    'Canaan.png',
    'Edom.png',
    'Egypt chariot.png',
    'Egypt Necho.png',
    'Egypt Shishak.png',
    'Hebrew Asher.png',
    'Hebrew Benjamin.png',
    'Hebrew Dan.png',
    'Hebrew David.png',
    'Hebrew Ephraim.png',
    'Hebrew Gad.png',
    'Hebrew Issachar.png',
    'Hebrew Joshua.png',
    'Hebrew Judah.png',
    'Hebrew Levi Ark.png',
    'Hebrew Levi tabernacle.png',
    'Hebrew Levi.png',
    'Hebrew Manasseh.png',
    'Hebrew Naphtali.png',
    'Hebrew Priest.png',
    'Hebrew Reuben.png',
    'Hebrew Simeon.png',
    'Hebrew tabernacle.png',
    'Hebrew Zebulun.png',
    'Hebrew.png',
    'Hittite chariot.png',
    'Hittite.png',
    'Israel.png',
    'Judah.png',
    'Moab.png',
    'Philistia chariot.png',
    'Philistia.png',
    'Phoenicia.png',
    'Samaria.png',
    'Temple of Solomon.png'
  ];

  const configuredAdjacentSpacePairs = [
    [1, 2],
    [1, 6],
    [1, 8],
    [1, 9],
    [2, 6],
    [2, 4],
    [4, 29],
    [4, 7],
    [7, 8],
    [6, 8],
    [11, 29],
    [9, 11],
    [9, 10],
    [9, 12],
    [9, 13],
    [11, 15],
    [11, 30],
    [10, 12],
    [10, 14],
    [12, 13],
    [13, 16],
    [13, 18],
    [13, 15],
    [29, 30],
    [15, 30],
    [19, 30],
    [19, 31],
    [19, 26],
    [26, 31],
    [26, 33],
    [32, 33],
    [12, 14],
    [12, 17],
    [12, 16],
    [14, 17],
    [14, 20],
    [16, 17],
    [16, 18],
    [16, 21],
    [21, 22],
    [22, 24],
    [17, 25],
    [20, 25],
    [22, 25],
    [24, 25],
    [20, 27],
    [20, 34],
    [24, 27],
    [24, 32],
    [27, 32],
    [32, 34],
    [26, 32],
    [31, 33],
    [15, 18],
    [15, 19],
    [18, 24],
    [18, 22],
    [27, 34],
    [18, 19],
    [30, 31],
    [17, 22],
    [17, 20],
    [25, 27],
    [11, 13],
    [7, 11],
    [8, 9],
    [8, 11],
    [4, 6],
    [7, 29]
  ];

  const defaultState = {
    zoom: 1,
    scrollLeft: 0,
    scrollTop: 0,
    currentTurn: 1,
    currentPhaseIndex: 0,
    spawnedLeaderTurns: [],
    gameComplete: false,
    unitCounts: {
      ammon: 2,
      amorite: 6,
      canaan: 9,
      hebrew: 26,
      hittite: 5,
      'hittite-chariot': 1,
      moab: 2,
      edom: 2,
      phoenicia: 3
    },
    units: [
      { id: 'ammon-1', unitTypeId: 'ammon', label: 'AMM', x: 954, y: 930, spaceId: '' },
      { id: 'ammon-2', unitTypeId: 'ammon', label: 'AMM', x: 954, y: 930, spaceId: '' },
      { id: 'moab-1', unitTypeId: 'moab', label: 'MOA', x: 775, y: 1265, spaceId: '' },
      { id: 'moab-2', unitTypeId: 'moab', label: 'MOA', x: 775, y: 1265, spaceId: '' },
      { id: 'edom-1', unitTypeId: 'edom', label: 'EDO', x: 760, y: 1480, spaceId: '' },
      { id: 'edom-2', unitTypeId: 'edom', label: 'EDO', x: 760, y: 1480, spaceId: '' },
      { id: 'phoenicia-1', unitTypeId: 'phoenicia', label: 'PHO', x: 550, y: 155, spaceId: '' },
      { id: 'phoenicia-2', unitTypeId: 'phoenicia', label: 'PHO', x: 550, y: 155, spaceId: '' },
      { id: 'phoenicia-3', unitTypeId: 'phoenicia', label: 'PHO', x: 550, y: 155, spaceId: '' },
      ...Array.from({ length: 26 }, (_, index) => ({
        id: `hebrew-${index + 1}`,
        unitTypeId: 'hebrew',
        label: 'HEB',
        x: 802,
        y: 770,
        spaceId: 'space-31'
      })),
      { id: 'amorite-1', unitTypeId: 'amorite', label: 'AMO', x: 547, y: 391, spaceId: 'space-4' },
      { id: 'amorite-2', unitTypeId: 'amorite', label: 'AMO', x: 533, y: 470, spaceId: 'space-7' },
      { id: 'amorite-3', unitTypeId: 'amorite', label: 'AMO', x: 609, y: 661, spaceId: 'space-11' },
      { id: 'amorite-4', unitTypeId: 'amorite', label: 'AMO', x: 609, y: 661, spaceId: 'space-11' },
      { id: 'amorite-5', unitTypeId: 'amorite', label: 'AMO', x: 464, y: 741, spaceId: 'space-15' },
      { id: 'amorite-6', unitTypeId: 'amorite', label: 'AMO', x: 802, y: 770, spaceId: 'space-19' },
      { id: 'hittite-1', unitTypeId: 'hittite', label: 'HIT', x: 617, y: 214, spaceId: 'space-2' },
      { id: 'hittite-2', unitTypeId: 'hittite', label: 'HIT', x: 550, y: 155, spaceId: 'space-6' },
      { id: 'hittite-3', unitTypeId: 'hittite', label: 'HIT', x: 664, y: 96, spaceId: 'space-8' },
      { id: 'hittite-4', unitTypeId: 'hittite', label: 'HIT', x: 533, y: 470, spaceId: 'space-9' },
      { id: 'hittite-5', unitTypeId: 'hittite', label: 'HIT', x: 775, y: 1265, spaceId: 'space-25' },
      { id: 'hittite-chariot-1', unitTypeId: 'hittite-chariot', label: 'HIT', x: 533, y: 470, spaceId: 'space-9' },
      { id: 'canaan-1', unitTypeId: 'canaan', label: 'CAN', x: 547, y: 391, spaceId: 'space-10' },
      { id: 'canaan-2', unitTypeId: 'canaan', label: 'CAN', x: 533, y: 470, spaceId: 'space-12' },
      { id: 'canaan-3', unitTypeId: 'canaan', label: 'CAN', x: 464, y: 741, spaceId: 'space-13' },
      { id: 'canaan-4', unitTypeId: 'canaan', label: 'CAN', x: 542, y: 806, spaceId: 'space-14' },
      { id: 'canaan-5', unitTypeId: 'canaan', label: 'CAN', x: 500, y: 953, spaceId: 'space-16' },
      { id: 'canaan-6', unitTypeId: 'canaan', label: 'CAN', x: 615, y: 904, spaceId: 'space-17' },
      { id: 'canaan-7', unitTypeId: 'canaan', label: 'CAN', x: 575, y: 990, spaceId: 'space-18' },
      { id: 'canaan-8', unitTypeId: 'canaan', label: 'CAN', x: 620, y: 1060, spaceId: 'space-21' },
      { id: 'canaan-9', unitTypeId: 'canaan', label: 'CAN', x: 493, y: 1036, spaceId: 'space-22' }
    ]
  };

  const unitTypes = UNIT_IMAGE_FILES.map((fileName) => parseUnitTypeFromFileName(fileName));
  const unitTypeById = new Map(unitTypes.map((unitType) => [unitType.id, unitType]));

  const detectedSpaces = [];
  let spacesById = new Map();
  let spaceLookupByPixel = null;
  let adjacentSpacePairs = [];
  let adjacentSpaceLookup = new Map();
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
              unitTypeId: deriveUnitTypeId(unit),
              label: deriveUnitLabel(deriveUnitTypeId(unit), unit.label),
              x: sanitizeNumber(unit.x, 0, BASE_WIDTH, BASE_WIDTH / 2),
              y: sanitizeNumber(unit.y, 0, BASE_HEIGHT, BASE_HEIGHT / 2),
              spaceId: typeof unit.spaceId === 'string' ? unit.spaceId : ''
            }))
            .filter((unit) => unit.id)
        : structuredClone(defaultState.units).map((unit) => ({
            ...unit,
            unitTypeId: deriveUnitTypeId(unit),
            label: deriveUnitLabel(deriveUnitTypeId(unit), unit.label)
          }));

      const normalizedUnits = units.length
        ? units
        : structuredClone(defaultState.units).map((unit) => ({
            ...unit,
            unitTypeId: deriveUnitTypeId(unit),
            label: deriveUnitLabel(deriveUnitTypeId(unit), unit.label)
          }));

      const unitCounts = normalizeUnitCounts(parsed.unitCounts, normalizedUnits);
      const currentTurn = sanitizeInteger(parsed.currentTurn, 1, TOTAL_TURNS, defaultState.currentTurn);
      const currentPhaseIndex = sanitizeInteger(
        parsed.currentPhaseIndex,
        0,
        PHASES.length - 1,
        defaultState.currentPhaseIndex
      );
      const spawnedLeaderTurns = Array.isArray(parsed.spawnedLeaderTurns)
        ? Array.from(
            new Set(
              parsed.spawnedLeaderTurns
                .map((value) => sanitizeInteger(value, 1, TOTAL_TURNS, 0))
                .filter((value) => value > 0)
            )
          ).sort((first, second) => first - second)
        : [];

      return {
        zoom,
        scrollLeft: sanitizeNumber(parsed.scrollLeft, 0, BASE_WIDTH * zoom, 0),
        scrollTop: sanitizeNumber(parsed.scrollTop, 0, BASE_HEIGHT * zoom, 0),
        currentTurn,
        currentPhaseIndex,
        spawnedLeaderTurns,
        gameComplete: Boolean(parsed.gameComplete),
        unitCounts,
        units: normalizedUnits
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

  function sanitizeInteger(value, min, max, fallback) {
    return Math.round(sanitizeNumber(value, min, max, fallback));
  }

  function parseUnitTypeFromFileName(fileName) {
    const baseName = fileName.replace(/\.png$/i, '');
    const parts = baseName.split(' ').filter(Boolean);
    const nation = parts[0] || baseName;
    const descriptor = parts.slice(1).join(' ');
    const descriptorLower = descriptor.toLowerCase();
    const isChariot = descriptorLower.endsWith('chariot');
    const classification = isChariot
      ? 'chariot'
      : descriptor
        ? 'leader'
        : 'standard';

    return {
      id: toSlug(baseName),
      fileName,
      imagePath: `Units/${fileName}`,
      displayName: baseName,
      nation,
      descriptor,
      classification,
      isChariot,
      shortLabel: nation.slice(0, 3).toUpperCase() || 'UNT'
    };
  }

  function toSlug(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function deriveUnitTypeId(unit) {
    if (typeof unit.unitTypeId === 'string' && unitTypeById.has(unit.unitTypeId)) {
      return unit.unitTypeId;
    }

    if (typeof unit.id === 'string' && unitTypeById.has(unit.id)) {
      return unit.id;
    }

    return 'hebrew';
  }

  function deriveUnitLabel(unitTypeId, fallbackLabel) {
    if (typeof fallbackLabel === 'string' && fallbackLabel.trim()) {
      return fallbackLabel.slice(0, 4).toUpperCase();
    }

    const unitType = unitTypeById.get(unitTypeId);
    return unitType ? unitType.shortLabel : 'UNT';
  }

  function deriveUnitCountsFromUnits(units) {
    const counts = {};

    units.forEach((unit) => {
      if (!unitTypeById.has(unit.unitTypeId)) {
        return;
      }

      counts[unit.unitTypeId] = (counts[unit.unitTypeId] || 0) + 1;
    });

    return counts;
  }

  function normalizeUnitCounts(counts, units) {
    const normalized = {};

    if (counts && typeof counts === 'object') {
      Object.entries(counts).forEach(([unitTypeId, rawCount]) => {
        if (!unitTypeById.has(unitTypeId)) {
          return;
        }

        const parsed = Number.parseInt(String(rawCount), 10);
        normalized[unitTypeId] = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      });
    }

    const derived = deriveUnitCountsFromUnits(units);
    Object.entries(derived).forEach(([unitTypeId, count]) => {
      normalized[unitTypeId] = Math.max(normalized[unitTypeId] || 0, count);
    });

    return normalized;
  }

  function adjustUnitTypeCount(unitTypeId, delta) {
    if (!unitTypeById.has(unitTypeId)) {
      return 0;
    }

    const current = state.unitCounts[unitTypeId] || 0;
    const next = Math.max(0, current + delta);
    state.unitCounts[unitTypeId] = next;
    return next;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getCurrentPhase() {
    return PHASES[state.currentPhaseIndex] || PHASES[0];
  }

  function canInteractWithUnit(unit) {
    if (state.gameComplete) {
      return false;
    }

    return true;
  }

  function isLeaderUnitType(unitType) {
    return Boolean(unitType && unitType.classification === 'leader');
  }

  function isInvaderUnitType(unitType) {
    return Boolean(unitType && invaderNations.has(unitType.nation));
  }

  function syncUnitCounts() {
    state.unitCounts = deriveUnitCountsFromUnits(state.units);
  }

  function updateTurnPhaseUi() {
    const phase = getCurrentPhase();
    if (currentTurnLabel) {
      currentTurnLabel.textContent = `Turn ${state.currentTurn} of ${TOTAL_TURNS}`;
    }

    if (currentPhaseLabel) {
      currentPhaseLabel.textContent = phase.label;
    }

    if (phaseHelpLabel) {
      phaseHelpLabel.textContent = state.gameComplete
        ? 'The ninth turn is complete.'
        : phase.helpText;
    }

    if (nextPhaseButton) {
      nextPhaseButton.disabled = state.gameComplete;
      nextPhaseButton.textContent = state.gameComplete
        ? 'Game Complete'
        : state.currentTurn === TOTAL_TURNS && phase.id === 'end'
          ? 'Finish Game'
          : phase.nextLabel;
    }
  }

  function findSpaceByName(name) {
    if (!name) {
      return null;
    }

    return detectedSpaces.find((space) => space.name === name) || null;
  }

  function getUnitsInSpace(spaceId, excludedUnitId = '') {
    return state.units.filter((unit) => unit.spaceId === spaceId && unit.id !== excludedUnitId);
  }

  function getEligibleLeaderEntrySpaces(unitType, excludedUnitId = '') {
    if (!isLeaderUnitType(unitType)) {
      return [];
    }

    return detectedSpaces.filter((space) => {
      const unitsInSpace = getUnitsInSpace(space.id, excludedUnitId);
      return unitsInSpace.some((unit) => {
        const occupyingType = unitTypeById.get(unit.unitTypeId);
        return occupyingType && occupyingType.nation === unitType.nation;
      });
    });
  }

  function createUnitFromType(unitTypeId, anchor, preferredSpaceName) {
    const unitType = unitTypeById.get(unitTypeId);
    if (!unitType) {
      return null;
    }

    const unit = {
      id: `${unitTypeId}-${Date.now()}`,
      unitTypeId,
      label: deriveUnitLabel(unitTypeId),
      x: toBoardX(anchor.x),
      y: toBoardY(anchor.y),
      spaceId: ''
    };

    const eligibleLeaderSpaces = getEligibleLeaderEntrySpaces(unitType, unit.id);
    if (isLeaderUnitType(unitType)) {
      if (eligibleLeaderSpaces.length) {
        const preferredSpace = findSpaceByName(preferredSpaceName);
        const targetSpace = eligibleLeaderSpaces.find((space) => space.id === preferredSpace?.id) || eligibleLeaderSpaces[0];
        snapUnitToSpace(unit, targetSpace);
      }
    } else {
      const preferredSpace = findSpaceByName(preferredSpaceName);
      if (preferredSpace) {
        snapUnitToSpace(unit, preferredSpace);
      }
    }

    return unit;
  }

  function ensureLeaderForCurrentTurn() {
    if (state.gameComplete || getCurrentPhase().id === 'end') {
      return;
    }

    const scheduledLeader = leaderSchedule.get(state.currentTurn);
    if (!scheduledLeader || state.spawnedLeaderTurns.includes(state.currentTurn)) {
      return;
    }

    const unit = createUnitFromType(
      scheduledLeader.unitTypeId,
      scheduledLeader.anchor,
      scheduledLeader.preferredSpaceName
    );

    if (!unit) {
      return;
    }

    state.units.push(unit);
    state.spawnedLeaderTurns = [...state.spawnedLeaderTurns, state.currentTurn].sort((first, second) => first - second);
    syncUnitCounts();
  }

  function applyEndPhaseCleanup() {
    const filteredUnits = state.units.filter((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      return !isLeaderUnitType(unitType) && !isInvaderUnitType(unitType);
    });

    if (filteredUnits.length === state.units.length) {
      return;
    }

    state.units = filteredUnits;
    syncUnitCounts();
  }

  function syncTurnState() {
    if (getCurrentPhase().id === 'end') {
      applyEndPhaseCleanup();
    } else {
      ensureLeaderForCurrentTurn();
    }
  }

  function advanceTurnPhase() {
    if (state.gameComplete) {
      return;
    }

    const phase = getCurrentPhase();

    if (phase.id === 'growth') {
      state.currentPhaseIndex = 1;
    } else if (phase.id === 'action') {
      state.currentPhaseIndex = 2;
      applyEndPhaseCleanup();
    } else if (state.currentTurn >= TOTAL_TURNS) {
      state.gameComplete = true;
    } else {
      state.currentTurn += 1;
      state.currentPhaseIndex = 0;
      ensureLeaderForCurrentTurn();
    }

    renderUnits();
    updateTurnPhaseUi();
    saveState();
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
    const canvasWidth = Math.round(BASE_WIDTH * state.zoom);
    const canvasHeight = Math.round(BASE_HEIGHT * state.zoom);
    mapCanvas.style.width = `${canvasWidth}px`;
    mapCanvas.style.height = `${canvasHeight}px`;
    mapCanvas.style.setProperty('--map-zoom', String(state.zoom));
    if (adjacencyLayer) {
      adjacencyLayer.setAttribute('width', String(canvasWidth));
      adjacencyLayer.setAttribute('height', String(canvasHeight));
      adjacencyLayer.setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
    }
    zoomRange.value = String(state.zoom);
    zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
    renderAdjacencyLines();
    renderSpaceMarkers(detectedSpaces);
  }

  function normalizeConfiguredAdjacentSpacePairs(pairs) {
    const pairKeys = new Set();

    pairs.forEach(([first, second]) => {
      const low = Math.min(first, second);
      const high = Math.max(first, second);
      pairKeys.add(`${low}:${high}`);
    });

    return Array.from(pairKeys)
      .map((key) => {
        const [first, second] = key.split(':').map((value) => Number.parseInt(value, 10));
        return [first, second];
      })
      .sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  }

  function rebuildAdjacentSpaceLookup() {
    adjacentSpaceLookup = new Map();

    adjacentSpacePairs.forEach(([first, second]) => {
      if (!adjacentSpaceLookup.has(first)) {
        adjacentSpaceLookup.set(first, new Set());
      }
      if (!adjacentSpaceLookup.has(second)) {
        adjacentSpaceLookup.set(second, new Set());
      }

      adjacentSpaceLookup.get(first).add(second);
      adjacentSpaceLookup.get(second).add(first);
    });
  }

  function canUnitMoveToSpace(unit, targetSpace) {
    if (!targetSpace) {
      return false;
    }

    const unitType = unitTypeById.get(unit.unitTypeId);
    if (isLeaderUnitType(unitType) && getCurrentPhase().id === 'growth') {
      return getEligibleLeaderEntrySpaces(unitType, unit.id).some((space) => space.id === targetSpace.id);
    }

    if (!unit.spaceId || !spacesById.has(unit.spaceId)) {
      return true;
    }

    if (unit.spaceId === targetSpace.id) {
      return true;
    }

    const currentSpace = spacesById.get(unit.spaceId);
    const allowedNeighbors = adjacentSpaceLookup.get(currentSpace.index);
    return Boolean(allowedNeighbors && allowedNeighbors.has(targetSpace.index));
  }

  function renderAdjacencyLines() {
    if (!adjacencyLayer) {
      return;
    }

    adjacencyLayer.innerHTML = '';
    if (!adjacentSpacePairs.length) {
      return;
    }

    const strokeWidth = 1;
    const dash = 6;
    const gap = 4;
    const svgNamespace = 'http://www.w3.org/2000/svg';

    adjacentSpacePairs.forEach(([firstIndex, secondIndex]) => {
      const first = spacesById.get(`space-${firstIndex}`);
      const second = spacesById.get(`space-${secondIndex}`);
      if (!first || !second) {
        return;
      }

      const line = document.createElementNS(svgNamespace, 'line');
      line.classList.add('adjacency-line');
      line.setAttribute('x1', String(Math.round(toBoardX(first.centroidX) * state.zoom)));
      line.setAttribute('y1', String(Math.round(toBoardY(first.centroidY) * state.zoom)));
      line.setAttribute('x2', String(Math.round(toBoardX(second.centroidX) * state.zoom)));
      line.setAttribute('y2', String(Math.round(toBoardY(second.centroidY) * state.zoom)));
      line.setAttribute('stroke-width', String(strokeWidth));
      line.setAttribute('stroke-dasharray', `${dash} ${gap}`);
      adjacencyLayer.appendChild(line);
    });
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

  function applyConfiguredSpaceCentroids(spaces) {
    spaces.forEach((space) => {
      const override = configuredSpaceCentroids.get(space.index);
      if (!override) {
        return;
      }

      space.centroidX = override.x;
      space.centroidY = override.y;
      space.minX = Math.min(space.minX, override.x);
      space.minY = Math.min(space.minY, override.y);
      space.maxX = Math.max(space.maxX, override.x);
      space.maxY = Math.max(space.maxY, override.y);
    });
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
      button.dataset.unitId = unit.id;
      const unitLocked = !canInteractWithUnit(unit);
      button.classList.toggle('unit-locked', unitLocked);

      const unitType = unitTypeById.get(unit.unitTypeId);
      button.setAttribute('aria-label', unitType ? unitType.displayName : unit.label);

      if (unitType) {
        const image = document.createElement('img');
        image.className = 'unit-image';
        image.src = unitType.imagePath;
        image.alt = unitType.displayName;
        image.draggable = false;
        image.addEventListener('error', () => {
          button.classList.remove('has-image');
          image.remove();
          button.textContent = unit.label;
        });
        button.classList.add('has-image');
        button.appendChild(image);
      } else {
        button.textContent = unit.label;
      }

      const hasSpace = unit.spaceId && spacesById.has(unit.spaceId);
      const stackIndex = hasSpace ? stackCounters.get(unit.spaceId) || 0 : 0;
      if (hasSpace) {
        stackCounters.set(unit.spaceId, stackIndex + 1);
      }

      positionUnit(button, unit, stackIndex);

      if (hasSpace) {
        const space = spacesById.get(unit.spaceId);
        const unitDisplayName = unitType ? unitType.displayName : unit.label;
        button.title = `${unitDisplayName} in ${space.name}`;
      }

      if (unitLocked) {
        button.title = button.title
          ? `${button.title} — movement disabled after game completion`
          : 'Movement disabled after game completion';
      } else if (unitType && isLeaderUnitType(unitType) && getCurrentPhase().id === 'growth') {
        button.title = button.title
          ? `${button.title} — place on any space containing another ${unitType.nation} unit`
          : `Place on any space containing another ${unitType.nation} unit`;
      }

      button.addEventListener('pointerdown', (event) => {
        if (!canInteractWithUnit(unit)) {
          return;
        }

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
        if (targetSpace && canUnitMoveToSpace(unit, targetSpace)) {
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
    applyConfiguredSpaceCentroids(detectedSpaces);
    assignSpaceNames(detectedSpaces);

    spaceLookupByPixel = extraction.spaceIdMap;
    rebuildSpaceLookups();
    adjacentSpacePairs = normalizeConfiguredAdjacentSpacePairs(configuredAdjacentSpacePairs);
    rebuildAdjacentSpaceLookup();
    snapAllUnitsToSpaces();
    syncTurnState();
    renderAdjacencyLines();
    renderSpaceMarkers(detectedSpaces);
    renderUnits();
    updateTurnPhaseUi();
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

  if (resetGameButton) {
    resetGameButton.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
  }

  if (nextPhaseButton) {
    nextPhaseButton.addEventListener('click', advanceTurnPhase);
  }

  syncMapSize();
  updateTurnPhaseUi();
  renderUnits();
  mapViewport.scrollLeft = state.scrollLeft;
  mapViewport.scrollTop = state.scrollTop;

  analyzeMapSpaces().catch(() => {
    if (spaceCount) {
      spaceCount.textContent = 'Spaces: unavailable';
    }
  });
})();
