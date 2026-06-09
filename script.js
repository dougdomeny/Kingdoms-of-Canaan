(() => {
  const STORAGE_KEY = 'koc.gameState.v1';
  const BASE_WIDTH = 1035;
  const BASE_HEIGHT = 1590;
  const UNIT_SIZE_PX = 72;
  const STACK_VERTICAL_GAP_PX = 3;
  const DIE_SIZE_PX = 48;
  const DIE_LEFT_MARGIN_PX = 2;
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
      helpText: 'Leaders and invaders enter. Growth resolves now unless a leader is present, then it resolves in End Phase.',
      nextLabel: 'Advance to Action Phase'
    },
    {
      id: 'action',
      label: 'Action Phase',
      helpText: 'Move units in any order and resolve battles when entering enemy regions.',
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
    [8, { unitTypeId: 'assyrria-shalmaneser', anchor: { x: 985, y: 334 }, preferredSpaceName: 'Argob' }],
    [9, { unitTypeId: 'babylonia-nebuchadnezzar', anchor: { x: 977, y: 1115 }, preferredSpaceName: 'Eastern Desert' }]
  ]);

  const invadingReinforcementsByTurn = new Map([
    [6, [{ unitTypeId: 'egypt-chariot', count: 4 }]],
    [7, [{ unitTypeId: 'aram-syria', count: 4 }]],
    [8, [{ unitTypeId: 'assyria', count: 8 }]],
    [9, [{ unitTypeId: 'babylonia', count: 8 }]]
  ]);

  const invaderNations = new Set(['Egypt', 'Aram-Syria', 'Assyria', 'Assyrria', 'Babylonia']);
  const REGION_RULES_BY_NAME = new Map([
    ['Dan', { growth: 1, terrain: 'standard' }],
    ['Phoenicia', { growth: 2, terrain: 'plains' }],
    ['Upper Galilee', { growth: 1, terrain: 'hills' }],
    ['Lower Galilee', { growth: 2, terrain: 'standard' }],
    ['Jezreel', { growth: 3, terrain: 'plains' }],
    ['Dor', { growth: 2, terrain: 'standard' }],
    ['Joppa', { growth: 3, terrain: 'plains' }],
    ['Philistia', { growth: 3, terrain: 'plains' }],
    ['Wilderness', { growth: 0, terrain: 'desert' }],
    ['Samaria', { growth: 1, terrain: 'standard' }],
    ['Shechem', { growth: 1, terrain: 'standard' }],
    ['Shephela', { growth: 2, terrain: 'standard' }],
    ['Bethel', { growth: 1, terrain: 'hills' }],
    ['Jerusalem', { growth: 1, terrain: 'city' }],
    ['Bethlehem', { growth: 1, terrain: 'hills' }],
    ['Benjamin', { growth: 1, terrain: 'hills' }],
    ['Jericho', { growth: 1, terrain: 'plains' }],
    ['Jeshimon', { growth: 0, terrain: 'hills' }],
    ['Hebron', { growth: 1, terrain: 'standard' }],
    ['Negev', { growth: 0, terrain: 'desert' }],
    ['Bashan', { growth: 1, terrain: 'standard' }],
    ['Geshur', { growth: 1, terrain: 'standard' }],
    ['Argob', { growth: 1, terrain: 'standard' }],
    ['Gilead', { growth: 2, terrain: 'standard' }],
    ['Jazer', { growth: 1, terrain: 'hills' }],
    ['Ammon', { growth: 1, terrain: 'standard' }],
    ['Mishor', { growth: 1, terrain: 'standard' }],
    ['Moab', { growth: 1, terrain: 'standard' }],
    ['Valley of Siddim', { growth: 0, terrain: 'desert' }],
    ['Edom', { growth: 1, terrain: 'standard' }],
    ['Eastern Desert', { growth: 0, terrain: 'desert' }]
  ]);
  const UNIT_GROWTH_THRESHOLD = 3;
  const CHARIOT_GROWTH_THRESHOLD = 5;
  const nationEntrySpaceByName = new Map([
    ['Egypt', 34],
    ['Aram-Syria', 29],
    ['Assyria', 29],
    ['Assyrria', 29],
    ['Babylonia', 29]
  ]);

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
    [18, { x: 635, y: 870 }],
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
    spawnedReinforcementTurns: [],
    pendingEntryCombatUnitIds: [],
    pendingCombats: [],
    processedGrowthTurns: [],
    growthPointsByNation: {},
    vassalByNation: {},
    retreatedUnitIds: [],
    activatedUnitIds: [],
    gameComplete: false,
    unitCounts: {
      ammon: 2,
      amorite: 6,
      canaan: 9,
      'egypt-chariot': 1,
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
      { id: 'egypt-chariot-1', unitTypeId: 'egypt-chariot', label: 'EGY', x: 384, y: 1310, spaceId: 'space-20' },
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
  const combatDisplayBySpaceId = new Map();

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
      const spawnedReinforcementTurns = Array.isArray(parsed.spawnedReinforcementTurns)
        ? Array.from(
            new Set(
              parsed.spawnedReinforcementTurns
                .map((value) => sanitizeInteger(value, 1, TOTAL_TURNS, 0))
                .filter((value) => value > 0)
            )
          ).sort((first, second) => first - second)
        : [];
      const pendingEntryCombatUnitIds = Array.isArray(parsed.pendingEntryCombatUnitIds)
        ? Array.from(
            new Set(
              parsed.pendingEntryCombatUnitIds
                .map((value) => String(value || '').trim())
                .filter(Boolean)
            )
          )
        : [];
      const pendingCombats = Array.isArray(parsed.pendingCombats)
        ? parsed.pendingCombats
            .map((combat) => normalizePendingCombat(combat))
            .filter(Boolean)
        : [];
      const processedGrowthTurns = Array.isArray(parsed.processedGrowthTurns)
        ? Array.from(
            new Set(
              parsed.processedGrowthTurns
                .map((value) => sanitizeInteger(value, 1, TOTAL_TURNS, 0))
                .filter((value) => value > 0)
            )
          ).sort((first, second) => first - second)
        : [];
      const growthPointsByNation = normalizeGrowthPointsByNation(parsed.growthPointsByNation);
      const vassalByNation = normalizeVassalByNation(parsed.vassalByNation);
      const retreatedUnitIds = normalizeUniqueStringList(parsed.retreatedUnitIds);
      const activatedUnitIds = normalizeUniqueStringList(parsed.activatedUnitIds);

      return {
        zoom,
        scrollLeft: sanitizeNumber(parsed.scrollLeft, 0, BASE_WIDTH * zoom, 0),
        scrollTop: sanitizeNumber(parsed.scrollTop, 0, BASE_HEIGHT * zoom, 0),
        currentTurn,
        currentPhaseIndex,
        spawnedLeaderTurns,
        spawnedReinforcementTurns,
        pendingEntryCombatUnitIds,
        pendingCombats,
        processedGrowthTurns,
        growthPointsByNation,
        vassalByNation,
        retreatedUnitIds,
        activatedUnitIds,
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

  function normalizePendingCombat(value) {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const spaceId = typeof value.spaceId === 'string' ? value.spaceId : '';
    const attackerNation = typeof value.attackerNation === 'string' ? value.attackerNation : '';
    if (!spaceId || !attackerNation) {
      return null;
    }

    const attackerEntries = Array.isArray(value.attackerEntries)
      ? value.attackerEntries
          .map((entry) => {
            if (!entry || typeof entry !== 'object') {
              return null;
            }

            const unitId = typeof entry.unitId === 'string' ? entry.unitId : '';
            const originSpaceId = typeof entry.originSpaceId === 'string' ? entry.originSpaceId : '';
            if (!unitId || !originSpaceId) {
              return null;
            }

            return { unitId, originSpaceId };
          })
          .filter(Boolean)
      : [];

    return {
      id: typeof value.id === 'string' && value.id ? value.id : `${spaceId}|${attackerNation}`,
      spaceId,
      attackerNation,
      attackerEntries,
      roundsResolved: sanitizeInteger(value.roundsResolved, 0, 999, 0)
    };
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

  function normalizeUniqueStringList(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .map((entry) => String(entry || '').trim())
          .filter(Boolean)
      )
    );
  }

  function normalizeGrowthPointsByNation(value) {
    const normalized = {};
    if (!value || typeof value !== 'object') {
      return normalized;
    }

    Object.entries(value).forEach(([nationName, points]) => {
      if (!nationName || typeof points !== 'object' || !points) {
        return;
      }

      normalized[nationName] = {
        unit: Math.max(0, sanitizeInteger(points.unit, 0, 9999, 0)),
        chariot: Math.max(0, sanitizeInteger(points.chariot, 0, 9999, 0))
      };
    });

    return normalized;
  }

  function normalizeVassalByNation(value) {
    const normalized = {};
    if (!value || typeof value !== 'object') {
      return normalized;
    }

    Object.entries(value).forEach(([nationName, overlordNation]) => {
      if (!nationName || !overlordNation) {
        return;
      }

      const normalizedNation = String(nationName).trim();
      const normalizedOverlord = String(overlordNation).trim();
      if (!normalizedNation || !normalizedOverlord || normalizedNation === normalizedOverlord) {
        return;
      }

      normalized[normalizedNation] = normalizedOverlord;
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

    const phase = getCurrentPhase();
    if (phase.id === 'end') {
      return false;
    }

    const unitType = unitTypeById.get(unit.unitTypeId);
    if (phase.id === 'growth' && !isLeaderUnitType(unitType)) {
      return false;
    }

    if (phase.id === 'action' && state.retreatedUnitIds.includes(unit.id)) {
      return false;
    }

    const unitInPendingCombat = state.pendingCombats.some((combat) =>
      combat.attackerEntries.some((entry) => entry.unitId === unit.id)
    );
    if (unitInPendingCombat) {
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

  function getUnitNation(unit) {
    if (!unit) {
      return '';
    }

    const unitType = unitTypeById.get(unit.unitTypeId);
    return unitType ? unitType.nation : '';
  }

  function getSpaceBaseName(space) {
    if (!space || !space.name) {
      return '';
    }

    return String(space.name).replace(/\s+\d+$/, '');
  }

  function getSpaceTerrain(space) {
    const baseName = getSpaceBaseName(space);
    const regionRules = REGION_RULES_BY_NAME.get(baseName);
    return regionRules ? regionRules.terrain : 'standard';
  }

  function isHillSpace(space) {
    return getSpaceTerrain(space) === 'hills';
  }

  function getSpaceGrowthValue(space) {
    if (!space) {
      return 0;
    }

    const baseName = getSpaceBaseName(space);
    const regionRules = REGION_RULES_BY_NAME.get(baseName);
    if (!regionRules) {
      return 1;
    }

    return Math.max(0, Math.min(3, sanitizeInteger(regionRules.growth, 0, 3, 1)));
  }

  function getSpaceTerrainCode(space) {
    const terrain = getSpaceTerrain(space);
    if (terrain === 'plains') {
      return 'P';
    }

    if (terrain === 'hills') {
      return 'H';
    }

    return '';
  }

  function getSpaceMarkerSuffix(space) {
    const growth = getSpaceGrowthValue(space);
    const terrainCode = getSpaceTerrainCode(space);
    return terrainCode ? `${terrainCode}${growth}` : String(growth);
  }

  function getNationUnitTypeForGrowth(nationName, classification) {
    return unitTypes.find((unitType) => {
      if (unitType.nation !== nationName) {
        return false;
      }

      if (classification === 'chariot') {
        return unitType.classification === 'chariot';
      }

      return unitType.classification === 'standard';
    }) || null;
  }

  function getOverlordNation(nationName) {
    let current = nationName;
    const visited = new Set();

    while (current && state.vassalByNation[current] && !visited.has(current)) {
      visited.add(current);
      current = state.vassalByNation[current];
    }

    return current || nationName;
  }

  function getControlledSpacesByNation() {
    const groupedBySpace = new Map();

    state.units.forEach((unit) => {
      if (!unit.spaceId) {
        return;
      }

      const nation = getUnitNation(unit);
      if (!nation) {
        return;
      }

      if (!groupedBySpace.has(unit.spaceId)) {
        groupedBySpace.set(unit.spaceId, new Set());
      }

      groupedBySpace.get(unit.spaceId).add(nation);
    });

    const controlled = new Map();
    groupedBySpace.forEach((nations, spaceId) => {
      if (nations.size !== 1) {
        return;
      }

      const nation = Array.from(nations)[0];
      if (!controlled.has(nation)) {
        controlled.set(nation, []);
      }

      controlled.get(nation).push(spaceId);
    });

    controlled.forEach((spaceIds) => {
      spaceIds.sort((first, second) => {
        const firstIndex = spacesById.get(first)?.index || 0;
        const secondIndex = spacesById.get(second)?.index || 0;
        return firstIndex - secondIndex;
      });
    });

    return controlled;
  }

  function getLandPointsByNation() {
    const controlledSpaces = getControlledSpacesByNation();
    const landPoints = {};

    controlledSpaces.forEach((spaceIds, nationName) => {
      const overlordNation = getOverlordNation(nationName);
      const growthPoints = spaceIds.reduce((sum, spaceId) => {
        const space = spacesById.get(spaceId);
        return sum + getSpaceGrowthValue(space);
      }, 0);
      landPoints[overlordNation] = (landPoints[overlordNation] || 0) + growthPoints;
    });

    return landPoints;
  }

  function getEligibleGrowthPlacementSpaces(nationName, options = {}) {
    const { requireNonHill = false } = options;
    const controlledSpaces = getControlledSpacesByNation().get(nationName) || [];
    const preferredSpaces = controlledSpaces
      .map((spaceId) => spacesById.get(spaceId))
      .filter(Boolean)
      .filter((space) => (requireNonHill ? !isHillSpace(space) : true));

    if (preferredSpaces.length) {
      return preferredSpaces;
    }

    const fallbackSpaces = state.units
      .filter((unit) => getUnitNation(unit) === nationName)
      .map((unit) => spacesById.get(unit.spaceId))
      .filter(Boolean)
      .filter((space) => (requireNonHill ? !isHillSpace(space) : true));

    const deduped = [];
    const ids = new Set();
    fallbackSpaces.forEach((space) => {
      if (ids.has(space.id)) {
        return;
      }

      ids.add(space.id);
      deduped.push(space);
    });

    return deduped.sort((first, second) => first.index - second.index);
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

  function findSpaceByIndex(index) {
    return spacesById.get(`space-${index}`) || null;
  }

  function createUniqueUnitId(unitTypeId) {
    let candidate = '';
    do {
      candidate = `${unitTypeId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    } while (state.units.some((unit) => unit.id === candidate));
    return candidate;
  }

  function getUnitsInSpace(spaceId, excludedUnitId = '') {
    return state.units.filter((unit) => unit.spaceId === spaceId && unit.id !== excludedUnitId);
  }

  function getNationsInSpace(spaceId) {
    const nations = new Set();
    getUnitsInSpace(spaceId).forEach((unit) => {
      const nation = getUnitNation(unit);
      if (nation) {
        nations.add(nation);
      }
    });
    return nations;
  }

  function getDefenderNationName(attackerNation, defenderUnits) {
    const nationCounts = new Map();
    defenderUnits.forEach((unit) => {
      const nation = getUnitNation(unit);
      if (!nation || nation === attackerNation) {
        return;
      }

      nationCounts.set(nation, (nationCounts.get(nation) || 0) + 1);
    });

    if (!nationCounts.size) {
      return 'Defender';
    }

    let selected = '';
    let selectedCount = -1;
    nationCounts.forEach((count, nation) => {
      if (count > selectedCount) {
        selected = nation;
        selectedCount = count;
      }
    });

    return selected || 'Defender';
  }

  function getDiePipIndices(value) {
    const center = 4;
    const topLeft = 0;
    const topRight = 2;
    const middleLeft = 3;
    const middleRight = 5;
    const bottomLeft = 6;
    const bottomRight = 8;

    const pipMap = {
      1: [center],
      2: [topLeft, bottomRight],
      3: [topLeft, center, bottomRight],
      4: [topLeft, topRight, bottomLeft, bottomRight],
      5: [topLeft, topRight, center, bottomLeft, bottomRight],
      6: [topLeft, topRight, middleLeft, middleRight, bottomLeft, bottomRight]
    };

    return pipMap[value] || [];
  }

  function createCombatDieElement(value, role) {
    const die = document.createElement('div');
    die.className = `combat-die ${role}`;
    die.title = `Die ${value}`;

    const dieSizePx = Math.round(DIE_SIZE_PX * state.zoom);
    die.style.width = `${dieSizePx}px`;
    die.style.height = `${dieSizePx}px`;

    const activePips = new Set(getDiePipIndices(value));
    const pipColor = role === 'attacker' ? '#ffffff' : '#444444';
    const pipSizePx = Math.max(3, Math.round(dieSizePx * 0.18));
    for (let i = 0; i < 9; i += 1) {
      const pip = document.createElement('span');
      pip.className = 'pip';
      pip.style.width = `${pipSizePx}px`;
      pip.style.height = `${pipSizePx}px`;
      pip.style.backgroundColor = pipColor;
      if (activePips.has(i)) {
        pip.classList.add('visible');
      }
      die.appendChild(pip);
    }

    return die;
  }

  function nationsAreSubmittedTogether(firstNation, secondNation) {
    if (!firstNation || !secondNation || firstNation === secondNation) {
      return false;
    }

    return state.vassalByNation[firstNation] === secondNation || state.vassalByNation[secondNation] === firstNation;
  }

  function isSpaceContestable(spaceId) {
    const nations = Array.from(getNationsInSpace(spaceId));
    if (nations.length < 2) {
      return false;
    }

    for (let i = 0; i < nations.length; i += 1) {
      for (let j = i + 1; j < nations.length; j += 1) {
        if (!nationsAreSubmittedTogether(nations[i], nations[j])) {
          return true;
        }
      }
    }

    return false;
  }

  function getPendingCombatForSpace(spaceId) {
    return state.pendingCombats.find((combat) => combat.spaceId === spaceId) || null;
  }

  function removePendingCombat(combatId) {
    state.pendingCombats = state.pendingCombats.filter((combat) => combat.id !== combatId);
  }

  function ensurePendingCombat(spaceId, attackerNation, attackerEntry) {
    if (!spaceId || !attackerNation) {
      return null;
    }

    let pendingCombat = state.pendingCombats.find(
      (combat) => combat.spaceId === spaceId && combat.attackerNation === attackerNation
    );

    if (!pendingCombat) {
      pendingCombat = {
        id: `${spaceId}|${attackerNation}|${Date.now()}`,
        spaceId,
        attackerNation,
        attackerEntries: [],
        roundsResolved: 0
      };
      state.pendingCombats.push(pendingCombat);
    }

    if (attackerEntry && attackerEntry.unitId && attackerEntry.originSpaceId) {
      const exists = pendingCombat.attackerEntries.some((entry) => entry.unitId === attackerEntry.unitId);
      if (!exists) {
        pendingCombat.attackerEntries.push({
          unitId: attackerEntry.unitId,
          originSpaceId: attackerEntry.originSpaceId
        });
      }
    }

    return pendingCombat;
  }

  function cleanPendingCombats() {
    state.pendingCombats = state.pendingCombats
      .map((combat) => {
        const filteredEntries = combat.attackerEntries.filter((entry) =>
          state.units.some((unit) => unit.id === entry.unitId && unit.spaceId === combat.spaceId)
        );

        return {
          ...combat,
          attackerEntries: filteredEntries
        };
      })
      .filter((combat) => {
        const attackerPresent = getUnitsInSpace(combat.spaceId).some((unit) => getUnitNation(unit) === combat.attackerNation);
        const defenderPresent = getUnitsInSpace(combat.spaceId).some((unit) => {
          const nation = getUnitNation(unit);
          return nation && nation !== combat.attackerNation;
        });
        return attackerPresent && defenderPresent;
      });

  }

  function getUnitCountByNation(nationName) {
    return state.units.reduce((count, unit) => count + (getUnitNation(unit) === nationName ? 1 : 0), 0);
  }

  function getControlledRegionCountByNation(nationName) {
    const controlledSpaces = getControlledSpacesByNation();
    return (controlledSpaces.get(nationName) || []).length;
  }

  function evaluateVassalBreakFree() {
    const controlledSpaces = getControlledSpacesByNation();

    Object.entries(state.vassalByNation).forEach(([vassalNation, overlordNation]) => {
      const vassalControlledSpaces = controlledSpaces.get(vassalNation) || [];
      if (vassalControlledSpaces.length < 2) {
        return;
      }

      const overlordPresent = state.units.some(
        (unit) => getUnitNation(unit) === overlordNation && vassalControlledSpaces.includes(unit.spaceId)
      );

      if (!overlordPresent) {
        delete state.vassalByNation[vassalNation];
      }
    });
  }

  function canDefenderSubmit(defenderNation, attackerNation) {
    if (!defenderNation || !attackerNation || defenderNation === attackerNation) {
      return false;
    }

    if (defenderNation === 'Canaan' && attackerNation === 'Hebrew') {
      return false;
    }

    const attackerUnits = getUnitCountByNation(attackerNation);
    const defenderUnits = getUnitCountByNation(defenderNation);
    if (!defenderUnits || attackerUnits < defenderUnits * 3) {
      return false;
    }

    return getControlledRegionCountByNation(defenderNation) <= 2;
  }

  function applySubmission(defenderNation, attackerNation) {
    state.vassalByNation[defenderNation] = attackerNation;
  }

  function clampCombatDie(value) {
    return Math.max(1, Math.min(6, value));
  }

  function getTerrainCombatModifier(unitType, space) {
    if (!unitType || unitType.classification !== 'chariot') {
      return 0;
    }

    const terrain = getSpaceTerrain(space);
    if (terrain === 'plains') {
      return 1;
    }

    if (terrain === 'hills') {
      return -1;
    }

    return 0;
  }

  function buildCombatDice(units, space) {
    const dice = units.map((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      const baseRoll = Math.floor(Math.random() * 6) + 1;
      return {
        unitId: unit.id,
        value: clampCombatDie(baseRoll + getTerrainCombatModifier(unitType, space))
      };
    });

    const hasLeader = units.some((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      return isLeaderUnitType(unitType);
    });

    if (hasLeader && dice.length) {
      let highestIndex = 0;
      for (let i = 1; i < dice.length; i += 1) {
        if (dice[i].value > dice[highestIndex].value) {
          highestIndex = i;
        }
      }
      dice[highestIndex].value = clampCombatDie(dice[highestIndex].value + 1);
    }

    return dice.sort((first, second) => second.value - first.value);
  }

  function resolveCombatDiceMatchups(attackerDice, defenderDice) {
    const comparisons = Math.min(attackerDice.length, defenderDice.length);
    let attackerLosses = 0;
    let defenderLosses = 0;

    for (let i = 0; i < comparisons; i += 1) {
      if (attackerDice[i].value > defenderDice[i].value) {
        defenderLosses += 1;
      } else {
        attackerLosses += 1;
      }
    }

    return { attackerLosses, defenderLosses };
  }

  function chooseCasualtyUnitIds(units, lossCount, sideLabel) {
    if (!lossCount || !units.length) {
      return [];
    }

    const available = [...units];
    const selected = [];

    for (let i = 0; i < lossCount && available.length; i += 1) {
      const optionsText = available
        .map((unit, index) => {
          const unitType = unitTypeById.get(unit.unitTypeId);
          const name = unitType ? unitType.displayName : unit.label;
          return `${index + 1}: ${name}`;
        })
        .join('\n');

      const choice = window.prompt(
        `${sideLabel} remove ${i + 1} of ${lossCount}. Enter option number:\n${optionsText}`,
        '1'
      );
      const parsed = Number.parseInt(String(choice || '1'), 10);
      const selectedIndex = Number.isFinite(parsed) ? parsed - 1 : 0;
      const casualty = available[selectedIndex] || available[0];
      selected.push(casualty.id);
      const casualtyIndex = available.findIndex((unit) => unit.id === casualty.id);
      if (casualtyIndex >= 0) {
        available.splice(casualtyIndex, 1);
      }
    }

    return selected;
  }

  function removeUnitsById(unitIds) {
    if (!unitIds.length) {
      return;
    }

    const removed = new Set(unitIds);
    state.units = state.units.filter((unit) => !removed.has(unit.id));
    state.retreatedUnitIds = state.retreatedUnitIds.filter((unitId) => !removed.has(unitId));
    state.activatedUnitIds = state.activatedUnitIds.filter((unitId) => !removed.has(unitId));
    state.pendingCombats = state.pendingCombats
      .map((combat) => ({
        ...combat,
        attackerEntries: combat.attackerEntries.filter((entry) => !removed.has(entry.unitId))
      }))
      .filter((combat) => combat.attackerEntries.length > 0);
    syncUnitCounts();
  }

  function getReachableRetreatSpaces(startSpaceId, nationName) {
    if (!startSpaceId || !spacesById.has(startSpaceId)) {
      return [];
    }

    const startSpace = spacesById.get(startSpaceId);
    const queue = [startSpace];
    const visited = new Set([startSpace.id]);
    const reachable = [startSpace];

    while (queue.length) {
      const currentSpace = queue.shift();
      const neighbors = adjacentSpaceLookup.get(currentSpace.index) || new Set();

      neighbors.forEach((neighborIndex) => {
        const nextSpace = findSpaceByIndex(neighborIndex);
        if (!nextSpace || visited.has(nextSpace.id)) {
          return;
        }

        const unitsInSpace = getUnitsInSpace(nextSpace.id);
        const isFriendlyOrEmpty = unitsInSpace.every((unit) => getUnitNation(unit) === nationName);
        if (!isFriendlyOrEmpty) {
          return;
        }

        visited.add(nextSpace.id);
        reachable.push(nextSpace);
        queue.push(nextSpace);
      });
    }

    return reachable.sort((first, second) => first.index - second.index);
  }

  function retreatAttackingUnits(spaceId, attackerNation, previousSpaceId) {
    const retreatingUnits = getUnitsInSpace(spaceId).filter((unit) => getUnitNation(unit) === attackerNation);
    if (!retreatingUnits.length) {
      return;
    }

    const previousSpace = spacesById.get(previousSpaceId);
    if (previousSpace) {
      retreatingUnits.forEach((unit) => snapUnitToSpace(unit, previousSpace));
    }

    const retreatStartSpaceId = previousSpace ? previousSpace.id : retreatingUnits[0].spaceId;
    const retreatOptions = getReachableRetreatSpaces(retreatStartSpaceId, attackerNation);
    if (retreatOptions.length > 1) {
      const optionsText = retreatOptions
        .map((space, index) => `${index + 1}: ${space.index} ${space.name}`)
        .join('\n');
      const choice = window.prompt(
        `Choose retreat destination for ${attackerNation} (or cancel to stay in first retreat space):\n${optionsText}`,
        '1'
      );
      const parsed = Number.parseInt(String(choice || '1'), 10);
      const selectedIndex = Number.isFinite(parsed) ? parsed - 1 : 0;
      const destination = retreatOptions[selectedIndex] || retreatOptions[0];
      retreatingUnits.forEach((unit) => snapUnitToSpace(unit, destination));
    }

    const retreatedSet = new Set(state.retreatedUnitIds);
    retreatingUnits.forEach((unit) => retreatedSet.add(unit.id));
    state.retreatedUnitIds = Array.from(retreatedSet);
  }

  function resolveCombatRound(spaceId, attackerNation) {
    const space = spacesById.get(spaceId);
    if (!space) {
      return { attackerStillPresent: false, defendersStillPresent: false };
    }

    const attackerUnits = getUnitsInSpace(spaceId).filter((unit) => getUnitNation(unit) === attackerNation);
    const defenderUnits = getUnitsInSpace(spaceId).filter((unit) => getUnitNation(unit) && getUnitNation(unit) !== attackerNation);

    if (!attackerUnits.length || !defenderUnits.length) {
      return {
        attackerStillPresent: attackerUnits.length > 0,
        defendersStillPresent: defenderUnits.length > 0
      };
    }

    const attackerDice = buildCombatDice(attackerUnits, space);
    const defenderDice = buildCombatDice(defenderUnits, space);
    const defenderNation = getDefenderNationName(attackerNation, defenderUnits);
    const roundLosses = resolveCombatDiceMatchups(attackerDice, defenderDice);

    const attackerCasualties = chooseCasualtyUnitIds(attackerUnits, roundLosses.attackerLosses, `${attackerNation} (attacker)`);
    const defenderCasualties = chooseCasualtyUnitIds(defenderUnits, roundLosses.defenderLosses, 'Defender');
    removeUnitsById([...attackerCasualties, ...defenderCasualties]);

    const attackerStillPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) === attackerNation);
    const defendersStillPresent = getUnitsInSpace(spaceId).some((unit) => {
      const nation = getUnitNation(unit);
      return nation && nation !== attackerNation;
    });

    combatDisplayBySpaceId.set(spaceId, {
      attackerNation,
      defenderNation,
      attackerDice: attackerDice.map((die) => die.value),
      defenderDice: defenderDice.map((die) => die.value),
      attackerLosses: roundLosses.attackerLosses,
      defenderLosses: roundLosses.defenderLosses
    });

    return { attackerStillPresent, defendersStillPresent };
  }

  function withdrawPendingCombat(pendingCombat) {
    if (!pendingCombat) {
      return;
    }

    pendingCombat.attackerEntries.forEach((entry) => {
      const unit = state.units.find((item) => item.id === entry.unitId);
      const originSpace = spacesById.get(entry.originSpaceId);
      if (unit && originSpace) {
        snapUnitToSpace(unit, originSpace);
      }
    });

    removePendingCombat(pendingCombat.id);
  }

  function tryCreateManualPendingCombat(spaceId) {
    const unitsInSpace = getUnitsInSpace(spaceId);
    const nations = Array.from(new Set(unitsInSpace.map((unit) => getUnitNation(unit)).filter(Boolean)));
    if (nations.length < 2) {
      return null;
    }

    const optionsText = nations.map((nation, index) => `${index + 1}: ${nation}`).join('\n');
    const choice = window.prompt(`Choose attacker nation:\n${optionsText}`, '1');
    const parsed = Number.parseInt(String(choice || '1'), 10);
    const selectedIndex = Number.isFinite(parsed) ? parsed - 1 : 0;
    const attackerNation = nations[selectedIndex] || nations[0];
    return ensurePendingCombat(spaceId, attackerNation, null);
  }

  function handleResolveCombatClick(spaceId) {
    let pendingCombat = getPendingCombatForSpace(spaceId);
    if (!pendingCombat) {
      pendingCombat = tryCreateManualPendingCombat(spaceId);
    }

    if (!pendingCombat) {
      return;
    }

    const result = resolveCombatRound(pendingCombat.spaceId, pendingCombat.attackerNation);
    pendingCombat.roundsResolved += 1;

    if (!result.attackerStillPresent || !result.defendersStillPresent) {
      removePendingCombat(pendingCombat.id);
    }

    cleanPendingCombats();
    renderUnits();
    saveState();
  }

  function handleWithdrawClick(spaceId) {
    const pendingCombat = getPendingCombatForSpace(spaceId);
    if (!pendingCombat) {
      return;
    }

    withdrawPendingCombat(pendingCombat);
    cleanPendingCombats();
    renderUnits();
    saveState();
  }

  function resolveCombatAtSpace(spaceId, attackerNation, previousSpaceId = '') {
    const space = spacesById.get(spaceId);
    if (!space) {
      return { attackerRetreated: false, defenderSubmitted: false };
    }

    while (true) {
      const attackerUnits = getUnitsInSpace(spaceId).filter((unit) => getUnitNation(unit) === attackerNation);
      const defenderUnits = getUnitsInSpace(spaceId).filter((unit) => getUnitNation(unit) !== attackerNation);

      if (!attackerUnits.length || !defenderUnits.length) {
        return { attackerRetreated: false, defenderSubmitted: false };
      }

      const defenderNationSet = new Set(defenderUnits.map((unit) => getUnitNation(unit)).filter(Boolean));
      const defendersSingleNation = defenderNationSet.size === 1 ? Array.from(defenderNationSet)[0] : '';
      if (defendersSingleNation && canDefenderSubmit(defendersSingleNation, attackerNation)) {
        const shouldSubmit = window.confirm(
          `${defendersSingleNation} can submit to ${attackerNation}. Submit now and become a vassal?`
        );
        if (shouldSubmit) {
          applySubmission(defendersSingleNation, attackerNation);
          return { attackerRetreated: false, defenderSubmitted: true };
        }
      }

      const attackerDice = buildCombatDice(attackerUnits, space);
      const defenderDice = buildCombatDice(defenderUnits, space);
      const roundLosses = resolveCombatDiceMatchups(attackerDice, defenderDice);

      const attackerCasualties = chooseCasualtyUnitIds(attackerUnits, roundLosses.attackerLosses, `${attackerNation} (attacker)`);
      const defenderCasualties = chooseCasualtyUnitIds(defenderUnits, roundLosses.defenderLosses, 'Defender');
      removeUnitsById([...attackerCasualties, ...defenderCasualties]);

      const attackerStillPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) === attackerNation);
      const defendersStillPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) !== attackerNation);
      if (!attackerStillPresent || !defendersStillPresent) {
        return { attackerRetreated: false, defenderSubmitted: false };
      }

      const canRetreat = Boolean(previousSpaceId && spacesById.has(previousSpaceId));
      if (canRetreat) {
        const shouldRetreat = window.confirm(`${attackerNation} may retreat after this round. Retreat now?`);
        if (shouldRetreat) {
          retreatAttackingUnits(spaceId, attackerNation, previousSpaceId);
          return { attackerRetreated: true, defenderSubmitted: false };
        }
      }
    }
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
      id: createUniqueUnitId(unitTypeId),
      unitTypeId,
      label: deriveUnitLabel(unitTypeId),
      x: toBoardX(anchor.x),
      y: toBoardY(anchor.y),
      spaceId: ''
    };

    const forcedEntrySpaceIndex = nationEntrySpaceByName.get(unitType.nation);
    if (Number.isInteger(forcedEntrySpaceIndex)) {
      const forcedEntrySpace = findSpaceByIndex(forcedEntrySpaceIndex);
      if (forcedEntrySpace) {
        snapUnitToSpace(unit, forcedEntrySpace);
        return unit;
      }
    }

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

  function hasLeaderOnBoard() {
    return state.units.some((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      return isLeaderUnitType(unitType);
    });
  }

  function canNationReceiveGrowth(nationName) {
    if (!nationName) {
      return false;
    }

    if (state.vassalByNation[nationName]) {
      return false;
    }

    if (invaderNations.has(nationName)) {
      return false;
    }

    return true;
  }

  function ensureNationGrowthPoints(nationName) {
    if (!state.growthPointsByNation[nationName]) {
      state.growthPointsByNation[nationName] = {
        unit: 0,
        chariot: 0
      };
    }

    return state.growthPointsByNation[nationName];
  }

  function createGrowthUnit(unitType, placementSpace) {
    const unit = {
      id: createUniqueUnitId(unitType.id),
      unitTypeId: unitType.id,
      label: deriveUnitLabel(unitType.id),
      x: toBoardX(placementSpace.centroidX),
      y: toBoardY(placementSpace.centroidY),
      spaceId: ''
    };

    snapUnitToSpace(unit, placementSpace);
    return unit;
  }

  function applyGrowthForCurrentTurn() {
    if (state.processedGrowthTurns.includes(state.currentTurn)) {
      return;
    }

    const landPointsByNation = getLandPointsByNation();
    const spawnedUnits = [];

    Object.entries(landPointsByNation).forEach(([nationName, landPoints]) => {
      if (!canNationReceiveGrowth(nationName) || !Number.isFinite(landPoints) || landPoints <= 0) {
        return;
      }

      const growthPoints = ensureNationGrowthPoints(nationName);
      growthPoints.unit += landPoints;
      growthPoints.chariot += landPoints;

      const unitType = getNationUnitTypeForGrowth(nationName, 'standard');
      while (unitType && growthPoints.unit >= UNIT_GROWTH_THRESHOLD) {
        const placementSpaces = getEligibleGrowthPlacementSpaces(nationName, { requireNonHill: false });
        if (!placementSpaces.length) {
          break;
        }

        spawnedUnits.push(createGrowthUnit(unitType, placementSpaces[0]));
        growthPoints.unit -= UNIT_GROWTH_THRESHOLD;
      }

      const chariotType = getNationUnitTypeForGrowth(nationName, 'chariot');
      while (chariotType && growthPoints.chariot >= CHARIOT_GROWTH_THRESHOLD) {
        const placementSpaces = getEligibleGrowthPlacementSpaces(nationName, { requireNonHill: true });
        if (!placementSpaces.length) {
          break;
        }

        spawnedUnits.push(createGrowthUnit(chariotType, placementSpaces[0]));
        growthPoints.chariot -= CHARIOT_GROWTH_THRESHOLD;
      }
    });

    if (spawnedUnits.length) {
      state.units.push(...spawnedUnits);
      syncUnitCounts();
    }

    state.processedGrowthTurns = [...state.processedGrowthTurns, state.currentTurn].sort((first, second) => first - second);
  }

  function ensureLeaderForCurrentTurn() {
    if (state.gameComplete || getCurrentPhase().id === 'end') {
      return;
    }

    const scheduledLeader = leaderSchedule.get(state.currentTurn);
    if (!scheduledLeader || state.spawnedLeaderTurns.includes(state.currentTurn)) {
      return;
    }

    const spawnedUnits = [];

    const leaderUnit = createUnitFromType(
      scheduledLeader.unitTypeId,
      scheduledLeader.anchor,
      scheduledLeader.preferredSpaceName
    );
    if (leaderUnit) {
      spawnedUnits.push(leaderUnit);
    }

    const reinforcements = invadingReinforcementsByTurn.get(state.currentTurn) || [];
    reinforcements.forEach((spec) => {
      for (let i = 0; i < spec.count; i += 1) {
        const reinforcement = createUnitFromType(spec.unitTypeId, scheduledLeader.anchor, scheduledLeader.preferredSpaceName);
        if (reinforcement) {
          spawnedUnits.push(reinforcement);
        }
      }
    });

    if (!spawnedUnits.length) {
      return;
    }

    state.units.push(...spawnedUnits);
    state.spawnedLeaderTurns = [...state.spawnedLeaderTurns, state.currentTurn].sort((first, second) => first - second);
    syncUnitCounts();
  }

  function ensureTurnThreePhilistiaReinforcements() {
    if (state.gameComplete || getCurrentPhase().id === 'end' || state.currentTurn !== 3) {
      return;
    }

    if (state.spawnedReinforcementTurns.includes(3)) {
      return;
    }

    const spawnedUnits = [];
    const reinforcementSpecs = [
      { unitTypeId: 'philistia', count: 3 },
      { unitTypeId: 'philistia-chariot', count: 2 }
    ];

    reinforcementSpecs.forEach((spec) => {
      for (let i = 0; i < spec.count; i += 1) {
        const unit = createUnitFromType(spec.unitTypeId, { x: 180, y: 1115 }, 'Philistia');
        if (unit) {
          spawnedUnits.push(unit);
        }
      }
    });

    if (!spawnedUnits.length) {
      return;
    }

    state.units.push(...spawnedUnits);
    state.pendingEntryCombatUnitIds = spawnedUnits.map((unit) => unit.id);
    state.spawnedReinforcementTurns = [...state.spawnedReinforcementTurns, 3];
    syncUnitCounts();
  }

  function resolvePendingEntryCombatBeforeMovement() {
    if (!state.pendingEntryCombatUnitIds.length) {
      return;
    }

    const pendingUnitIdSet = new Set(state.pendingEntryCombatUnitIds);
    const pendingUnits = state.units.filter((unit) => pendingUnitIdSet.has(unit.id) && unit.spaceId);
    const groupedBySpaceAndNation = new Map();

    pendingUnits.forEach((unit) => {
      const nation = getUnitNation(unit);
      if (!nation) {
        return;
      }

      const key = `${unit.spaceId}|${nation}`;
      if (!groupedBySpaceAndNation.has(key)) {
        groupedBySpaceAndNation.set(key, { spaceId: unit.spaceId, nation });
      }
    });

    groupedBySpaceAndNation.forEach(({ spaceId, nation }) => {
      const enemyPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) && getUnitNation(unit) !== nation);
      if (enemyPresent) {
        ensurePendingCombat(spaceId, nation, null);
      }
    });

    state.pendingEntryCombatUnitIds = [];
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
    const phase = getCurrentPhase();
    evaluateVassalBreakFree();
    cleanPendingCombats();

    if (phase.id === 'end') {
      if (hasLeaderOnBoard()) {
        applyGrowthForCurrentTurn();
      }
      applyEndPhaseCleanup();
      return;
    }

    ensureLeaderForCurrentTurn();
    ensureTurnThreePhilistiaReinforcements();

    if (phase.id === 'growth' && !hasLeaderOnBoard()) {
      applyGrowthForCurrentTurn();
    }

    if (phase.id === 'action') {
      resolvePendingEntryCombatBeforeMovement();
    }
  }

  function advanceTurnPhase() {
    if (state.gameComplete) {
      return;
    }

    const phase = getCurrentPhase();

    if (phase.id === 'growth') {
      state.currentPhaseIndex = 1;
      resolvePendingEntryCombatBeforeMovement();
    } else if (phase.id === 'action') {
      state.currentPhaseIndex = 2;
    } else if (state.currentTurn >= TOTAL_TURNS) {
      state.gameComplete = true;
    } else {
      state.currentTurn += 1;
      state.currentPhaseIndex = 0;
      state.activatedUnitIds = [];
      state.retreatedUnitIds = [];
    }

    syncTurnState();
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

    const phase = getCurrentPhase();
    if (phase.id === 'end') {
      return false;
    }

    const unitType = unitTypeById.get(unit.unitTypeId);
    if (isLeaderUnitType(unitType) && getCurrentPhase().id === 'growth') {
      return getEligibleLeaderEntrySpaces(unitType, unit.id).some((space) => space.id === targetSpace.id);
    }

    if (phase.id === 'growth') {
      return false;
    }

    if (state.retreatedUnitIds.includes(unit.id)) {
      return false;
    }

    const unitNation = getUnitNation(unit);
    const overlordNation = state.vassalByNation[unitNation];
    if (overlordNation) {
      const targetHasOverlord = getUnitsInSpace(targetSpace.id).some((occupant) => getUnitNation(occupant) === overlordNation);
      if (targetHasOverlord) {
        return false;
      }
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
      const suffix = getSpaceMarkerSuffix(space);
      marker.textContent = showSpaceNamesToggle && showSpaceNamesToggle.checked
        ? `${space.index} ${suffix} ${space.name}`
        : `${space.index} ${suffix}`;
      marker.title = `${space.name || `Space ${space.index}`} (${suffix})`;
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
    mapCanvas.querySelectorAll('.combat-action-button').forEach((node) => node.remove());
    mapCanvas.querySelectorAll('.combat-dice-panel').forEach((node) => node.remove());
    mapCanvas.querySelectorAll('.debug-start-die').forEach((node) => node.remove());

    const showStartDebugDice = !state.gameComplete && state.currentTurn === 1 && getCurrentPhase().id === 'growth';

    const stackCounters = new Map();
    const stackSizes = new Map();
    const renderedEntries = [];
    const renderedEntryByStackKey = new Map();

    state.units.forEach((unit) => {
      const hasSpace = unit.spaceId && spacesById.has(unit.spaceId);
      if (!hasSpace) {
        renderedEntries.push({ unit, count: 1 });
        return;
      }

      const nationKey = getUnitNation(unit) || unit.unitTypeId;
      const stackKey = `${unit.spaceId}|${nationKey}`;
      const existingEntry = renderedEntryByStackKey.get(stackKey);
      if (existingEntry) {
        existingEntry.count += 1;
        return;
      }

      const newEntry = { unit, count: 1 };
      renderedEntryByStackKey.set(stackKey, newEntry);
      renderedEntries.push(newEntry);
    });

    renderedEntries.sort((first, second) => {
      const firstHasSpace = first.unit.spaceId && spacesById.has(first.unit.spaceId);
      const secondHasSpace = second.unit.spaceId && spacesById.has(second.unit.spaceId);

      if (firstHasSpace && secondHasSpace && first.unit.spaceId === second.unit.spaceId) {
        const firstType = unitTypeById.get(first.unit.unitTypeId);
        const secondType = unitTypeById.get(second.unit.unitTypeId);
        const firstIsLeader = isLeaderUnitType(firstType);
        const secondIsLeader = isLeaderUnitType(secondType);

        if (firstIsLeader !== secondIsLeader) {
          return firstIsLeader ? 1 : -1;
        }
      }

      return 0;
    });

    renderedEntries.forEach((entry) => {
      const { unit } = entry;
      if (!unit.spaceId || !spacesById.has(unit.spaceId)) {
        return;
      }

      stackSizes.set(unit.spaceId, (stackSizes.get(unit.spaceId) || 0) + 1);
    });

    renderedEntries.forEach((entry) => {
      const { unit, count } = entry;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'unit';
      button.dataset.unitId = unit.id;
      const unitLocked = !canInteractWithUnit(unit);
      button.classList.toggle('unit-locked', unitLocked);

      const unitType = unitTypeById.get(unit.unitTypeId);
  const isLeader = isLeaderUnitType(unitType);
  button.classList.toggle('unit-leader', isLeader);
  button.style.zIndex = isLeader ? '6' : '3';
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

      if (count > 1) {
        const stackCount = document.createElement('span');
        stackCount.className = 'unit-stack-count';
        stackCount.textContent = `x${count}`;
        button.appendChild(stackCount);
      }

      const hasSpace = unit.spaceId && spacesById.has(unit.spaceId);
      const stackIndex = hasSpace ? stackCounters.get(unit.spaceId) || 0 : 0;
      const stackSize = hasSpace ? stackSizes.get(unit.spaceId) || 1 : 1;
      if (hasSpace) {
        stackCounters.set(unit.spaceId, stackIndex + 1);
      }

      positionUnit(button, unit, stackIndex, stackSize);

      if (showStartDebugDice) {
        const unitCenterX = Number.parseFloat(button.style.left);
        const unitCenterY = Number.parseFloat(button.style.top);
        const unitSize = UNIT_SIZE_PX * state.zoom;
        const dieSize = DIE_SIZE_PX * state.zoom;
        const gap = DIE_LEFT_MARGIN_PX * state.zoom;

        // Red (attacker) die — immediately left of unit
        const redValue = Math.floor(Math.random() * 6) + 1;
        const redDie = createCombatDieElement(redValue, 'attacker');
        redDie.classList.add('debug-start-die');
        const redCenterX = unitCenterX - unitSize / 2 - gap - dieSize / 2;
        redDie.style.left = `${Math.round(redCenterX)}px`;
        redDie.style.top = `${Math.round(unitCenterY)}px`;
        mapCanvas.appendChild(redDie);

        // White (defender) die — immediately left of red die
        const whiteValue = Math.floor(Math.random() * 6) + 1;
        const whiteDie = createCombatDieElement(whiteValue, 'defender');
        whiteDie.classList.add('debug-start-die');
        const whiteCenterX = redCenterX - dieSize / 2 - gap - dieSize / 2;
        whiteDie.style.left = `${Math.round(whiteCenterX)}px`;
        whiteDie.style.top = `${Math.round(unitCenterY)}px`;
        mapCanvas.appendChild(whiteDie);
      }

      if (hasSpace) {
        const space = spacesById.get(unit.spaceId);
        const unitDisplayName = unitType ? unitType.displayName : unit.label;
        button.title = count > 1
          ? `${unitDisplayName} x${count} in ${space.name}`
          : `${unitDisplayName} in ${space.name}`;
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

    Array.from(combatDisplayBySpaceId.entries()).forEach(([spaceId, diceDisplay]) => {
      const space = spacesById.get(spaceId);
      if (!space) {
        return;
      }

      const centerY = Math.round(toBoardY(space.centroidY) * state.zoom);
      const anchorX = Math.round(toBoardX(space.centroidX) * state.zoom - UNIT_SIZE_PX * state.zoom * 0.9);

      const panel = document.createElement('div');
      panel.className = 'combat-dice-panel';
      panel.style.left = `${anchorX}px`;
      panel.style.top = `${centerY}px`;

      const attackerRow = document.createElement('div');
      attackerRow.className = 'combat-dice-row attacker';
      const attackerLabel = document.createElement('div');
      attackerLabel.className = 'combat-dice-label';
      attackerLabel.textContent = `${diceDisplay.attackerNation} (A)`;
      attackerRow.appendChild(attackerLabel);
      diceDisplay.attackerDice.forEach((value) => {
        attackerRow.appendChild(createCombatDieElement(value, 'attacker'));
      });

      const defenderRow = document.createElement('div');
      defenderRow.className = 'combat-dice-row defender';
      const defenderLabel = document.createElement('div');
      defenderLabel.className = 'combat-dice-label';
      defenderLabel.textContent = `${diceDisplay.defenderNation} (D)`;
      defenderRow.appendChild(defenderLabel);
      diceDisplay.defenderDice.forEach((value) => {
        defenderRow.appendChild(createCombatDieElement(value, 'defender'));
      });

      panel.appendChild(attackerRow);
      panel.appendChild(defenderRow);
      mapCanvas.appendChild(panel);
    });

    const combatButtonSpaces = detectedSpaces.filter((space) => isSpaceContestable(space.id));
    combatButtonSpaces.forEach((space) => {
      const pendingCombat = getPendingCombatForSpace(space.id);
      const showWithdraw = Boolean(pendingCombat && pendingCombat.roundsResolved > 0);
      const buttonY = Math.round(toBoardY(space.centroidY) * state.zoom);
      const buttonX = Math.round(toBoardX(space.centroidX) * state.zoom - UNIT_SIZE_PX * state.zoom * 0.9);

      const resolveButton = document.createElement('button');
      resolveButton.type = 'button';
      resolveButton.className = 'combat-action-button';
      resolveButton.textContent = 'Resolve Combat';
      resolveButton.style.left = `${buttonX}px`;
      resolveButton.style.top = `${buttonY}px`;
      resolveButton.addEventListener('click', () => handleResolveCombatClick(space.id));
      mapCanvas.appendChild(resolveButton);

      if (showWithdraw) {
        const withdrawButton = document.createElement('button');
        withdrawButton.type = 'button';
        withdrawButton.className = 'combat-action-button';
        withdrawButton.textContent = 'Withdraw';
        withdrawButton.style.left = `${buttonX}px`;
        withdrawButton.style.top = `${buttonY + Math.round(24 * state.zoom)}px`;
        withdrawButton.addEventListener('click', () => handleWithdrawClick(space.id));
        mapCanvas.appendChild(withdrawButton);
      }
    });
  }

  function positionUnit(element, unit, stackIndex, stackSize = 1) {
    let baseX = unit.x;
    let baseY = unit.y;

    if (unit.spaceId && spacesById.has(unit.spaceId)) {
      const space = spacesById.get(unit.spaceId);
      baseX = toBoardX(space.centroidX);
      baseY = toBoardY(space.centroidY);
    }

    const offsetStep = (UNIT_SIZE_PX + STACK_VERTICAL_GAP_PX) * state.zoom;
    const centeredIndex = stackIndex - (stackSize - 1) / 2;
    const verticalOffset = centeredIndex * offsetStep;
    element.style.left = `${Math.round(baseX * state.zoom)}px`;
    element.style.top = `${Math.round(baseY * state.zoom + verticalOffset)}px`;
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
          const originSpaceId = unit.spaceId;
          const movingNation = getUnitNation(unit);
          snapUnitToSpace(unit, targetSpace);

          const activatedSet = new Set(state.activatedUnitIds);
          activatedSet.add(unit.id);
          state.activatedUnitIds = Array.from(activatedSet);

          if (getCurrentPhase().id === 'action' && movingNation) {
            const enemyPresent = getUnitsInSpace(targetSpace.id).some(
              (occupant) => getUnitNation(occupant) && getUnitNation(occupant) !== movingNation
            );

            if (enemyPresent) {
              ensurePendingCombat(targetSpace.id, movingNation, {
                unitId: unit.id,
                originSpaceId: originSpaceId || targetSpace.id
              });
            }
          }
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
