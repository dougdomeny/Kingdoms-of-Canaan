(() => {
  const STORAGE_KEY = 'koc.gameState.v1';
  const RESET_SCROLL_RIGHT_KEY = 'koc.resetScrollRight';
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
  const skipTurnButton = document.getElementById('skip-turn');
  const runAiTurnButton = document.getElementById('run-ai-turn');
  const currentNationLabel = document.getElementById('current-nation');
  const resetGameButton = document.getElementById('reset-game');
  const combatStatusLabel = document.getElementById('combat-status');
  const vpSummaryLabel = document.getElementById('vp-summary');
  const vpTable = document.getElementById('vp-table');

  const TOTAL_TURNS = 9;
  const HEBREW_DIVISION_TRIGGER_TURN = 5;
  const NATION_ORDER = [
    { label: 'Hebrew',      nations: new Set(['Hebrew']) },
    { label: 'Israelite',   nations: new Set(['Israel']) },
    { label: 'Judah',       nations: new Set(['Judah']) },
    { label: 'Amorite',     nations: new Set(['Amorite']) },
    { label: 'Canaanite',   nations: new Set(['Canaan']) },
    { label: 'Ammonite',    nations: new Set(['Ammon']) },
    { label: 'Moabite',     nations: new Set(['Moab']) },
    { label: 'Edomite',     nations: new Set(['Edom']) },
    { label: 'Phoenician',  nations: new Set(['Phoenicia']) },
    { label: 'Philistine',  nations: new Set(['Philistia']) },
    { label: 'Egyptian',    nations: new Set(['Egypt']) },
    { label: 'Aram-Syrian', nations: new Set(['Aram-Syria']) },
    { label: 'Samaritan',   nations: new Set(['Samaria']) },
    { label: 'Assyrian',    nations: new Set(['Assyria', 'Assyrria']) },
    { label: 'Babylonian',  nations: new Set(['Babylonia']) }
  ];

  const PHASES = [
    {
      id: 'growth',
      label: 'Growth Phase',
      helpText: 'Leaders and invaders enter. Growth resolves during Growth Phase.',
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
  const VP_OBJECTIVE_NATIONS = [
    'Hebrew',
    'Canaan',
    'Amorite',
    'Ammon',
    'Moab',
    'Edom',
    'Phoenicia',
    'Philistia',
    'Israel',
    'Judah',
    'Egypt',
    'Aram-Syria',
    'Assyria',
    'Babylonia'
  ];
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
    ['Jerusalem', { growth: 1, terrain: 'hills' }],
    ['Bethlehem', { growth: 1, terrain: 'hills' }],
    ['Benjamin', { growth: 1, terrain: 'hills' }],
    ['Jericho', { growth: 1, terrain: 'plains' }],
    ['Jeshimon', { growth: 0, terrain: 'hills' }],
    ['Hebron', { growth: 1, terrain: 'standard' }],
    ['Negev', { growth: 0, terrain: 'desert' }],
    ['Bashan', { growth: 1, terrain: 'standard' }],
    ['Geshur', { growth: 1, terrain: 'standard' }],
    ['Argob', { growth: 0, terrain: 'standard' }],
    ['Gilead', { growth: 2, terrain: 'standard' }],
    ['Jazer', { growth: 1, terrain: 'hills' }],
    ['Ammon', { growth: 1, terrain: 'standard' }],
    ['Mishor', { growth: 1, terrain: 'standard' }],
    ['Moab', { growth: 1, terrain: 'standard' }],
    ['Valley of Siddim', { growth: 0, terrain: 'desert' }],
    ['Edom', { growth: 1, terrain: 'standard' }],
    ['Eastern Desert', { growth: 0, terrain: 'desert' }]
  ]);
  const REGION_TERRAIN_OVERRIDES_BY_INDEX = new Map([
    [1, 'standard']
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
    [22, { x: 493, y: 1056 }],
    [29, { x: 1000, y: 130 }],
    [30, { x: 968, y: 860 }]
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
    [16, 22],
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
    [15, 18],
    [15, 19],
    [18, 24],
    [18, 22],
    [27, 34],
    [18, 19],
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
      currentNationIndex: 0,
    spawnedLeaderTurns: [],
    spawnedReinforcementTurns: [],
    pendingEntryCombatUnitIds: [],
    pendingCombats: [],
    processedGrowthTurns: [],
    processedGrowthTurnKeys: [],
    growthPointsByNation: {},
    growthSummaryByTurnKey: {},
    vassalByNation: {},
    requiredGarrisons: [],
    retreatedUnitIds: [],
    activatedUnitIds: [],
    vpByNation: {},
    vpLog: [],
    vpScoredKeys: [],
    vpRegionAwardedTurns: [],
    vpNationTurnBaseline: {},
    vpSeenNations: [],
    hebrewDivisionResolved: false,
    gameComplete: false,
    unitCounts: {
      ammon: 2,
      amorite: 6,
      canaan: 9,
      'egypt-chariot': 1,
      hebrew: 21,
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
      ...Array.from({ length: 21 }, (_, index) => ({
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

  const shouldResetScrollRight = sessionStorage.getItem(RESET_SCROLL_RIGHT_KEY) === '1';
  if (shouldResetScrollRight) {
    sessionStorage.removeItem(RESET_SCROLL_RIGHT_KEY);
  }

  const state = loadState();
  let dragState = null;
  const combatDisplayBySpaceId = new Map();
  let combatStatusTimeoutId = 0;
  let promptUnsupportedNotified = false;
  let pendingCombatNoticeOnOk = null;

  const combatNoticeOverlay = document.createElement('div');
  combatNoticeOverlay.className = 'combat-notice-overlay hidden';
  combatNoticeOverlay.setAttribute('role', 'dialog');
  combatNoticeOverlay.setAttribute('aria-modal', 'true');

  const combatNoticeDialog = document.createElement('div');
  combatNoticeDialog.className = 'combat-notice-dialog';

  const combatNoticeMessage = document.createElement('p');
  combatNoticeMessage.className = 'combat-notice-message';

  const combatNoticeOkButton = document.createElement('button');
  combatNoticeOkButton.type = 'button';
  combatNoticeOkButton.className = 'combat-notice-ok';
  combatNoticeOkButton.textContent = 'OK';

  combatNoticeDialog.appendChild(combatNoticeMessage);
  combatNoticeDialog.appendChild(combatNoticeOkButton);
  combatNoticeOverlay.appendChild(combatNoticeDialog);
  document.body.appendChild(combatNoticeOverlay);

  function hideCombatNotice() {
    combatNoticeOverlay.classList.add('hidden');
    combatNoticeDialog.style.left = '';
    combatNoticeDialog.style.top = '';
    const onOk = pendingCombatNoticeOnOk;
    pendingCombatNoticeOnOk = null;
    if (typeof onOk === 'function') {
      onOk();
    }
  }

  function showCombatNotice(message, onOk, spaceId = '') {
    combatNoticeMessage.textContent = String(message || '').trim() || 'Units were removed.';
    pendingCombatNoticeOnOk = typeof onOk === 'function' ? onOk : null;

    const space = spaceId ? spacesById.get(spaceId) : null;
    if (space) {
      const mapBounds = mapCanvas.getBoundingClientRect();
      const spaceX = Math.round(toBoardX(space.centroidX) * state.zoom);
      const spaceY = Math.round(toBoardY(space.centroidY) * state.zoom);
      const viewportX = mapBounds.left + spaceX - mapViewport.scrollLeft;
      const viewportY = mapBounds.top + spaceY - mapViewport.scrollTop;
      const unitSizePx = UNIT_SIZE_PX * state.zoom;
      const dialogWidth = Math.min(448, Math.max(256, Math.round(window.innerWidth * 0.75)));
      const left = Math.max(12, Math.min(window.innerWidth - dialogWidth - 12, Math.round(viewportX - dialogWidth / 2)));
      const top = Math.max(12, Math.min(window.innerHeight - 140, Math.round(viewportY + unitSizePx * 1.4)));

      combatNoticeDialog.style.left = `${left}px`;
      combatNoticeDialog.style.top = `${top}px`;
    }

    combatNoticeOverlay.classList.remove('hidden');
    combatNoticeOkButton.focus();
  }

  combatNoticeOkButton.addEventListener('click', hideCombatNotice);
  combatNoticeOverlay.addEventListener('click', (event) => {
    if (event.target === combatNoticeOverlay) {
      hideCombatNotice();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (combatNoticeOverlay.classList.contains('hidden')) {
      return;
    }

    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault();
      hideCombatNotice();
    }
  });

  function setCombatStatus(message, type = 'info', autoHideMs = 5000) {
    if (!combatStatusLabel) {
      return;
    }

    combatStatusLabel.textContent = String(message || '').trim();
    combatStatusLabel.classList.remove('is-info', 'is-success', 'is-error');
    if (type === 'success') {
      combatStatusLabel.classList.add('is-success');
    } else if (type === 'error') {
      combatStatusLabel.classList.add('is-error');
    } else {
      combatStatusLabel.classList.add('is-info');
    }

    if (combatStatusTimeoutId) {
      window.clearTimeout(combatStatusTimeoutId);
      combatStatusTimeoutId = 0;
    }

    if (autoHideMs > 0) {
      combatStatusTimeoutId = window.setTimeout(() => {
        combatStatusLabel.textContent = '';
        combatStatusLabel.classList.remove('is-info', 'is-success', 'is-error');
        combatStatusTimeoutId = 0;
      }, autoHideMs);
    }
  }

  function promptWithFallback(message, defaultValue = '') {
    try {
      if (typeof window.prompt === 'function') {
        return window.prompt(message, defaultValue);
      }
    } catch {
      if (!promptUnsupportedNotified) {
        setCombatStatus('Dialog prompts are blocked in this browser. Using default combat selections.', 'info', 6500);
        promptUnsupportedNotified = true;
      }
    }

    return null;
  }

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
        const currentNationIndex = sanitizeInteger(
          parsed.currentNationIndex,
          0,
          NATION_ORDER.length - 1,
          defaultState.currentNationIndex
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
      const processedGrowthTurnKeys = normalizeProcessedGrowthTurnKeys(parsed.processedGrowthTurnKeys);
      const growthPointsByNation = normalizeGrowthPointsByNation(parsed.growthPointsByNation);
      const growthSummaryByTurnKey = normalizeGrowthSummaryByTurnKey(parsed.growthSummaryByTurnKey);
      const vassalByNation = normalizeVassalByNation(parsed.vassalByNation);
      const requiredGarrisons = normalizeRequiredGarrisons(parsed.requiredGarrisons);
      const retreatedUnitIds = normalizeUniqueStringList(parsed.retreatedUnitIds);
      const activatedUnitIds = normalizeUniqueStringList(parsed.activatedUnitIds);
      const vpByNation = normalizeStringNumberMap(parsed.vpByNation);
      const vpLog = normalizeVpLog(parsed.vpLog);
      const vpScoredKeys = normalizeUniqueStringList(parsed.vpScoredKeys);
      const vpRegionAwardedTurns = normalizeUniqueTurnList(parsed.vpRegionAwardedTurns);
      const vpNationTurnBaseline = normalizeStringNumberMap(parsed.vpNationTurnBaseline);
      const vpSeenNations = normalizeUniqueStringList(parsed.vpSeenNations);

      return {
        zoom,
        scrollLeft: sanitizeNumber(parsed.scrollLeft, 0, BASE_WIDTH * zoom, 0),
        scrollTop: sanitizeNumber(parsed.scrollTop, 0, BASE_HEIGHT * zoom, 0),
        currentTurn,
        currentPhaseIndex,
          currentNationIndex,
        spawnedLeaderTurns,
        spawnedReinforcementTurns,
        pendingEntryCombatUnitIds,
        pendingCombats,
        processedGrowthTurns,
        processedGrowthTurnKeys,
        growthPointsByNation,
        growthSummaryByTurnKey,
        vassalByNation,
        requiredGarrisons,
        retreatedUnitIds,
        activatedUnitIds,
        vpByNation,
        vpLog,
        vpScoredKeys,
        vpRegionAwardedTurns,
        vpNationTurnBaseline,
        vpSeenNations,
        hebrewDivisionResolved: Boolean(parsed.hebrewDivisionResolved),
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

    const defenderUnitIds = normalizeUniqueStringList(value.defenderUnitIds);

    return {
      id: typeof value.id === 'string' && value.id ? value.id : `${spaceId}|${attackerNation}`,
      spaceId,
      attackerNation,
      attackerEntries,
      defenderUnitIds,
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

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function getDividedHebrewNationForRoll(value) {
    return value <= 4 ? 'Israel' : 'Judah';
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

  function normalizeGrowthSummaryByTurnKey(value) {
    const normalized = {};
    if (!value || typeof value !== 'object') {
      return normalized;
    }

    Object.entries(value).forEach(([turnKey, summary]) => {
      if (!turnKey || !summary || typeof summary !== 'object') {
        return;
      }

      normalized[String(turnKey)] = {
        regionCount: Math.max(0, sanitizeInteger(summary.regionCount, 0, 9999, 0)),
        totalGrowthPoints: Math.max(0, sanitizeInteger(summary.totalGrowthPoints, 0, 9999, 0)),
        unitsAdded: Math.max(0, sanitizeInteger(summary.unitsAdded, 0, 9999, 0))
      };
    });

    return normalized;
  }

  function normalizeProcessedGrowthTurnKeys(value) {
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

  function normalizeRequiredGarrisons(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    const seen = new Set();
    const normalized = [];

    value.forEach((entry) => {
      if (!entry || typeof entry !== 'object') {
        return;
      }

      const spaceId = String(entry.spaceId || '').trim();
      const nation = String(entry.nation || '').trim();
      if (!spaceId || !nation) {
        return;
      }

      const key = `${spaceId}|${nation}`;
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      normalized.push({ spaceId, nation });
    });

    return normalized;
  }

  function normalizeStringNumberMap(value) {
    const normalized = {};
    if (!value || typeof value !== 'object') {
      return normalized;
    }

    Object.entries(value).forEach(([key, rawValue]) => {
      const normalizedKey = String(key || '').trim();
      if (!normalizedKey) {
        return;
      }

      const parsed = sanitizeInteger(rawValue, -9999, 9999, 0);
      normalized[normalizedKey] = parsed;
    });

    return normalized;
  }

  function normalizeVpLog(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const nation = String(entry.nation || '').trim();
        const type = String(entry.type || '').trim();
        const label = String(entry.label || '').trim();
        const key = String(entry.key || '').trim();
        if (!nation || !type) {
          return null;
        }

        return {
          id: String(entry.id || `${entry.turn || 0}|${nation}|${type}|${key || label}`),
          key,
          nation,
          points: sanitizeInteger(entry.points, -9999, 9999, 0),
          turn: sanitizeInteger(entry.turn, 0, TOTAL_TURNS, 0),
          type,
          label
        };
      })
      .filter(Boolean);
  }

  function normalizeUniqueTurnList(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .map((entry) => sanitizeInteger(entry, 1, TOTAL_TURNS, 0))
          .filter((entry) => entry > 0)
      )
    ).sort((first, second) => first - second);
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

  function getActiveNationEntry() {
    return NATION_ORDER[state.currentNationIndex] || NATION_ORDER[0];
  }

  function isNationActive(nationName) {
    if (!nationName) {
      return false;
    }

    return getActiveNationEntry().nations.has(nationName);
  }

  function getNationEntryUnitCount(nationEntry) {
    if (!nationEntry || !nationEntry.nations || !nationEntry.nations.size) {
      return 0;
    }

    return state.units.reduce((count, unit) => {
      const unitNation = getUnitNation(unit);
      if (!unitNation || !nationEntry.nations.has(unitNation)) {
        return count;
      }

      const unitType = unitTypeById.get(unit.unitTypeId);
      return isLeaderUnitType(unitType) ? count : count + 1;
    }, 0);
  }

  function getScheduledLeaderSpec(turn) {
    const scheduledLeader = leaderSchedule.get(turn);
    if (!scheduledLeader) {
      return null;
    }

    const unitType = unitTypeById.get(scheduledLeader.unitTypeId);
    if (!unitType) {
      return null;
    }

    return {
      ...scheduledLeader,
      nation: unitType.nation,
      unitType
    };
  }

  function hasScheduledNationEntryForTurn(turn, nationEntry) {
    if (!nationEntry || state.spawnedLeaderTurns.includes(turn)) {
      return turn === 3 && !state.spawnedReinforcementTurns.includes(3) && nationEntry.nations.has('Philistia');
    }

    if (turn === 3 && !state.spawnedReinforcementTurns.includes(3) && nationEntry.nations.has('Philistia')) {
      return true;
    }

    const scheduledLeader = getScheduledLeaderSpec(turn);
    if (!scheduledLeader || !nationEntry.nations.has(scheduledLeader.nation)) {
      return false;
    }

    return invaderNations.has(scheduledLeader.nation);
  }

  function findNextPlayableNationTurn(startTurn, startNationIndex) {
    let turn = startTurn;
    let nationIndex = startNationIndex;

    while (turn <= TOTAL_TURNS) {
      nationIndex += 1;
      if (nationIndex >= NATION_ORDER.length) {
        nationIndex = 0;
        turn += 1;
      }

      if (turn > TOTAL_TURNS) {
        return null;
      }

      const candidate = NATION_ORDER[nationIndex];
      if (getNationEntryUnitCount(candidate) > 0 || hasScheduledNationEntryForTurn(turn, candidate)) {
        return { turn, nationIndex };
      }
    }

    return null;
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

    if (!isNationActive(getUnitNation(unit))) {
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

  function isRegularUnitType(unitType) {
    return Boolean(unitType && !isLeaderUnitType(unitType) && !isChariotUnitType(unitType));
  }

  function isChariotUnitType(unitType) {
    return Boolean(unitType && unitType.classification === 'chariot');
  }

  function isInvaderUnitType(unitType) {
    return Boolean(unitType && invaderNations.has(unitType.nation));
  }

  function getUnitNation(unit) {
    if (!unit) {
      return '';
    }

    const unitType = unitTypeById.get(unit.unitTypeId);
    if (!unitType) {
      return '';
    }
    // Hittite units are synonymous with Canaanite units
    if (unitType.nation === 'Hittite') {
      return 'Canaan';
    }
    return unitType.nation;
  }

  function applyHebrewDivision() {
    if (state.hebrewDivisionResolved) {
      return false;
    }

    const israelUnitType = getNationUnitTypeForGrowth('Israel', 'standard');
    const judahUnitType = getNationUnitTypeForGrowth('Judah', 'standard');
    if (!israelUnitType || !judahUnitType) {
      return false;
    }

    const divisionBySpaceId = new Map();

    state.units.forEach((unit) => {
      if (getUnitNation(unit) !== 'Hebrew' || !unit.spaceId) {
        return;
      }

      if (!divisionBySpaceId.has(unit.spaceId)) {
        const die = rollDie();
        divisionBySpaceId.set(unit.spaceId, {
          die,
          nation: getDividedHebrewNationForRoll(die)
        });
      }
    });

    state.units.forEach((unit) => {
      if (getUnitNation(unit) !== 'Hebrew' || !unit.spaceId) {
        return;
      }

      const division = divisionBySpaceId.get(unit.spaceId);
      if (!division) {
        return;
      }

      unit.unitTypeId = division.nation === 'Israel' ? israelUnitType.id : judahUnitType.id;
      unit.label = deriveUnitLabel(unit.unitTypeId);
    });

    state.pendingCombats = state.pendingCombats.map((combat) => {
      if (combat.attackerNation !== 'Hebrew') {
        return combat;
      }

      const division = divisionBySpaceId.get(combat.spaceId);
      if (!division) {
        return combat;
      }

      return {
        ...combat,
        attackerNation: division.nation
      };
    });

    const updatedRequiredGarrisons = [];
    const seenRequiredGarrisons = new Set();
    state.requiredGarrisons.forEach((entry) => {
      if (!entry || !entry.spaceId || !entry.nation) {
        return;
      }

      const division = entry.nation === 'Hebrew' ? divisionBySpaceId.get(entry.spaceId) : null;
      const nextNation = division ? division.nation : entry.nation;
      if (!nextNation) {
        return;
      }

      const key = `${entry.spaceId}|${nextNation}`;
      if (seenRequiredGarrisons.has(key)) {
        return;
      }

      seenRequiredGarrisons.add(key);
      updatedRequiredGarrisons.push({ spaceId: entry.spaceId, nation: nextNation });
    });
    state.requiredGarrisons = updatedRequiredGarrisons;

    state.vassalByNation = Object.fromEntries(
      Object.entries(state.vassalByNation).filter(([vassalNation, overlordNation]) => {
        return vassalNation !== 'Hebrew' && overlordNation !== 'Hebrew';
      })
    );

    delete state.growthPointsByNation.Hebrew;
    state.hebrewDivisionResolved = true;
    syncUnitCounts();

    if (divisionBySpaceId.size) {
      const divisionSummary = Array.from(divisionBySpaceId.entries())
        .map(([spaceId, division]) => {
          const space = spacesById.get(spaceId);
          const spaceName = space ? getSpaceBaseName(space) : spaceId;
          return `${spaceName}: ${division.nation} (${division.die})`;
        })
        .join(', ');
      setCombatStatus(`Hebrew division resolved. ${divisionSummary}.`, 'info', 9000);
    } else {
      setCombatStatus('Hebrew division resolved. Hebrew vassals are now independent.', 'info', 9000);
    }

    return true;
  }

  function getSpaceBaseName(space) {
    if (!space || !space.name) {
      return '';
    }

    return String(space.name).replace(/\s+\d+$/, '');
  }

  function getSpaceTerrain(space) {
    const terrainOverride = space ? REGION_TERRAIN_OVERRIDES_BY_INDEX.get(space.index) : null;
    if (terrainOverride) {
      return terrainOverride;
    }

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
    return terrainCode ? `${growth}${terrainCode}` : String(growth);
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

  function normalizeNationForVp(nationName) {
    if (!nationName) {
      return '';
    }

    const ai = getAiEngine();
    if (ai && typeof ai.normalizeNationName === 'function') {
      return ai.normalizeNationName(nationName);
    }

    if (nationName === 'Assyrria') {
      return 'Assyria';
    }

    return nationName;
  }

  function getNationObjectiveProfile(nationName) {
    const ai = getAiEngine();
    if (!ai || typeof ai.getObjectiveProfile !== 'function') {
      return null;
    }

    return ai.getObjectiveProfile(nationName);
  }

  function resolveObjectiveSpaceName(spaceName) {
    if (!spaceName) {
      return '';
    }

    const names = new Set(detectedSpaces.map((space) => space.name));
    if (names.has(spaceName)) {
      return spaceName;
    }

    const ai = getAiEngine();
    if (ai && typeof ai.resolveSpaceName === 'function') {
      return ai.resolveSpaceName(spaceName, names) || '';
    }

    return '';
  }

  function addVp(nationName, points, type, label, turn, scoreKey = '') {
    const nation = normalizeNationForVp(nationName);
    const parsedPoints = sanitizeInteger(points, -9999, 9999, 0);
    if (!nation || !parsedPoints) {
      return false;
    }

    if (scoreKey) {
      if (state.vpScoredKeys.includes(scoreKey)) {
        return false;
      }
      state.vpScoredKeys = [...state.vpScoredKeys, scoreKey];
    }

    state.vpByNation[nation] = (state.vpByNation[nation] || 0) + parsedPoints;
    state.vpLog.push({
      id: `${Date.now()}|${nation}|${type}|${Math.random().toString(36).slice(2, 8)}`,
      key: scoreKey,
      nation,
      points: parsedPoints,
      turn: sanitizeInteger(turn, 0, TOTAL_TURNS, 0),
      type,
      label: String(label || '').trim()
    });

    return true;
  }

  function getControlledRegionCountsByNation() {
    const controlled = getControlledSpacesByNation();
    const counts = {};

    controlled.forEach((spaceIds, nationName) => {
      const normalizedNation = normalizeNationForVp(nationName);
      counts[normalizedNation] = (counts[normalizedNation] || 0) + spaceIds.length;
    });

    return counts;
  }

  function getControlledSpacesByNationNormalized() {
    const controlled = getControlledSpacesByNation();
    const normalized = new Map();

    controlled.forEach((spaceIds, nationName) => {
      const normalizedNation = normalizeNationForVp(nationName);
      if (!normalized.has(normalizedNation)) {
        normalized.set(normalizedNation, []);
      }

      normalized.get(normalizedNation).push(...spaceIds);
    });

    return normalized;
  }

  function nationControlsObjectiveSpace(nationName, targetSpaceName, normalizedControlledSpaces) {
    const nationSpaceIds = normalizedControlledSpaces.get(normalizeNationForVp(nationName)) || [];
    return nationSpaceIds.some((spaceId) => {
      const space = spacesById.get(spaceId);
      return space && getSpaceBaseName(space) === targetSpaceName;
    });
  }

  function updateVpSeenNations() {
    const seen = new Set(state.vpSeenNations || []);
    state.units.forEach((unit) => {
      const nation = normalizeNationForVp(getUnitNation(unit));
      const unitType = unitTypeById.get(unit.unitTypeId);
      if (!nation || !unitType || isLeaderUnitType(unitType)) {
        return;
      }

      seen.add(nation);
    });

    state.vpSeenNations = Array.from(seen).sort();
  }

  function recordVpNationTurnBaseline() {
    const counts = getControlledRegionCountsByNation();
    const keyPrefix = `${state.currentTurn}:${state.currentNationIndex}`;
    getActiveNationNames().forEach((nationName) => {
      const normalizedNation = normalizeNationForVp(nationName);
      const key = `${keyPrefix}|${normalizedNation}`;
      if (Object.prototype.hasOwnProperty.call(state.vpNationTurnBaseline, key)) {
        return;
      }

      state.vpNationTurnBaseline[key] = counts[normalizedNation] || 0;
    });
  }

  function scorePersistentControlObjectives(turn) {
    const normalizedControlledSpaces = getControlledSpacesByNationNormalized();

    VP_OBJECTIVE_NATIONS.forEach((nationName) => {
      const profile = getNationObjectiveProfile(nationName);
      if (!profile || !profile.controlSpaces) {
        return;
      }

      Object.entries(profile.controlSpaces).forEach(([objectiveSpaceName, points]) => {
        const resolvedSpaceName = resolveObjectiveSpaceName(objectiveSpaceName);
        if (!resolvedSpaceName) {
          return;
        }

        if (!nationControlsObjectiveSpace(nationName, resolvedSpaceName, normalizedControlledSpaces)) {
          return;
        }

        addVp(
          nationName,
          points,
          'objective-control',
          `${nationName} controls ${resolvedSpaceName}`,
          turn,
          `objective|control|${normalizeNationForVp(nationName)}|${resolvedSpaceName}`
        );
      });
    });
  }

  function scoreLeaderObjectivesForCurrentTurn(turn) {
    const normalizedControlledSpaces = getControlledSpacesByNationNormalized();

    VP_OBJECTIVE_NATIONS.forEach((nationName) => {
      const profile = getNationObjectiveProfile(nationName);
      const leaderObjectives = profile && profile.leaderObjectivesByTurn
        ? profile.leaderObjectivesByTurn[turn]
        : null;
      if (!leaderObjectives || !leaderObjectives.controlSpaces) {
        return;
      }

      Object.entries(leaderObjectives.controlSpaces).forEach(([objectiveSpaceName, points]) => {
        const resolvedSpaceName = resolveObjectiveSpaceName(objectiveSpaceName);
        if (!resolvedSpaceName) {
          return;
        }

        if (!nationControlsObjectiveSpace(nationName, resolvedSpaceName, normalizedControlledSpaces)) {
          return;
        }

        addVp(
          nationName,
          points,
          'objective-leader',
          `${nationName} leader objective at Turn ${turn}: ${resolvedSpaceName}`,
          turn,
          `objective|leader|${normalizeNationForVp(nationName)}|turn:${turn}|${resolvedSpaceName}`
        );
      });
    });
  }

  function scoreEliminationObjectives(turn) {
    VP_OBJECTIVE_NATIONS.forEach((nationName) => {
      const profile = getNationObjectiveProfile(nationName);
      if (!profile || !profile.eliminateNations) {
        return;
      }

      Object.entries(profile.eliminateNations).forEach(([targetNation, points]) => {
        const normalizedTarget = normalizeNationForVp(targetNation);
        if (!state.vpSeenNations.includes(normalizedTarget)) {
          return;
        }

        if (getUnitCountByNation(normalizedTarget) > 0) {
          return;
        }

        addVp(
          nationName,
          points,
          'objective-eliminate',
          `${nationName} eliminated ${normalizedTarget}`,
          turn,
          `objective|eliminate|${normalizeNationForVp(nationName)}|${normalizedTarget}`
        );
      });
    });
  }

  function scoreReplaceControlObjectivesForActiveNation(turn) {
    const counts = getControlledRegionCountsByNation();
    const keyPrefix = `${state.currentTurn}:${state.currentNationIndex}`;

    getActiveNationNames().forEach((nationName) => {
      const normalizedNation = normalizeNationForVp(nationName);
      const profile = getNationObjectiveProfile(normalizedNation);
      if (!profile || !profile.replaceControl) {
        return;
      }

      const baselineKey = `${keyPrefix}|${normalizedNation}`;
      const baseline = state.vpNationTurnBaseline[baselineKey] || 0;
      const gained = (counts[normalizedNation] || 0) - baseline;
      if (gained < profile.replaceControl) {
        return;
      }

      addVp(
        normalizedNation,
        profile.replaceControl,
        'objective-replace',
        `${normalizedNation} replaced ${profile.replaceControl} region${profile.replaceControl === 1 ? '' : 's'} this turn`,
        turn,
        `objective|replace|${normalizedNation}`
      );
    });
  }

  function scoreSurvivalObjectives(turn) {
    VP_OBJECTIVE_NATIONS.forEach((nationName) => {
      const profile = getNationObjectiveProfile(nationName);
      if (!profile || !profile.surviveToTurn) {
        return;
      }

      const thresholdTurn = sanitizeInteger(profile.surviveToTurn.turn, 1, TOTAL_TURNS, 0);
      if (turn < thresholdTurn) {
        return;
      }

      if (getUnitCountByNation(normalizeNationForVp(nationName)) <= 0) {
        return;
      }

      addVp(
        nationName,
        profile.surviveToTurn.points,
        'objective-survive',
        `${nationName} survived to Turn ${thresholdTurn}`,
        turn,
        `objective|survive|${normalizeNationForVp(nationName)}`
      );
    });
  }

  function awardRegionVpForTurn(turn) {
    const normalizedTurn = sanitizeInteger(turn, 1, TOTAL_TURNS, 0);
    if (!normalizedTurn || state.vpRegionAwardedTurns.includes(normalizedTurn)) {
      return;
    }

    const regionCounts = getControlledRegionCountsByNation();
    Object.entries(regionCounts).forEach(([nationName, count]) => {
      const points = sanitizeInteger(count, 0, 9999, 0);
      if (points <= 0) {
        return;
      }

      addVp(
        nationName,
        points,
        'region-turn',
        `${nationName} region VP at end of Turn ${normalizedTurn}`,
        normalizedTurn,
        `region|${normalizedTurn}|${nationName}`
      );
    });

    state.vpRegionAwardedTurns = [...state.vpRegionAwardedTurns, normalizedTurn].sort((a, b) => a - b);
  }

  function getVpBreakdownByNation() {
    const breakdown = {};

    state.vpLog.forEach((entry) => {
      const nation = normalizeNationForVp(entry.nation);
      if (!breakdown[nation]) {
        breakdown[nation] = {
          region: 0,
          objective: 0,
          total: 0
        };
      }

      const points = sanitizeInteger(entry.points, -9999, 9999, 0);
      if (entry.type === 'region-turn') {
        breakdown[nation].region += points;
      } else {
        breakdown[nation].objective += points;
      }
      breakdown[nation].total += points;
    });

    return breakdown;
  }

  function getVpByNationAndTurn() {
    const matrix = {};

    state.vpLog.forEach((entry) => {
      const nation = normalizeNationForVp(entry.nation);
      const turn = sanitizeInteger(entry.turn, 0, TOTAL_TURNS, 0);
      if (!nation || turn <= 0) {
        return;
      }

      if (!matrix[nation]) {
        matrix[nation] = {};
      }

      matrix[nation][turn] = (matrix[nation][turn] || 0) + sanitizeInteger(entry.points, -9999, 9999, 0);
    });

    return matrix;
  }

  function updateVpUi() {
    if (!vpSummaryLabel || !vpTable) {
      return;
    }

    const entries = Object.entries(state.vpByNation || {})
      .map(([nationName, points]) => [nationName, sanitizeInteger(points, -9999, 9999, 0)])
      .sort((first, second) => {
        if (second[1] !== first[1]) {
          return second[1] - first[1];
        }

        return first[0].localeCompare(second[0]);
      });

    if (!entries.length) {
      vpSummaryLabel.textContent = 'VP: no points yet';
      vpTable.innerHTML = '<p class="vp-log-hint">No VP has been scored yet.</p>';
      return;
    }

    const leaderLine = entries
      .slice(0, 3)
      .map(([nationName, points]) => `${nationName} ${points}`)
      .join(' | ');
    vpSummaryLabel.textContent = `VP Leaders: ${leaderLine}`;

    const breakdown = getVpBreakdownByNation();
    const listItems = entries
      .map(([nationName, total]) => {
        const byNation = breakdown[nationName] || { region: 0, objective: 0 };
        return `<li>${nationName}: ${total} VP (Regions ${byNation.region}, Objectives ${byNation.objective})</li>`;
      })
      .join('');

    const vpByTurn = getVpByNationAndTurn();
    const tableHeadTurns = Array.from({ length: TOTAL_TURNS }, (_, index) => `<th>T${index + 1}</th>`).join('');
    const tableRows = entries
      .map(([nationName, total]) => {
        const turnCells = Array.from({ length: TOTAL_TURNS }, (_, index) => {
          const turn = index + 1;
          const points = vpByTurn[nationName] ? vpByTurn[nationName][turn] || 0 : 0;
          const sign = points > 0 ? '+' : '';
          return `<td>${sign}${points}</td>`;
        }).join('');

        return `<tr><th scope="row">${nationName}</th>${turnCells}<td><strong>${total}</strong></td></tr>`;
      })
      .join('');

    const lastAward = state.vpLog[state.vpLog.length - 1];
    const hint = lastAward
      ? `Last award: Turn ${lastAward.turn} - ${lastAward.nation} ${lastAward.points > 0 ? '+' : ''}${lastAward.points} (${lastAward.label}).`
      : 'No awards yet.';

    vpTable.innerHTML = `<ol class="vp-standings">${listItems}</ol><div class="vp-turn-history-wrap"><table class="vp-turn-history"><thead><tr><th>Nation</th>${tableHeadTurns}<th>Total</th></tr></thead><tbody>${tableRows}</tbody></table></div><p class="vp-log-hint">${hint}</p>`;
  }

  function getEligibleGrowthPlacementSpaces(nationName, options = {}) {
    const { requireNonHill = false } = options;
    const controlledSpaces = getControlledSpacesByNation().get(nationName) || [];
    const preferredSpaces = controlledSpaces
      .map((spaceId) => spacesById.get(spaceId))
      .filter(Boolean)
      .filter((space) => (requireNonHill ? !isHillSpace(space) : true))
      .sort((first, second) => {
        const growthDifference = getSpaceGrowthValue(second) - getSpaceGrowthValue(first);
        if (growthDifference !== 0) {
          return growthDifference;
        }

        return first.index - second.index;
      });

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

    return deduped.sort((first, second) => {
      const growthDifference = getSpaceGrowthValue(second) - getSpaceGrowthValue(first);
      if (growthDifference !== 0) {
        return growthDifference;
      }

      return first.index - second.index;
    });
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
      if (phase.id === 'growth') {
        const growthStats = getActiveNationGrowthDisplayStats();
        currentPhaseLabel.textContent = `${phase.label} Growth points: ${growthStats.excess} Regions: ${growthStats.regionCount} Total growth points: ${growthStats.totalGrowthPoints} Units added: ${growthStats.unitsAdded}`;
      } else {
        currentPhaseLabel.textContent = phase.label;
      }
    }

    if (phaseHelpLabel) {
      phaseHelpLabel.textContent = state.gameComplete
        ? 'The ninth turn is complete.'
        : phase.helpText;
    }

    const currentNation = NATION_ORDER[state.currentNationIndex] || NATION_ORDER[0];
    if (currentNationLabel) {
      currentNationLabel.textContent = currentNation.label;
    }

    const isLastNationLastTurn =
      state.currentTurn === TOTAL_TURNS &&
      state.currentNationIndex === NATION_ORDER.length - 1 &&
      phase.id === 'end';

    if (nextPhaseButton) {
      const nextPlayable = phase.id === 'end'
        ? findNextPlayableNationTurn(state.currentTurn, state.currentNationIndex)
        : null;
      nextPhaseButton.disabled = state.gameComplete;
      nextPhaseButton.textContent = state.gameComplete
        ? 'Game Complete'
        : isLastNationLastTurn
          ? 'Finish Game'
          : phase.id === 'end'
            ? nextPlayable
              ? `Advance to ${NATION_ORDER[nextPlayable.nationIndex].label} Turn`
              : 'Finish Game'
            : phase.nextLabel;
    }

    if (skipTurnButton) {
      skipTurnButton.disabled = state.gameComplete;
      skipTurnButton.textContent = state.gameComplete ? 'Game Complete' : 'Skip Turn';
    }

    updateVpUi();
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

  function isGarrisonRequired(spaceId, nation) {
    if (!spaceId || !nation) {
      return false;
    }

    const space = spacesById.get(spaceId);
    if (space && getSpaceGrowthValue(space) <= 0) {
      return false;
    }

    return state.requiredGarrisons.some((entry) => entry.spaceId === spaceId && entry.nation === nation);
  }

  function markGarrisonRequired(spaceId, nation) {
    if (!spaceId || !nation || isGarrisonRequired(spaceId, nation)) {
      return;
    }

    const space = spacesById.get(spaceId);
    if (space && getSpaceGrowthValue(space) <= 0) {
      return;
    }

    state.requiredGarrisons.push({ spaceId, nation });
  }

  function cleanGarrisonRequirements() {
    state.requiredGarrisons = state.requiredGarrisons.filter((entry) => {
      if (!entry.spaceId || !entry.nation || !spacesById.has(entry.spaceId)) {
        return false;
      }

      const space = spacesById.get(entry.spaceId);
      if (space && getSpaceGrowthValue(space) <= 0) {
        return false;
      }

      return getUnitsInSpace(entry.spaceId).some((unit) => {
        if (getUnitNation(unit) !== entry.nation) {
          return false;
        }

        const unitType = unitTypeById.get(unit.unitTypeId);
        return isRegularUnitType(unitType);
      });
    });
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

  function getSingleDefenderNation(attackerNation, defenderUnits) {
    const defenderNations = new Set(
      defenderUnits
        .map((unit) => getUnitNation(unit))
        .filter((nation) => nation && nation !== attackerNation)
    );

    return defenderNations.size === 1 ? Array.from(defenderNations)[0] : '';
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
    const showNumericValue = Number.isFinite(value) && value > 6;
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

    if (showNumericValue) {
      const valueLabel = document.createElement('span');
      valueLabel.className = 'combat-die-value';
      valueLabel.textContent = String(value);
      if (value === 7) {
        valueLabel.classList.add('combat-die-value-seven');
      }
      die.appendChild(valueLabel);
    }

    return die;
  }

  function nationsAreSubmittedTogether(firstNation, secondNation) {
    if (!firstNation || !secondNation || firstNation === secondNation) {
      return false;
    }

    return state.vassalByNation[firstNation] === secondNation || state.vassalByNation[secondNation] === firstNation;
  }

  function nationsAreHostile(firstNation, secondNation) {
    if (!firstNation || !secondNation || firstNation === secondNation) {
      return false;
    }

    return !nationsAreSubmittedTogether(firstNation, secondNation);
  }

  function isFirstHebrewTurnProtectedNation(attackerNation, defenderNation) {
    if (state.currentTurn !== 1 || attackerNation !== 'Hebrew') {
      return false;
    }

    return defenderNation === 'Ammon' || defenderNation === 'Moab' || defenderNation === 'Edom';
  }

  function canNationAttackDefender(attackerNation, defenderNation) {
    if (!attackerNation || !defenderNation) {
      return false;
    }

    if (!nationsAreHostile(attackerNation, defenderNation)) {
      return false;
    }

    if (isFirstHebrewTurnProtectedNation(attackerNation, defenderNation)) {
      return false;
    }

    return true;
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

    const defenderUnits = getUnitsInSpace(spaceId).filter((unit) => {
      const nation = getUnitNation(unit);
      return canNationAttackDefender(attackerNation, nation);
    });

    if (!defenderUnits.length) {
      state.pendingCombats = state.pendingCombats.filter(
        (combat) => !(combat.spaceId === spaceId && combat.attackerNation === attackerNation)
      );
      return null;
    }

    let pendingCombat = state.pendingCombats.find(
      (combat) => combat.spaceId === spaceId && combat.attackerNation === attackerNation
    );

    if (!pendingCombat) {
      const singleDefenderNation = getSingleDefenderNation(attackerNation, defenderUnits);
      if (singleDefenderNation && canDefenderSubmit(singleDefenderNation, attackerNation)) {
        const shouldSubmit = window.confirm(
          `${singleDefenderNation} may submit to ${attackerNation}. Submit now and become a vassal?`
        );

        if (shouldSubmit) {
          applySubmission(singleDefenderNation, attackerNation);
          markGarrisonRequired(spaceId, attackerNation);
          setCombatStatus(`${singleDefenderNation} submitted to ${attackerNation}.`, 'success');
          return null;
        }
      }

      pendingCombat = {
        id: `${spaceId}|${attackerNation}|${Date.now()}`,
        spaceId,
        attackerNation,
        attackerEntries: [],
        defenderUnitIds: defenderUnits.map((unit) => unit.id),
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

    if (!Array.isArray(pendingCombat.defenderUnitIds)) {
      pendingCombat.defenderUnitIds = [];
    }
    if (!pendingCombat.defenderUnitIds.length) {
      pendingCombat.defenderUnitIds = defenderUnits.map((unit) => unit.id);
    }

    return pendingCombat;
  }

  function cleanPendingCombats() {
    state.pendingCombats = state.pendingCombats
      .map((combat) => {
        const filteredEntries = combat.attackerEntries.filter((entry) =>
          state.units.some((unit) => unit.id === entry.unitId && unit.spaceId === combat.spaceId)
        );
        const filteredDefenders = (Array.isArray(combat.defenderUnitIds) ? combat.defenderUnitIds : []).filter((unitId) =>
          state.units.some((unit) => unit.id === unitId && unit.spaceId === combat.spaceId)
        );

        return {
          ...combat,
          attackerEntries: filteredEntries,
          defenderUnitIds: filteredDefenders
        };
      })
      .filter((combat) => {
        const attackerPresent = getUnitsInSpace(combat.spaceId).some((unit) => getUnitNation(unit) === combat.attackerNation);
        const defenderPresent = getUnitsInSpace(combat.spaceId).some((unit) => {
          const nation = getUnitNation(unit);
          return nationsAreHostile(combat.attackerNation, nation);
        });
        return attackerPresent && defenderPresent;
      });

  }

  function getUnitCountByNation(nationName) {
    return state.units.reduce((count, unit) => {
      if (getUnitNation(unit) !== nationName) {
        return count;
      }

      const unitType = unitTypeById.get(unit.unitTypeId);
      return isLeaderUnitType(unitType) ? count : count + 1;
    }, 0);
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

    return getControlledRegionCountByNation(defenderNation) <= 1;
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

  function buildCombatDice(units, space, hasLeaderSupport = false) {
    const chariotEffects = [];
    const dice = units.flatMap((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      const terrainModifier = getTerrainCombatModifier(unitType, space);
      const isChariot = Boolean(unitType && unitType.classification === 'chariot');
      const rollCount = isChariot ? 2 : 1;

      return Array.from({ length: rollCount }, (_, rollIndex) => {
        const baseRoll = Math.floor(Math.random() * 6) + 1;
        const modifiedRoll = baseRoll + terrainModifier;
        const value = terrainModifier > 0 ? modifiedRoll : clampCombatDie(modifiedRoll);
        if (terrainModifier !== 0 && isChariot) {
          chariotEffects.push({
            unitName: unitType.displayName,
            before: baseRoll,
            after: value,
            modifier: terrainModifier,
            rollNumber: rollIndex + 1
          });
        }

        return {
          unitId: unit.id,
          unitName: unitType ? unitType.displayName : unit.label,
          value
        };
      });
    });

    let leaderEffect = null;

    const hasLeader = hasLeaderSupport || units.some((unit) => {
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
      const boostedDie = dice[highestIndex];
      const before = boostedDie.value;
      const after = before + 1;
      boostedDie.value = after;
      leaderEffect = {
        unitId: boostedDie.unitId,
        unitName: boostedDie.unitName,
        before,
        after
      };
    }

    const sortedDice = dice.sort((first, second) => second.value - first.value);
    sortedDice.leaderEffect = leaderEffect;
    sortedDice.chariotEffects = chariotEffects;
    return sortedDice;
  }

  function getCappedAttackerDiceUnits(attackerUnits, defenderCount) {
    if (!Array.isArray(attackerUnits) || !attackerUnits.length) {
      return [];
    }

      const maxAttackerDiceUnits = Math.max(1, defenderCount * 3);
    const nonLeaders = attackerUnits.filter((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      return !isLeaderUnitType(unitType);
    });

    if (nonLeaders.length) {
      return nonLeaders.slice(0, maxAttackerDiceUnits);
    }

    return [];
  }

  function getDiceRollingDefenderUnits(defenderUnits) {
    if (!Array.isArray(defenderUnits) || !defenderUnits.length) {
      return [];
    }

    const nonLeaders = defenderUnits.filter((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      return !isLeaderUnitType(unitType);
    });

    if (nonLeaders.length) {
      return nonLeaders;
    }

    return [];
  }

  function getCombatUnitCountExcludingLeaders(units) {
    if (!Array.isArray(units) || !units.length) {
      return 0;
    }

    return units.filter((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      return !isLeaderUnitType(unitType);
    }).length;
  }

  function getLeaderOnlyUnitIds(units) {
    if (!Array.isArray(units) || !units.length) {
      return [];
    }

    return units
      .filter((unit) => {
        const unitType = unitTypeById.get(unit.unitTypeId);
        return isLeaderUnitType(unitType);
      })
      .map((unit) => unit.id);
  }

  function removeLeaderOnlyNationsInCombatSpace(spaceId) {
    if (!spaceId) {
      return [];
    }

    const unitsInSpace = getUnitsInSpace(spaceId);
    if (!unitsInSpace.length) {
      return [];
    }

    const unitsByNation = new Map();
    unitsInSpace.forEach((unit) => {
      const nation = getUnitNation(unit);
      if (!nation) {
        return;
      }

      const nationUnits = unitsByNation.get(nation) || [];
      nationUnits.push(unit);
      unitsByNation.set(nation, nationUnits);
    });

    const removedNations = [];
    const removedUnitIds = [];
    unitsByNation.forEach((nationUnits, nation) => {
      if (!nationUnits.length) {
        return;
      }

      const nonLeaderCount = getCombatUnitCountExcludingLeaders(nationUnits);
      if (nonLeaderCount > 0) {
        return;
      }

      const leaderUnitIds = getLeaderOnlyUnitIds(nationUnits);
      if (!leaderUnitIds.length) {
        return;
      }

      removedNations.push(nation);
      removedUnitIds.push(...leaderUnitIds);
    });

    if (removedUnitIds.length) {
      removeUnitsById(removedUnitIds);
    }

    return removedNations;
  }

  function formatLeaderEffectMessage(sideLabel, leaderEffect) {
    if (!leaderEffect) {
      return '';
    }

    return `${sideLabel} leader bonus applied to ${leaderEffect.unitName}: ${leaderEffect.before} to ${leaderEffect.after}.`;
  }

  function formatChariotEffectsMessage(sideLabel, chariotEffects) {
    if (!Array.isArray(chariotEffects) || !chariotEffects.length) {
      return '';
    }

    const effectText = chariotEffects
      .map((effect) => {
        const direction = effect.modifier > 0 ? 'bonus' : 'penalty';
        const signedModifier = effect.modifier > 0 ? `+${effect.modifier}` : String(effect.modifier);
        const rollLabel = Number.isFinite(effect.rollNumber) ? ` roll ${effect.rollNumber}` : '';
        return `${effect.unitName}${rollLabel} ${direction} ${signedModifier} (${effect.before} to ${effect.after})`;
      })
      .join('; ');

    return `${sideLabel} chariot effects: ${effectText}.`;
  }

  function formatGroupedDice(values) {
    if (!Array.isArray(values) || !values.length) {
      return '';
    }

    const counts = new Map();
    values.forEach((value) => {
      const die = Number.isFinite(value) ? Math.round(value) : 0;
      if (die <= 0) {
        return;
      }
      counts.set(die, (counts.get(die) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((first, second) => second[0] - first[0])
      .map(([die, count]) => `${die}x${count}`)
      .join(' ');
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
      const casualtyPool = (() => {
        const nonLeaders = available.filter((unit) => {
          const unitType = unitTypeById.get(unit.unitTypeId);
          return !isLeaderUnitType(unitType);
        });
        return nonLeaders.length ? nonLeaders : available;
      })();

      const optionsText = casualtyPool
        .map((unit, index) => {
          const unitType = unitTypeById.get(unit.unitTypeId);
          const name = unitType ? unitType.displayName : unit.label;
          return `${index + 1}: ${name}`;
        })
        .join('\n');

      const choice = promptWithFallback(
        `${sideLabel} remove ${i + 1} of ${lossCount}. Enter option number:\n${optionsText}`,
        '1'
      );
      const parsed = Number.parseInt(String(choice || '1'), 10);
      const selectedIndex = Number.isFinite(parsed) ? parsed - 1 : 0;
      const casualty = casualtyPool[selectedIndex] || casualtyPool[0];
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
        attackerEntries: combat.attackerEntries.filter((entry) => !removed.has(entry.unitId)),
        defenderUnitIds: (Array.isArray(combat.defenderUnitIds) ? combat.defenderUnitIds : []).filter(
          (unitId) => !removed.has(unitId)
        )
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
      const choice = promptWithFallback(
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

  function resolveCombatRound(pendingCombat) {
    if (!pendingCombat) {
      return {
        resolved: false,
        reason: 'missing-combat',
        message: 'No pending combat was found for this space.',
        casualtiesRemoved: 0,
        casualtyMessage: '',
        attackerStillPresent: false,
        defendersStillPresent: false
      };
    }

    const { spaceId, attackerNation } = pendingCombat;
    const space = spacesById.get(spaceId);
    if (!space) {
      return {
        resolved: false,
        reason: 'missing-space',
        message: 'Combat could not resolve because the target space is invalid.',
        casualtiesRemoved: 0,
        casualtyMessage: '',
        attackerStillPresent: false,
        defendersStillPresent: false
      };
    }

    const attackerUnitIds = pendingCombat.attackerEntries
      .map((entry) => entry.unitId)
      .filter((unitId, index, ids) => unitId && ids.indexOf(unitId) === index);
    let attackerUnits = attackerUnitIds
      .map((unitId) => state.units.find((unit) => unit.id === unitId))
      .filter(
        (unit) =>
          unit &&
          unit.spaceId === spaceId &&
          getUnitNation(unit) === attackerNation
      );

    if (!attackerUnits.length) {
      attackerUnits = getUnitsInSpace(spaceId).filter((unit) => getUnitNation(unit) === attackerNation);
    }

    const defenderUnits = getUnitsInSpace(spaceId).filter((unit) => {
      const nation = getUnitNation(unit);
      return canNationAttackDefender(attackerNation, nation);
    });

    if (!attackerUnits.length || !defenderUnits.length) {
      return {
        resolved: false,
        reason: 'missing-combatants',
        message: 'Combat could not resolve because one side has no valid units in this space.',
        casualtiesRemoved: 0,
        casualtyMessage: '',
        hiddenDiceMessage: '',
        attackerStillPresent: attackerUnits.length > 0,
        defendersStillPresent: defenderUnits.length > 0
      };
    }

    const defenderNation = getDefenderNationName(attackerNation, defenderUnits);

    const defenderCombatUnitCount = getCombatUnitCountExcludingLeaders(defenderUnits);
    const attackerDiceUnits = getCappedAttackerDiceUnits(attackerUnits, defenderCombatUnitCount);
    const defenderDiceUnits = getDiceRollingDefenderUnits(defenderUnits);
    const attackerLeadersOnly = attackerUnits.length > 0 && !attackerDiceUnits.length;
    const defenderLeadersOnly = defenderUnits.length > 0 && !defenderDiceUnits.length;

    if (attackerLeadersOnly || defenderLeadersOnly) {
      const removedUnitIds = [
        ...(attackerLeadersOnly ? getLeaderOnlyUnitIds(attackerUnits) : []),
        ...(defenderLeadersOnly ? getLeaderOnlyUnitIds(defenderUnits) : [])
      ];
      const casualtiesRemoved = removedUnitIds.length;
      removeUnitsById(removedUnitIds);

      const attackerStillPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) === attackerNation);
      const defendersStillPresent = getUnitsInSpace(spaceId).some((unit) => {
        const nation = getUnitNation(unit);
        return nation && nation !== attackerNation;
      });

      const casualtyMessage = [
        attackerLeadersOnly ? `${attackerNation} leaders were removed because leaders cannot fight alone.` : '',
        defenderLeadersOnly ? `${defenderNation} leaders were removed because leaders cannot fight alone.` : ''
      ]
        .filter(Boolean)
        .join(' ');

      return {
        resolved: true,
        reason: 'leaders-removed',
        message: '',
        casualtiesRemoved,
        casualtyMessage,
        hiddenDiceMessage: '',
        attackerStillPresent,
        defendersStillPresent
      };
    }

    const attackerHasLeader = attackerUnits.some((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      return isLeaderUnitType(unitType);
    });
    const defenderHasLeader = defenderUnits.some((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      return isLeaderUnitType(unitType);
    });

    const attackerDice = buildCombatDice(attackerDiceUnits, space, attackerHasLeader);
    const defenderDice = buildCombatDice(defenderDiceUnits, space, defenderHasLeader);
    const roundLosses = resolveCombatDiceMatchups(attackerDice, defenderDice);
    const displayDiceCount = Math.min(attackerDice.length, defenderDice.length);
    const hiddenAttackerDice = attackerDice.slice(displayDiceCount).map((die) => die.value);
    const hiddenDefenderDice = defenderDice.slice(displayDiceCount).map((die) => die.value);
    const hiddenAttackerText = formatGroupedDice(hiddenAttackerDice);
    const hiddenDefenderText = formatGroupedDice(hiddenDefenderDice);
    const hiddenDiceMessage = [
      hiddenAttackerText ? `${attackerNation} hidden dice: ${hiddenAttackerText}.` : '',
      hiddenDefenderText ? `${defenderNation} hidden dice: ${hiddenDefenderText}.` : ''
    ]
      .filter(Boolean)
      .join(' ');

    const leaderEffectMessages = [
      formatLeaderEffectMessage(attackerNation, attackerDice.leaderEffect),
      formatLeaderEffectMessage(defenderNation, defenderDice.leaderEffect),
      formatChariotEffectsMessage(attackerNation, attackerDice.chariotEffects),
      formatChariotEffectsMessage(defenderNation, defenderDice.chariotEffects)
    ].filter(Boolean);

    const attackerCasualties = chooseCasualtyUnitIds(attackerUnits, roundLosses.attackerLosses, `${attackerNation} (attacker)`);
    const defenderCasualties = chooseCasualtyUnitIds(
      defenderUnits,
      roundLosses.defenderLosses,
      `${defenderNation} (defender)`
    );
    removeUnitsById([...attackerCasualties, ...defenderCasualties]);
    const leaderOnlyNationsRemoved = removeLeaderOnlyNationsInCombatSpace(spaceId);
    const leaderOnlyUnitsRemoved = leaderOnlyNationsRemoved.length;
    const casualtiesRemoved = attackerCasualties.length + defenderCasualties.length + leaderOnlyUnitsRemoved;

    const attackerStillPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) === attackerNation);
    const defendersStillPresent = getUnitsInSpace(spaceId).some((unit) => {
      const nation = getUnitNation(unit);
      return nation && nation !== attackerNation;
    });

    const roundSummaryMessage = casualtiesRemoved
      ? [
          `${casualtiesRemoved} unit${casualtiesRemoved === 1 ? '' : 's'} removed (${attackerNation} lost ${attackerCasualties.length}, ${defenderNation} lost ${defenderCasualties.length}).`,
          leaderOnlyNationsRemoved.length
            ? `${leaderOnlyNationsRemoved.join(' and ')} leader${leaderOnlyNationsRemoved.length === 1 ? ' was' : 's were'} removed because leader-only forces cannot remain after combat.`
            : '',
          ...leaderEffectMessages,
          hiddenDiceMessage
        ].join(' ')
      : [
          ...leaderEffectMessages,
          hiddenDiceMessage
        ]
          .filter(Boolean)
          .join(' ');

    combatDisplayBySpaceId.set(spaceId, {
      attackerNation,
      defenderNation,
      attackerUnitIds: attackerUnits.map((unit) => unit.id),
      defenderUnitIds: defenderUnits.map((unit) => unit.id),
      attackerDice: attackerDice.slice(0, displayDiceCount).map((die) => die.value),
      defenderDice: defenderDice.slice(0, displayDiceCount).map((die) => die.value),
      attackerLosses: roundLosses.attackerLosses,
      defenderLosses: roundLosses.defenderLosses
    });

    return {
      resolved: true,
      reason: 'resolved',
      message: '',
      casualtiesRemoved,
      hiddenDiceMessage,
      casualtyMessage: roundSummaryMessage,
      attackerStillPresent,
      defendersStillPresent
    };
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

    const activeNations = nations.filter((nation) => isNationActive(nation));
    if (!activeNations.length) {
      return null;
    }

    const attackerNation = activeNations[0];
    return ensurePendingCombat(spaceId, attackerNation, null);
  }

  function handleResolveCombatClick(spaceId) {
    let pendingCombat = getPendingCombatForSpace(spaceId);
    if (!pendingCombat) {
      pendingCombat = tryCreateManualPendingCombat(spaceId);
    }

    if (!pendingCombat) {
      setCombatStatus('No combat can be resolved here. Move attackers into an enemy space first.', 'error');
      return;
    }

    if (!isNationActive(pendingCombat.attackerNation)) {
      setCombatStatus(`${getActiveNationEntry().label} is the active nation. Only its attacks can be resolved now.`, 'error');
      return;
    }

    const blockedDefenderPresent = getUnitsInSpace(spaceId).some((unit) =>
      isFirstHebrewTurnProtectedNation(pendingCombat.attackerNation, getUnitNation(unit))
    );
    if (blockedDefenderPresent) {
      setCombatStatus('During the first Hebrew turn, Hebrew units may not attack Ammon, Moab, or Edom.', 'error', 6500);
      return;
    }

    const result = resolveCombatRound(pendingCombat);
    if (!result.resolved) {
      cleanPendingCombats();
      renderUnits();
      saveState();
      if (result.message) {
        setCombatStatus(result.message, 'error');
      }
      return;
    }

    if (result.reason === 'submission') {
      const resolvedCombatSpaceId = pendingCombat.spaceId;
      markGarrisonRequired(pendingCombat.spaceId, pendingCombat.attackerNation);
      cleanPendingCombats();
      renderUnits();
      saveState();
      setCombatStatus(result.message || 'The defender submitted.', 'success');

      if (result.casualtiesRemoved > 0 || result.hiddenDiceMessage) {
        showCombatNotice(
          result.casualtyMessage,
          () => {
            combatDisplayBySpaceId.delete(resolvedCombatSpaceId);
            renderUnits();
            saveState();
          },
          resolvedCombatSpaceId
        );
      }
      return;
    }

    const resolvedCombatSpaceId = pendingCombat.spaceId;

    const pendingCombatIndex = state.pendingCombats.findIndex((combat) => combat.id === pendingCombat.id);
    if (pendingCombatIndex >= 0) {
      state.pendingCombats[pendingCombatIndex].roundsResolved += 1;
      pendingCombat = state.pendingCombats[pendingCombatIndex];
    }

    if (!result.attackerStillPresent || !result.defendersStillPresent) {
      if (result.attackerStillPresent && !result.defendersStillPresent) {
        markGarrisonRequired(pendingCombat.spaceId, pendingCombat.attackerNation);
      }
      removePendingCombat(pendingCombat.id);
      setCombatStatus('Combat resolved. One side no longer has units in this space.', 'success');
    } else {
      setCombatStatus('Combat round resolved. You may resolve another round or withdraw.', 'success');
    }

    cleanPendingCombats();
    renderUnits();
    saveState();

    if (result.casualtiesRemoved > 0 || result.hiddenDiceMessage) {
      showCombatNotice(
        result.casualtyMessage,
        () => {
          combatDisplayBySpaceId.delete(resolvedCombatSpaceId);
          renderUnits();
          saveState();
        },
        resolvedCombatSpaceId
      );
    }
  }

  function handleWithdrawClick(spaceId) {
    const pendingCombat = getPendingCombatForSpace(spaceId);
    if (!pendingCombat) {
      return;
    }

    if (!isNationActive(pendingCombat.attackerNation)) {
      setCombatStatus(`${getActiveNationEntry().label} is the active nation. Only its attacks can withdraw now.`, 'error');
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

      const singleDefenderNation = getSingleDefenderNation(attackerNation, defenderUnits);
      if (singleDefenderNation && canDefenderSubmit(singleDefenderNation, attackerNation)) {
        const shouldSubmit = window.confirm(
          `${singleDefenderNation} can submit to ${attackerNation}. Submit now and become a vassal?`
        );
        if (shouldSubmit) {
          applySubmission(singleDefenderNation, attackerNation);
          markGarrisonRequired(spaceId, attackerNation);
          return { attackerRetreated: false, defenderSubmitted: true };
        }
      }

      const defenderCombatUnitCount = getCombatUnitCountExcludingLeaders(defenderUnits);
      const attackerDiceUnits = getCappedAttackerDiceUnits(attackerUnits, defenderCombatUnitCount);
      const defenderDiceUnits = getDiceRollingDefenderUnits(defenderUnits);
      const attackerLeadersOnly = attackerUnits.length > 0 && !attackerDiceUnits.length;
      const defenderLeadersOnly = defenderUnits.length > 0 && !defenderDiceUnits.length;

      if (attackerLeadersOnly || defenderLeadersOnly) {
        const removedUnitIds = [
          ...(attackerLeadersOnly ? getLeaderOnlyUnitIds(attackerUnits) : []),
          ...(defenderLeadersOnly ? getLeaderOnlyUnitIds(defenderUnits) : [])
        ];
        removeUnitsById(removedUnitIds);

        const attackerStillPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) === attackerNation);
        const defendersStillPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) !== attackerNation);
        if (attackerStillPresent && !defendersStillPresent) {
          markGarrisonRequired(spaceId, attackerNation);
        }

        return { attackerRetreated: false, defenderSubmitted: false };
      }

      const attackerHasLeader = attackerUnits.some((unit) => {
        const unitType = unitTypeById.get(unit.unitTypeId);
        return isLeaderUnitType(unitType);
      });
      const defenderHasLeader = defenderUnits.some((unit) => {
        const unitType = unitTypeById.get(unit.unitTypeId);
        return isLeaderUnitType(unitType);
      });

      const attackerDice = buildCombatDice(attackerDiceUnits, space, attackerHasLeader);
      const defenderDice = buildCombatDice(defenderDiceUnits, space, defenderHasLeader);
      const roundLosses = resolveCombatDiceMatchups(attackerDice, defenderDice);

      const attackerCasualties = chooseCasualtyUnitIds(attackerUnits, roundLosses.attackerLosses, `${attackerNation} (attacker)`);
      const defenderCasualties = chooseCasualtyUnitIds(defenderUnits, roundLosses.defenderLosses, 'Defender');
      removeUnitsById([...attackerCasualties, ...defenderCasualties]);
      removeLeaderOnlyNationsInCombatSpace(spaceId);

      const attackerStillPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) === attackerNation);
      const defendersStillPresent = getUnitsInSpace(spaceId).some((unit) => getUnitNation(unit) !== attackerNation);
      if (!attackerStillPresent || !defendersStillPresent) {
        if (attackerStillPresent && !defendersStillPresent) {
          markGarrisonRequired(spaceId, attackerNation);
        }
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

  function hasLeaderOnBoard(nationEntry = null) {
    const nations = nationEntry && nationEntry.nations instanceof Set ? nationEntry.nations : null;

    return state.units.some((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      if (!isLeaderUnitType(unitType)) {
        return false;
      }

      if (!nations) {
        return true;
      }

      return nations.has(getUnitNation(unit));
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

  function getCurrentGrowthTurnKey() {
    return `${state.currentTurn}:${state.currentNationIndex}`;
  }

  function getActiveNationNames() {
    const activeNationEntry = getActiveNationEntry();
    if (!activeNationEntry || !activeNationEntry.nations) {
      return [];
    }

    return Array.from(activeNationEntry.nations);
  }

  function getActiveNationGrowthExcess() {
    let maxExcess = 0;
    for (const nationName of getActiveNationNames()) {
      const growthPoints = state.growthPointsByNation[nationName];
      if (growthPoints && Number.isFinite(growthPoints.unit)) {
        maxExcess = Math.max(maxExcess, Math.max(0, growthPoints.unit));
      }
    }

    return maxExcess;
  }

  function getActiveNationGrowthDisplayStats() {
    const growthTurnKey = getCurrentGrowthTurnKey();
    const savedSummary = state.growthSummaryByTurnKey[growthTurnKey];
    const activeNationNames = getActiveNationNames();
    const controlledSpacesByNation = getControlledSpacesByNation();
    const landPointsByNation = getLandPointsByNation();
    const regionCount = savedSummary
      ? savedSummary.regionCount
      : activeNationNames.reduce((sum, nationName) => sum + (controlledSpacesByNation.get(nationName) || []).length, 0);
    const totalGrowthPoints = savedSummary
      ? savedSummary.totalGrowthPoints
      : activeNationNames.reduce((sum, nationName) => sum + (landPointsByNation[nationName] || 0), 0);

    return {
      excess: getActiveNationGrowthExcess(),
      regionCount,
      totalGrowthPoints,
      unitsAdded: savedSummary ? savedSummary.unitsAdded : 0
    };
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

  function getGrowthPlacementSpaceWithinCap(placementSpaces, addedUnitsBySpaceId) {
    let lowestAddedCount = Number.POSITIVE_INFINITY;

    for (const space of placementSpaces) {
      const growthCap = getSpaceGrowthValue(space);
      if (growthCap <= 0) {
        continue;
      }

      const addedSoFar = addedUnitsBySpaceId.get(space.id) || 0;
      if (addedSoFar < growthCap) {
        lowestAddedCount = Math.min(lowestAddedCount, addedSoFar);
      }
    }

    if (!Number.isFinite(lowestAddedCount)) {
      return null;
    }

    for (const space of placementSpaces) {
      const growthCap = getSpaceGrowthValue(space);
      if (growthCap <= 0) {
        continue;
      }

      const addedSoFar = addedUnitsBySpaceId.get(space.id) || 0;
      if (addedSoFar === lowestAddedCount && addedSoFar < growthCap) {
        return space;
      }
    }

    return null;
  }

  function recordGrowthPlacement(spaceId, addedUnitsBySpaceId) {
    const currentCount = addedUnitsBySpaceId.get(spaceId) || 0;
    addedUnitsBySpaceId.set(spaceId, currentCount + 1);
  }

  function applyGrowthForCurrentTurn() {
    const growthTurnKey = getCurrentGrowthTurnKey();
    if (state.processedGrowthTurnKeys.includes(growthTurnKey)) {
      return;
    }

    const controlledSpacesByNation = getControlledSpacesByNation();
    const landPointsByNation = getLandPointsByNation();
    const spawnedUnits = [];
    const addedUnitsBySpaceId = new Map();
    const activeNations = getActiveNationNames();
    const regionCount = activeNations.reduce(
      (sum, nationName) => sum + (controlledSpacesByNation.get(nationName) || []).length,
      0
    );
    const totalGrowthPoints = activeNations.reduce(
      (sum, nationName) => sum + (landPointsByNation[nationName] || 0),
      0
    );

    activeNations.forEach((nationName) => {
      const landPoints = landPointsByNation[nationName] || 0;
      if (!canNationReceiveGrowth(nationName) || !Number.isFinite(landPoints)) {
        return;
      }

      const growthPoints = ensureNationGrowthPoints(nationName);
      if (landPoints > 0) {
        growthPoints.unit += landPoints;
      }

      const unitType = getNationUnitTypeForGrowth(nationName, 'standard');
      while (unitType && growthPoints.unit >= UNIT_GROWTH_THRESHOLD) {
        const placementSpaces = getEligibleGrowthPlacementSpaces(nationName, { requireNonHill: false });
        if (!placementSpaces.length) {
          break;
        }

        const placementSpace = getGrowthPlacementSpaceWithinCap(placementSpaces, addedUnitsBySpaceId);
        if (!placementSpace) {
          break;
        }

        spawnedUnits.push(createGrowthUnit(unitType, placementSpace));
        recordGrowthPlacement(placementSpace.id, addedUnitsBySpaceId);
        growthPoints.unit -= UNIT_GROWTH_THRESHOLD;
      }
    });

    if (spawnedUnits.length) {
      state.units.push(...spawnedUnits);
      syncUnitCounts();
    }

    state.growthSummaryByTurnKey[growthTurnKey] = {
      regionCount,
      totalGrowthPoints,
      unitsAdded: spawnedUnits.length
    };
    state.processedGrowthTurnKeys = [...state.processedGrowthTurnKeys, growthTurnKey];
  }

  function ensureLeaderForCurrentTurn() {
    const phase = getCurrentPhase();
    if (state.gameComplete || phase.id !== 'growth') {
      return;
    }

    const scheduledLeader = getScheduledLeaderSpec(state.currentTurn);
    if (!scheduledLeader || state.spawnedLeaderTurns.includes(state.currentTurn)) {
      return;
    }

    if (!isNationActive(scheduledLeader.nation)) {
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

    if (!isNationActive('Philistia')) {
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
      const enemyPresent = getUnitsInSpace(spaceId).some((unit) => nationsAreHostile(nation, getUnitNation(unit)));
      if (enemyPresent) {
        ensurePendingCombat(spaceId, nation, null);
      }
    });

    state.pendingEntryCombatUnitIds = [];
  }

  function applyEndPhaseCleanup() {
    const filteredUnits = state.units.filter((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      const unitNation = getUnitNation(unit);
      const belongsToActiveNation = isNationActive(unitNation);
      if (!belongsToActiveNation) {
        return true;
      }

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
    updateVpSeenNations();
    evaluateVassalBreakFree();
    cleanPendingCombats();
    cleanGarrisonRequirements();

    if (phase.id === 'end') {
      applyEndPhaseCleanup();
      return;
    }

    ensureLeaderForCurrentTurn();
    ensureTurnThreePhilistiaReinforcements();

    if (phase.id === 'growth') {
      applyGrowthForCurrentTurn();
    }

    if (phase.id === 'action') {
      resolvePendingEntryCombatBeforeMovement();
    }
  }

  function stepTurnPhase() {
    if (state.gameComplete) {
      return false;
    }

    const phase = getCurrentPhase();

    if (phase.id === 'growth') {
      state.currentPhaseIndex = 1;
      resolvePendingEntryCombatBeforeMovement();
      recordVpNationTurnBaseline();
    } else if (phase.id === 'action') {
      scoreReplaceControlObjectivesForActiveNation(state.currentTurn);
      scoreLeaderObjectivesForCurrentTurn(state.currentTurn);
      scorePersistentControlObjectives(state.currentTurn);
      scoreEliminationObjectives(state.currentTurn);
      state.currentPhaseIndex = 2;
    } else {
      scorePersistentControlObjectives(state.currentTurn);
      scoreEliminationObjectives(state.currentTurn);

      // End phase complete: advance to next playable nation, skipping nations with no non-leader units.
      let nextPlayable = findNextPlayableNationTurn(state.currentTurn, state.currentNationIndex);
      if (
        !state.hebrewDivisionResolved &&
        state.currentTurn === HEBREW_DIVISION_TRIGGER_TURN &&
        (!nextPlayable || nextPlayable.turn > state.currentTurn)
      ) {
        applyHebrewDivision();
        scorePersistentControlObjectives(state.currentTurn);
        scoreEliminationObjectives(state.currentTurn);
        nextPlayable = findNextPlayableNationTurn(state.currentTurn, state.currentNationIndex);
      }

      if (!nextPlayable || nextPlayable.turn > state.currentTurn) {
        awardRegionVpForTurn(state.currentTurn);
        scoreSurvivalObjectives(state.currentTurn);
      }

      if (nextPlayable) {
        state.currentTurn = nextPlayable.turn;
        state.currentNationIndex = nextPlayable.nationIndex;
        state.currentPhaseIndex = 0;
        state.activatedUnitIds = [];
        state.retreatedUnitIds = [];
      } else if (state.currentTurn >= TOTAL_TURNS) {
        state.gameComplete = true;
      } else {
        // No playable nation remains between current position and final turn.
        state.gameComplete = true;
      }
    }

    return true;
  }

  function finalizeTurnPhaseAdvance() {
    syncTurnState();
    renderUnits();
    updateTurnPhaseUi();
    saveState();
  }

  function advanceTurnPhase() {
    if (!stepTurnPhase()) {
      return;
    }

    finalizeTurnPhaseAdvance();
  }

  function skipTurn() {
    if (state.gameComplete) {
      return;
    }

    const startingTurn = state.currentTurn;
    const startingNationIndex = state.currentNationIndex;

    while (!state.gameComplete) {
      const advanced = stepTurnPhase();
      if (!advanced) {
        break;
      }

      if (state.currentTurn !== startingTurn || state.currentNationIndex !== startingNationIndex) {
        break;
      }
    }

    finalizeTurnPhaseAdvance();
  }

  function getAiEngine() {
    const engine = window.KocNationAI;
    if (!engine || typeof engine.getNationObjectives !== 'function') {
      return null;
    }

    return engine;
  }

  function getFriendlySupportNearSpace(spaceId, nationName) {
    if (!spaceId || !nationName) {
      return 0;
    }

    const space = spacesById.get(spaceId);
    if (!space) {
      return 0;
    }

    const nearbySpaceIds = new Set([spaceId]);
    const neighbors = adjacentSpaceLookup.get(space.index) || new Set();
    neighbors.forEach((neighborIndex) => {
      const neighbor = findSpaceByIndex(neighborIndex);
      if (neighbor) {
        nearbySpaceIds.add(neighbor.id);
      }
    });

    return state.units.reduce((count, unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      if (!unitType || isLeaderUnitType(unitType)) {
        return count;
      }

      return nearbySpaceIds.has(unit.spaceId) && getUnitNation(unit) === nationName
        ? count + 1
        : count;
    }, 0);
  }

  function moveUnitByAi(unit, targetSpace) {
    if (!unit || !targetSpace || !canUnitMoveToSpace(unit, targetSpace)) {
      return false;
    }

    const movingNation = getUnitNation(unit);
    const unitType = unitTypeById.get(unit.unitTypeId);
    if (!movingNation || isLeaderUnitType(unitType)) {
      return false;
    }

    const originSpaceId = unit.spaceId && spacesById.has(unit.spaceId) ? unit.spaceId : '';
    if (originSpaceId && originSpaceId !== targetSpace.id && isGarrisonRequired(originSpaceId, movingNation)) {
      const nationUnitsAtOrigin = getUnitsInSpace(originSpaceId).filter(
        (candidate) => getUnitNation(candidate) === movingNation
      );
      if (nationUnitsAtOrigin.length <= 1) {
        return false;
      }
    }

    const blockedEnemyPresent = getUnitsInSpace(targetSpace.id).some((occupant) =>
      isFirstHebrewTurnProtectedNation(movingNation, getUnitNation(occupant))
    );
    if (blockedEnemyPresent) {
      return false;
    }

    const targetWasEmpty = getUnitsInSpace(targetSpace.id).length === 0;
    snapUnitToSpace(unit, targetSpace);

    if (targetWasEmpty) {
      markGarrisonRequired(targetSpace.id, movingNation);
    }

    const activatedSet = new Set(state.activatedUnitIds);
    activatedSet.add(unit.id);
    state.activatedUnitIds = Array.from(activatedSet);

    const enemyPresent = getUnitsInSpace(targetSpace.id).some(
      (occupant) => canNationAttackDefender(movingNation, getUnitNation(occupant))
    );

    if (enemyPresent) {
      const originalConfirm = window.confirm;
      window.confirm = () => true;
      try {
        ensurePendingCombat(targetSpace.id, movingNation, {
          unitId: unit.id,
          originSpaceId: originSpaceId || targetSpace.id
        });
      } finally {
        window.confirm = originalConfirm;
      }
    }

    return true;
  }

  function tryAiSubmission(pendingCombat) {
    if (!pendingCombat) {
      return false;
    }

    const defenderUnits = getUnitsInSpace(pendingCombat.spaceId).filter((unit) => {
      const nation = getUnitNation(unit);
      return canNationAttackDefender(pendingCombat.attackerNation, nation);
    });
    const defenderNation = getSingleDefenderNation(pendingCombat.attackerNation, defenderUnits);
    if (!defenderNation || !canDefenderSubmit(defenderNation, pendingCombat.attackerNation)) {
      return false;
    }

    applySubmission(defenderNation, pendingCombat.attackerNation);
    markGarrisonRequired(pendingCombat.spaceId, pendingCombat.attackerNation);
    removePendingCombat(pendingCombat.id);
    return true;
  }

  function getNationCombatStrength(spaceId, nationName) {
    const units = getUnitsInSpace(spaceId).filter((unit) => getUnitNation(unit) === nationName);
    let combatUnits = 0;
    let leaders = 0;
    units.forEach((unit) => {
      const unitType = unitTypeById.get(unit.unitTypeId);
      if (!unitType) {
        return;
      }

      if (isLeaderUnitType(unitType)) {
        leaders += 1;
      } else {
        combatUnits += 1;
      }
    });

    return { combatUnits, leaders };
  }

  function resolvePendingCombatByAi(pendingCombat) {
    if (!pendingCombat) {
      return;
    }

    if (tryAiSubmission(pendingCombat)) {
      cleanPendingCombats();
      return;
    }

    const result = resolveCombatRound(pendingCombat);
    if (!result.resolved) {
      cleanPendingCombats();
      return;
    }

    const pendingCombatIndex = state.pendingCombats.findIndex((combat) => combat.id === pendingCombat.id);
    if (pendingCombatIndex >= 0) {
      state.pendingCombats[pendingCombatIndex].roundsResolved += 1;
      pendingCombat = state.pendingCombats[pendingCombatIndex];
    }

    if (!result.attackerStillPresent || !result.defendersStillPresent) {
      if (result.attackerStillPresent && !result.defendersStillPresent) {
        markGarrisonRequired(pendingCombat.spaceId, pendingCombat.attackerNation);
      }
      removePendingCombat(pendingCombat.id);
    }

    cleanPendingCombats();
  }

  function runAiActionPhaseForActiveNation() {
    if (state.gameComplete || getCurrentPhase().id !== 'action') {
      return;
    }

    const ai = getAiEngine();
    if (!ai) {
      setCombatStatus('AI module is unavailable.', 'error');
      return;
    }

    const activeNations = getActiveNationNames();
    if (!activeNations.length) {
      return;
    }

    const primaryNation = ai.normalizeNationName(activeNations[0]);
    const objectives = ai.getNationObjectives(primaryNation, state.currentTurn, detectedSpaces);
    const movedUnitIds = new Set();
    let movedCount = 0;

    const movableUnits = state.units.filter((unit) => {
      const unitNation = getUnitNation(unit);
      if (!unitNation || !activeNations.includes(unitNation)) {
        return false;
      }

      const unitType = unitTypeById.get(unit.unitTypeId);
      if (!unitType || isLeaderUnitType(unitType) || !unit.spaceId) {
        return false;
      }

      if (!canInteractWithUnit(unit) || state.retreatedUnitIds.includes(unit.id)) {
        return false;
      }

      return true;
    });

    const moveBudget = ai.chooseMoveCount(movableUnits.length);

    for (let step = 0; step < moveBudget; step += 1) {
      const candidates = [];

      movableUnits.forEach((unit) => {
        if (movedUnitIds.has(unit.id)) {
          return;
        }

        const current = state.units.find((candidate) => candidate.id === unit.id);
        if (!current || !current.spaceId) {
          return;
        }

        const unitNation = getUnitNation(current);
        detectedSpaces.forEach((space) => {
          if (!space || space.id === current.spaceId || !canUnitMoveToSpace(current, space)) {
            return;
          }

          const occupants = getUnitsInSpace(space.id);
          const enemyInTarget = occupants.filter((occupant) => canNationAttackDefender(unitNation, getUnitNation(occupant)));
          const friendlyInTarget = occupants.filter((occupant) => getUnitNation(occupant) === unitNation).length;
          const candidate = {
            unitId: current.id,
            fromSpaceId: current.spaceId,
            targetSpaceId: space.id,
            targetSpaceName: space.name,
            targetGrowth: getSpaceGrowthValue(space),
            friendlyInTarget,
            enemyInTarget: enemyInTarget.length,
            enemyNationsInTarget: Array.from(new Set(enemyInTarget.map((occupant) => getUnitNation(occupant)).filter(Boolean))),
            friendlySupportNearTarget: getFriendlySupportNearSpace(space.id, unitNation)
          };

          const survivalPriority = objectives.surviveToTurn && state.currentTurn >= objectives.surviveToTurn.turn - 1
            ? 1
            : 0;
          const evaluation = ai.evaluateMove(candidate, {
            controlSpaceWeights: objectives.controlSpaceWeights,
            eliminateNations: objectives.eliminateNations,
            replaceControl: objectives.replaceControl,
            survivalPriority
          });

          candidates.push({
            ...candidate,
            score: evaluation.score
          });
        });
      });

      if (!candidates.length) {
        break;
      }

      candidates.sort((first, second) => second.score - first.score);
      const pickPool = candidates.slice(0, Math.min(3, candidates.length));
      const selected = pickPool[Math.floor(Math.random() * pickPool.length)] || candidates[0];
      const movingUnit = state.units.find((unit) => unit.id === selected.unitId);
      const targetSpace = spacesById.get(selected.targetSpaceId);
      if (!movingUnit || !targetSpace) {
        break;
      }

      const moved = moveUnitByAi(movingUnit, targetSpace);
      if (!moved) {
        movedUnitIds.add(selected.unitId);
        continue;
      }

      movedUnitIds.add(selected.unitId);
      movedCount += 1;
    }

    let combatIterations = 0;
    while (combatIterations < 80) {
      const activePendingCombats = state.pendingCombats.filter((combat) => activeNations.includes(combat.attackerNation));
      if (!activePendingCombats.length) {
        break;
      }

      let changed = false;
      for (const pendingCombat of activePendingCombats) {
        const attacker = getNationCombatStrength(pendingCombat.spaceId, pendingCombat.attackerNation);
        const defenders = getUnitsInSpace(pendingCombat.spaceId)
          .filter((unit) => canNationAttackDefender(pendingCombat.attackerNation, getUnitNation(unit)));
        const defenderNation = getDefenderNationName(pendingCombat.attackerNation, defenders);
        const defenderStrength = getNationCombatStrength(pendingCombat.spaceId, defenderNation);
        const action = ai.chooseCombatAction({
          roundsResolved: pendingCombat.roundsResolved || 0,
          canWithdraw: (pendingCombat.roundsResolved || 0) > 0,
          attackerUnits: attacker.combatUnits,
          attackerLeaders: attacker.leaders,
          defenderUnits: defenderStrength.combatUnits,
          defenderLeaders: defenderStrength.leaders
        });

        if (action === 'withdraw' && (pendingCombat.roundsResolved || 0) > 0) {
          withdrawPendingCombat(pendingCombat);
          cleanPendingCombats();
          changed = true;
        } else {
          resolvePendingCombatByAi(pendingCombat);
          changed = true;
        }
      }

      if (!changed) {
        break;
      }

      combatIterations += 1;
    }

    renderUnits();
    updateTurnPhaseUi();
    saveState();
    setCombatStatus(`AI completed ${movedCount} move${movedCount === 1 ? '' : 's'} for ${getActiveNationEntry().label}.`, 'info', 3500);
  }

  function runAiTurn() {
    if (state.gameComplete) {
      return;
    }

    if (!getAiEngine()) {
      setCombatStatus('AI module is unavailable.', 'error');
      return;
    }

    const startingTurn = state.currentTurn;
    const startingNationIndex = state.currentNationIndex;
    let safety = 0;

    while (!state.gameComplete && safety < 20) {
      if (getCurrentPhase().id === 'action') {
        runAiActionPhaseForActiveNation();
      }

      const advanced = stepTurnPhase();
      if (!advanced) {
        break;
      }

      finalizeTurnPhaseAdvance();

      if (state.currentTurn !== startingTurn || state.currentNationIndex !== startingNationIndex) {
        break;
      }

      safety += 1;
    }
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
    if (!isNationActive(getUnitNation(unit))) {
      return false;
    }

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

    if (isLeaderUnitType(unitType)) {
      const companionUnits = getUnitsMovedByDrag(unit, false).filter((candidate) => candidate.id !== unit.id);
      if (!companionUnits.length) {
        const sameNationInTarget = getUnitsInSpace(targetSpace.id).some(
          (candidate) => getUnitNation(candidate) === unitNation
        );
        if (!sameNationInTarget) {
          return false;
        }
      }
    }

    const currentSpace = spacesById.get(unit.spaceId);
    const allowedNeighbors = adjacentSpaceLookup.get(currentSpace.index);
    if (allowedNeighbors && allowedNeighbors.has(targetSpace.index)) {
      return true;
    }

    return canReachSpaceThroughFriendlyPath(currentSpace, targetSpace, unitNation);
  }

  function isFriendlyPathSpaceForNation(spaceId, nationName) {
    const unitsInSpace = getUnitsInSpace(spaceId);
    if (!unitsInSpace.length) {
      return false;
    }

    return unitsInSpace.every((unit) => getUnitNation(unit) === nationName);
  }

  function canReachSpaceThroughFriendlyPath(startSpace, targetSpace, nationName) {
    if (!startSpace || !targetSpace || !nationName) {
      return false;
    }

    if (startSpace.id === targetSpace.id) {
      return true;
    }

    const visited = new Set([startSpace.id]);
    const queue = [startSpace];

    while (queue.length) {
      const current = queue.shift();
      const neighbors = adjacentSpaceLookup.get(current.index) || new Set();

      for (const neighborIndex of neighbors) {
        const nextSpace = findSpaceByIndex(neighborIndex);
        if (!nextSpace || visited.has(nextSpace.id)) {
          continue;
        }

        if (!isFriendlyPathSpaceForNation(nextSpace.id, nationName)) {
          continue;
        }

        if (nextSpace.id === targetSpace.id) {
          return true;
        }

        visited.add(nextSpace.id);
        queue.push(nextSpace);
      }
    }

    return false;
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
        if (space.index === 20) {
          space.centroidX -= 20;
          space.centroidY -= 20;
          space.minX = Math.min(space.minX, space.centroidX);
          space.minY = Math.min(space.minY, space.centroidY);
          space.maxX = Math.max(space.maxX, space.centroidX);
          space.maxY = Math.max(space.maxY, space.centroidY);
        }
        return;
      }

      space.centroidX = override.x;
      space.centroidY = override.y;
      space.minX = Math.min(space.minX, override.x);
      space.minY = Math.min(space.minY, override.y);
      space.maxX = Math.max(space.maxX, override.x);
      space.maxY = Math.max(space.maxY, override.y);

      if (space.index === 20) {
        space.centroidX -= 20;
        space.centroidY -= 20;
        space.minX = Math.min(space.minX, space.centroidX);
        space.minY = Math.min(space.minY, space.centroidY);
        space.maxX = Math.max(space.maxX, space.centroidX);
        space.maxY = Math.max(space.maxY, space.centroidY);
      }
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

  function hasActiveNationLeaderInSpace(spaceId) {
    if (!spaceId) {
      return false;
    }

    return getUnitsInSpace(spaceId).some((candidate) => {
      const candidateType = unitTypeById.get(candidate.unitTypeId);
      return isLeaderUnitType(candidateType) && isNationActive(getUnitNation(candidate));
    });
  }

  function getUnitsMovedByDrag(unit, moveAllInStack) {
    if (!unit) {
      return [];
    }

    const unitType = unitTypeById.get(unit.unitTypeId);
    const moveLeaderStack = Boolean(
      unit.spaceId && (isLeaderUnitType(unitType) || hasActiveNationLeaderInSpace(unit.spaceId))
    );

    if ((!moveAllInStack && !moveLeaderStack) || !unit.spaceId) {
      return unit ? [unit] : [];
    }

    const movingNation = getUnitNation(unit);
    return state.units.filter(
      (candidate) =>
        candidate.spaceId === unit.spaceId &&
        getUnitNation(candidate) === movingNation &&
        canInteractWithUnit(candidate)
    );
  }

  function renderUnits() {
    mapCanvas.querySelectorAll('.unit').forEach((node) => node.remove());
    mapCanvas.querySelectorAll('.combat-action-button').forEach((node) => node.remove());
    mapCanvas.querySelectorAll('.combat-dice-panel').forEach((node) => node.remove());
    mapCanvas.querySelectorAll('.debug-start-die').forEach((node) => node.remove());

    const regularStackCounters = new Map();
    const regularStackSizes = new Map();
    const chariotStackCounters = new Map();
    const chariotStackSizes = new Map();
    const regularStackPositionByGroupKey = new Map();
    const chariotStackPositionByGroupKey = new Map();
    const renderedCenterByUnitId = new Map();
    const renderedEntries = [];
    const renderedEntryByStackKey = new Map();

    state.units.forEach((unit) => {
      const hasSpace = unit.spaceId && spacesById.has(unit.spaceId);
      if (!hasSpace) {
        renderedEntries.push({ unit, count: 1 });
        return;
      }

      const nationKey = getUnitNation(unit) || unit.unitTypeId;
      const unitType = unitTypeById.get(unit.unitTypeId);
      const stackClassification = isLeaderUnitType(unitType)
        ? `leader|${unit.id}`
        : isChariotUnitType(unitType)
          ? 'chariot'
          : 'regular';
      const stackKey = isLeaderUnitType(unitType)
        ? `${unit.spaceId}|${nationKey}|${stackClassification}`
        : `${unit.spaceId}|${nationKey}|${stackClassification}`;
      const existingEntry = renderedEntryByStackKey.get(stackKey);
      if (existingEntry) {
        existingEntry.count += 1;
        return;
      }

      const newEntry = { unit, count: 1, nationKey };
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
        const firstIsChariot = isChariotUnitType(firstType);
        const secondIsChariot = isChariotUnitType(secondType);

        if (firstIsLeader !== secondIsLeader) {
          return firstIsLeader ? 1 : -1;
        }

        if (!firstIsLeader && firstIsChariot !== secondIsChariot) {
          return firstIsChariot ? 1 : -1;
        }
      }

      return 0;
    });

    renderedEntries.forEach((entry) => {
      const { unit } = entry;
      if (!unit.spaceId || !spacesById.has(unit.spaceId)) {
        return;
      }

      const unitType = unitTypeById.get(unit.unitTypeId);
      const nationKey = getUnitNation(unit) || unit.unitTypeId;
      const nationStackKey = `${unit.spaceId}|${nationKey}`;
      if (isChariotUnitType(unitType)) {
        chariotStackSizes.set(nationStackKey, (chariotStackSizes.get(nationStackKey) || 0) + 1);
      } else if (!isLeaderUnitType(unitType)) {
        regularStackSizes.set(unit.spaceId, (regularStackSizes.get(unit.spaceId) || 0) + 1);
      }
    });

    renderedEntries.forEach((entry) => {
      const { unit, count, nationKey } = entry;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'unit';
      button.dataset.unitId = unit.id;
      const unitLocked = !canInteractWithUnit(unit);
      button.classList.toggle('unit-locked', unitLocked);

      const unitType = unitTypeById.get(unit.unitTypeId);
    const isLeader = isLeaderUnitType(unitType);
    const isChariot = isChariotUnitType(unitType);
      button.classList.toggle('unit-leader', isLeader);
    button.style.zIndex = isLeader ? '12' : isChariot ? '6' : '3';
    button.style.setProperty('--stack-size', String(Math.max(1, count)));
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
      const groupKey = hasSpace ? `${unit.spaceId}|${nationKey}` : '';
      let combatSide = '';
      if (hasSpace) {
        const pendingCombat = getPendingCombatForSpace(unit.spaceId);
        if (pendingCombat) {
          const unitNation = getUnitNation(unit);
          if (unitNation === pendingCombat.attackerNation) {
            combatSide = 'attacker';
          } else if (canNationAttackDefender(pendingCombat.attackerNation, unitNation)) {
            combatSide = 'defender';
          }
        }
      }
      let stackIndex = 0;
      let stackSize = 1;
      const positionOptions = {
        anchorFromRegularStack: false,
        anchorFromChariotStack: false,
        anchorStackIndex: 0,
        anchorStackSize: 1,
        leaderOffsetMultiplier: 1,
        combatSide
      };

      if (hasSpace) {
        if (isLeader || isChariot) {
          const anchorPosition = regularStackPositionByGroupKey.get(groupKey);
          if (anchorPosition) {
            positionOptions.anchorFromRegularStack = true;
            positionOptions.anchorStackIndex = anchorPosition.index;
            positionOptions.anchorStackSize = anchorPosition.size;
          }
        }

        if (isLeader && !positionOptions.anchorFromRegularStack) {
          const chariotAnchorPosition = chariotStackPositionByGroupKey.get(groupKey);
          if (chariotAnchorPosition) {
            positionOptions.anchorFromChariotStack = true;
            positionOptions.anchorStackIndex = chariotAnchorPosition.index;
            positionOptions.anchorStackSize = chariotAnchorPosition.size;
          }
        }

        if (isChariot) {
          stackIndex = chariotStackCounters.get(groupKey) || 0;
          stackSize = chariotStackSizes.get(groupKey) || 1;
          chariotStackCounters.set(groupKey, stackIndex + 1);
          chariotStackPositionByGroupKey.set(groupKey, { index: stackIndex, size: stackSize });
        } else if (!isLeader) {
          stackIndex = regularStackCounters.get(unit.spaceId) || 0;
          stackSize = regularStackSizes.get(unit.spaceId) || 1;
          regularStackCounters.set(unit.spaceId, stackIndex + 1);
          regularStackPositionByGroupKey.set(groupKey, { index: stackIndex, size: stackSize });
        }
      }

      const sameNationOccupants = unit.spaceId
        ? getUnitsInSpace(unit.spaceId, unit.id).filter((occupant) => getUnitNation(occupant) === getUnitNation(unit))
        : [];
      const hasSameNationRegularUnit = sameNationOccupants.some((occupant) => {
        const occupantType = unitTypeById.get(occupant.unitTypeId);
        return occupantType && !isLeaderUnitType(occupantType) && !isChariotUnitType(occupantType);
      });
      const hasSameNationChariotUnit = sameNationOccupants.some((occupant) => {
        const occupantType = unitTypeById.get(occupant.unitTypeId);
        return isChariotUnitType(occupantType);
      });

      positionUnit(button, unit, stackIndex, stackSize, {
        ...positionOptions,
        anchorFromRegularStack: hasSameNationRegularUnit && positionOptions.anchorFromRegularStack,
        anchorFromChariotStack: !hasSameNationRegularUnit && hasSameNationChariotUnit && positionOptions.anchorFromChariotStack,
        leaderOffsetMultiplier: hasSameNationRegularUnit && hasSameNationChariotUnit ? 2 : 1
      });

      const unitCenterX = Number.parseFloat(button.style.left);
      const unitCenterY = Number.parseFloat(button.style.top);
      renderedCenterByUnitId.set(unit.id, {
        x: Number.isFinite(unitCenterX) ? unitCenterX : Math.round(unit.x * state.zoom),
        y: Number.isFinite(unitCenterY) ? unitCenterY : Math.round(unit.y * state.zoom)
      });

      if (hasSpace) {
        const space = spacesById.get(unit.spaceId);
        const unitDisplayName = unitType ? unitType.displayName : unit.label;
        button.title = count > 1
          ? `${unitDisplayName} x${count} in ${space.name}`
          : `${unitDisplayName} in ${space.name}`;
      }

      if (unitLocked) {
        button.title = button.title
          ? `${button.title} - movement disabled after game completion`
          : 'Movement disabled after game completion';
      } else if (unitType && isLeaderUnitType(unitType) && getCurrentPhase().id === 'growth') {
        button.title = button.title
          ? `${button.title} - place on any space containing another ${unitType.nation} unit`
          : `Place on any space containing another ${unitType.nation} unit`;
      }

      button.addEventListener('pointerdown', (event) => {
        if (!canInteractWithUnit(unit)) {
          return;
        }

        const draggedUnits = getUnitsMovedByDrag(unit, event.shiftKey);

        dragState = {
          pointerId: event.pointerId,
          unitId: unit.id,
          element: button,
          moveAllInStack: event.shiftKey,
          movedUnitIds: draggedUnits.map((candidate) => candidate.id)
        };
        button.classList.add('dragging');
        button.setPointerCapture(event.pointerId);
      });

      mapCanvas.appendChild(button);
    });

    const getCombatRowMetrics = (space, unitIds) => {
      const unitPoints = (Array.isArray(unitIds) ? unitIds : [])
        .map((unitId) => renderedCenterByUnitId.get(unitId))
        .filter(Boolean);

      const fallbackX = Math.round(toBoardX(space.centroidX) * state.zoom);
      const fallbackY = Math.round(toBoardY(space.centroidY) * state.zoom);

      if (!unitPoints.length) {
        return {
          minX: fallbackX,
          maxX: fallbackX,
          y: fallbackY
        };
      }

      return {
        minX: Math.min(...unitPoints.map((point) => point.x)),
        maxX: Math.max(...unitPoints.map((point) => point.x)),
        y: Math.round(unitPoints.reduce((sum, point) => sum + point.y, 0) / unitPoints.length)
      };
    };

    Array.from(combatDisplayBySpaceId.entries()).forEach(([spaceId, diceDisplay]) => {
      const space = spacesById.get(spaceId);
      if (!space) {
        return;
      }

      const dieSizePx = Math.round(DIE_SIZE_PX * state.zoom);
      const rowGapPx = Math.max(2, Math.round(0.16 * 16 * state.zoom));
      const margin = Math.max(4, Math.round(DIE_LEFT_MARGIN_PX * state.zoom) + 2);
      const attackerMetrics = getCombatRowMetrics(space, diceDisplay.attackerUnitIds);
      const defenderMetrics = getCombatRowMetrics(space, diceDisplay.defenderUnitIds);
      const widestRowCount = Math.max(diceDisplay.attackerDice.length, diceDisplay.defenderDice.length, 1);
      const widestRowWidth = widestRowCount * dieSizePx + Math.max(0, widestRowCount - 1) * rowGapPx;
      const alignedLeft = Math.min(attackerMetrics.minX, defenderMetrics.minX) - margin - widestRowWidth;
      const panelCenterY = Math.round((attackerMetrics.y + defenderMetrics.y) / 2);

      const combatPanel = document.createElement('div');
      combatPanel.className = 'combat-dice-panel';
      combatPanel.style.left = `${Math.round(alignedLeft)}px`;
      combatPanel.style.top = `${panelCenterY}px`;

      const attackerRow = document.createElement('div');
      attackerRow.className = 'combat-dice-row attacker';
      diceDisplay.attackerDice.forEach((value) => {
        attackerRow.appendChild(createCombatDieElement(value, 'attacker'));
      });
      combatPanel.appendChild(attackerRow);

      const defenderRow = document.createElement('div');
      defenderRow.className = 'combat-dice-row defender';
      diceDisplay.defenderDice.forEach((value) => {
        defenderRow.appendChild(createCombatDieElement(value, 'defender'));
      });
      combatPanel.appendChild(defenderRow);
      mapCanvas.appendChild(combatPanel);
    });

    const combatButtonSpaces = detectedSpaces.filter((space) => isSpaceContestable(space.id));
    combatButtonSpaces.forEach((space) => {
      const pendingCombat = getPendingCombatForSpace(space.id);
      const showWithdraw = Boolean(pendingCombat && pendingCombat.roundsResolved > 0);
      const activeCombat = pendingCombat ? isNationActive(pendingCombat.attackerNation) : false;
      const canResolveManualCombat = !pendingCombat && getUnitsInSpace(space.id).some((unit) => isNationActive(getUnitNation(unit)));
      const combatEnabled = getCurrentPhase().id === 'action' && (activeCombat || canResolveManualCombat);
      const buttonY = Math.round(toBoardY(space.centroidY) * state.zoom);
      const buttonX = Math.round(toBoardX(space.centroidX) * state.zoom - UNIT_SIZE_PX * state.zoom * 0.9);

      const resolveButton = document.createElement('button');
      resolveButton.type = 'button';
      resolveButton.className = 'combat-action-button';
      resolveButton.classList.add('resolve-combat-button');
      resolveButton.textContent = 'Resolve Combat';
      resolveButton.disabled = !combatEnabled;
      resolveButton.style.left = `${buttonX}px`;
      resolveButton.style.top = `${buttonY}px`;
      resolveButton.addEventListener('click', () => handleResolveCombatClick(space.id));
      mapCanvas.appendChild(resolveButton);

      if (showWithdraw) {
        const withdrawButton = document.createElement('button');
        withdrawButton.type = 'button';
        withdrawButton.className = 'combat-action-button';
        withdrawButton.textContent = 'Withdraw';
        withdrawButton.disabled = !activeCombat || getCurrentPhase().id !== 'action';
        withdrawButton.style.left = `${buttonX}px`;
        withdrawButton.style.top = `${buttonY + Math.round(24 * state.zoom)}px`;
        withdrawButton.addEventListener('click', () => handleWithdrawClick(space.id));
        mapCanvas.appendChild(withdrawButton);
      }
    });
  }

  function positionUnit(element, unit, stackIndex, stackSize = 1, options = {}) {
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
    const unitType = unitTypeById.get(unit.unitTypeId);
    const unitSizePx = UNIT_SIZE_PX * state.zoom;
    const combatSideOffsetPx = (unitSizePx * 0.6 + STACK_VERTICAL_GAP_PX * state.zoom) * 0.25;
    const combatSideYOffset = options.combatSide === 'attacker'
      ? -combatSideOffsetPx
      : options.combatSide === 'defender'
        ? combatSideOffsetPx
        : 0;

    if (isChariotUnitType(unitType) && options.anchorFromRegularStack) {
      const anchorStackIndex = Number.isFinite(options.anchorStackIndex) ? options.anchorStackIndex : 0;
      const anchorStackSize = Number.isFinite(options.anchorStackSize) ? options.anchorStackSize : 1;
      const regularCenteredIndex = anchorStackIndex - (anchorStackSize - 1) / 2;
      const regularCenterX = baseX * state.zoom;
      const regularCenterY = baseY * state.zoom + regularCenteredIndex * offsetStep;
      const chariotOffsetPx = unitSizePx * 0.22;

      element.style.left = `${Math.round(regularCenterX + chariotOffsetPx)}px`;
      element.style.top = `${Math.round(regularCenterY + chariotOffsetPx + verticalOffset + combatSideYOffset)}px`;
      return;
    }

    if (isChariotUnitType(unitType)) {
      const chariotOffsetPx = unitSizePx * 0.22;
      element.style.left = `${Math.round(baseX * state.zoom + chariotOffsetPx)}px`;
      element.style.top = `${Math.round(baseY * state.zoom + chariotOffsetPx + verticalOffset + combatSideYOffset)}px`;
      return;
    }

    if (isLeaderUnitType(unitType) && (options.anchorFromRegularStack || options.anchorFromChariotStack)) {
      const anchorStackIndex = Number.isFinite(options.anchorStackIndex) ? options.anchorStackIndex : stackIndex;
      const anchorStackSize = Number.isFinite(options.anchorStackSize) ? options.anchorStackSize : stackSize;
      const regularCenteredIndex = anchorStackIndex - (anchorStackSize - 1) / 2;
      const regularCenterX = baseX * state.zoom;
      const regularCenterY = baseY * state.zoom + regularCenteredIndex * offsetStep;
      const regularUpperRightX = regularCenterX + unitSizePx / 2;
      const regularUpperRightY = regularCenterY - unitSizePx / 2;
      const leaderOffsetMultiplier = Number.isFinite(options.leaderOffsetMultiplier)
        ? Math.max(1, options.leaderOffsetMultiplier)
        : 1;
      const leaderOffsetPx = unitSizePx * 0.25 * leaderOffsetMultiplier;
      const leaderTopLeftX = regularUpperRightX - unitSizePx + leaderOffsetPx;
      const leaderTopLeftY = regularUpperRightY + leaderOffsetPx;
      const leaderCenterX = leaderTopLeftX + unitSizePx / 2;
      const leaderCenterY = leaderTopLeftY + unitSizePx / 2;

      element.style.left = `${Math.round(leaderCenterX)}px`;
      element.style.top = `${Math.round(leaderCenterY + combatSideYOffset)}px`;
      return;
    }

    element.style.left = `${Math.round(baseX * state.zoom)}px`;
    element.style.top = `${Math.round(baseY * state.zoom + verticalOffset + combatSideYOffset)}px`;
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
      let movedUnits = Array.isArray(dragState.movedUnitIds) && dragState.movedUnitIds.length
        ? dragState.movedUnitIds
            .map((unitId) => state.units.find((item) => item.id === unitId))
            .filter(Boolean)
        : [unit];
      const bounds = mapCanvas.getBoundingClientRect();
      const boardX = sanitizeNumber((event.clientX - bounds.left) / state.zoom, 0, BASE_WIDTH, unit.x);
      const boardY = sanitizeNumber((event.clientY - bounds.top) / state.zoom, 0, BASE_HEIGHT, unit.y);

      if (detectedSpaces.length) {
        const targetSpace = findSpaceForBoardPoint(boardX, boardY);
        if (targetSpace && canUnitMoveToSpace(unit, targetSpace)) {
          const movingNation = getUnitNation(unit);
          const targetWasEmpty = getUnitsInSpace(targetSpace.id).length === 0;
          const movingFromSpaceId = unit.spaceId && spacesById.has(unit.spaceId) ? unit.spaceId : '';
          let leftRegularUnitBehindForGarrison = false;
          if (movingFromSpaceId && targetSpace.id !== movingFromSpaceId && movingNation) {
            const nationUnitsAtOrigin = getUnitsInSpace(movingFromSpaceId).filter(
              (candidate) => getUnitNation(candidate) === movingNation
            ).length;
            if (isGarrisonRequired(movingFromSpaceId, movingNation)) {
              const movingNationUnits = movedUnits.filter(
                (candidate) => candidate.spaceId === movingFromSpaceId && getUnitNation(candidate) === movingNation
              );
              const movingNationUnitCount = movingNationUnits.length;
              const remainingAtOrigin = nationUnitsAtOrigin - movingNationUnitCount;

              // Shift-stack movement should automatically leave one required garrison unit behind.
              if (remainingAtOrigin < 1 && movingNationUnitCount > 0) {
                const regularUnit = movingNationUnits.find((candidate) => {
                  const unitType = unitTypeById.get(candidate.unitTypeId);
                  return isRegularUnitType(unitType);
                });
                const unitToLeave = regularUnit || null;
                if (unitToLeave) {
                  movedUnits = movedUnits.filter((candidate) => candidate.id !== unitToLeave.id);
                  leftRegularUnitBehindForGarrison = true;
                } else {
                  setCombatStatus('A required garrison must be a regular unit. Leave a regular unit behind before moving on.', 'error', 6500);
                  dragState.element.classList.remove('dragging');
                  dragState = null;
                  renderUnits();
                  saveState();
                  return;
                }
              }

              const movingLeader = isLeaderUnitType(unitTypeById.get(unit.unitTypeId))
                ? movedUnits.find((candidate) => candidate.id === unit.id)
                : null;
              if (movingLeader) {
                const remainingLeaderCompanions = movedUnits.filter((candidate) => {
                  if (candidate.id === unit.id) {
                    return false;
                  }

                  const candidateType = unitTypeById.get(candidate.unitTypeId);
                  return getUnitNation(candidate) === movingNation && !isLeaderUnitType(candidateType);
                });

                const movedUnitIds = new Set(movedUnits.map((candidate) => candidate.id));
                const sameNationInTarget = getUnitsInSpace(targetSpace.id).some(
                  (candidate) => getUnitNation(candidate) === movingNation && !movedUnitIds.has(candidate.id)
                );

                if (!remainingLeaderCompanions.length && !sameNationInTarget && !leftRegularUnitBehindForGarrison) {
                  setCombatStatus('A leader cannot move alone. Leave the leader in place or move another unit with it.', 'error', 6000);
                  dragState.element.classList.remove('dragging');
                  dragState = null;
                  renderUnits();
                  saveState();
                  return;
                }
              }

              if (!movedUnits.length) {
                setCombatStatus('A garrison is required here. No units moved.', 'error', 5000);
                dragState.element.classList.remove('dragging');
                dragState = null;
                renderUnits();
                saveState();
                return;
              }

              const updatedMovingNationCount = movedUnits.filter(
                (candidate) => candidate.spaceId === movingFromSpaceId && getUnitNation(candidate) === movingNation
              ).length;
              const updatedRemainingAtOrigin = nationUnitsAtOrigin - updatedMovingNationCount;
              if (updatedRemainingAtOrigin < 1) {
                setCombatStatus('A garrison is required here. Leave at least one unit behind before moving on.', 'error', 6000);
                dragState.element.classList.remove('dragging');
                dragState = null;
                renderUnits();
                saveState();
                return;
              }
            }
          }

          if (getCurrentPhase().id === 'action' && movingNation) {
            const blockedEnemyPresent = getUnitsInSpace(targetSpace.id).some((occupant) =>
              isFirstHebrewTurnProtectedNation(movingNation, getUnitNation(occupant))
            );
            if (blockedEnemyPresent) {
              setCombatStatus('During the first Hebrew turn, Hebrew units may not attack Ammon, Moab, or Edom.', 'error', 6500);
              dragState.element.classList.remove('dragging');
              dragState = null;
              renderUnits();
              saveState();
              return;
            }
          }

          const originSpaceByUnitId = new Map(movedUnits.map((candidate) => [candidate.id, candidate.spaceId || targetSpace.id]));
          movedUnits.forEach((candidate) => snapUnitToSpace(candidate, targetSpace));

          if (targetWasEmpty && movingNation) {
            markGarrisonRequired(targetSpace.id, movingNation);
          }

          const activatedSet = new Set(state.activatedUnitIds);
          movedUnits.forEach((candidate) => activatedSet.add(candidate.id));
          state.activatedUnitIds = Array.from(activatedSet);

          if (getCurrentPhase().id === 'action' && movingNation) {
            const enemyPresent = getUnitsInSpace(targetSpace.id).some(
              (occupant) => canNationAttackDefender(movingNation, getUnitNation(occupant))
            );

            if (enemyPresent) {
              movedUnits.forEach((candidate) => {
                ensurePendingCombat(targetSpace.id, movingNation, {
                  unitId: candidate.id,
                  originSpaceId: originSpaceByUnitId.get(candidate.id) || targetSpace.id
                });
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
      sessionStorage.setItem(RESET_SCROLL_RIGHT_KEY, '1');
      window.location.reload();
    });
  }

  if (nextPhaseButton) {
    nextPhaseButton.addEventListener('click', advanceTurnPhase);
  }

  if (skipTurnButton) {
    skipTurnButton.addEventListener('click', skipTurn);
  }

  if (runAiTurnButton) {
    runAiTurnButton.addEventListener('click', runAiTurn);
  }

  syncMapSize();
  updateTurnPhaseUi();
  renderUnits();
  mapViewport.scrollLeft = shouldResetScrollRight
    ? Math.max(0, mapCanvas.scrollWidth - mapViewport.clientWidth)
    : state.scrollLeft;
  mapViewport.scrollTop = state.scrollTop;

  analyzeMapSpaces().catch(() => {
    if (spaceCount) {
      spaceCount.textContent = 'Spaces: unavailable';
    }
  });

  if (shouldResetScrollRight) {
    mapViewport.scrollLeft = Math.max(0, mapCanvas.scrollWidth - mapViewport.clientWidth);
    state.scrollLeft = mapViewport.scrollLeft;
    saveState();
  }
})();
