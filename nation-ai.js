(() => {
  const NATION_ALIASES = new Map([
    ['Hebrews', 'Hebrew'],
    ['Canaanites', 'Canaan'],
    ['Amorites', 'Amorite'],
    ['Ammonites', 'Ammon'],
    ['Moabites', 'Moab'],
    ['Edomites', 'Edom'],
    ['Phoenicians', 'Phoenicia'],
    ['Philistines', 'Philistia'],
    ['Aram', 'Aram-Syria'],
    ['Assyria', 'Assyria'],
    ['Babylon', 'Babylonia']
  ]);

  const SPACE_ALIASES = new Map([
    ['Rabbah', ['Ammon']],
    ['Heshbon', ['Jazer', 'Mishor']],
    ['Arnon', ['Mishor']],
    ['Samaritans', ['Samaria']]
  ]);

  const OBJECTIVES = {
    Hebrew: {
      controlSpaces: { Jerusalem: 2, Hebron: 1, Bethel: 1 },
      eliminateNations: { Canaan: 2 },
      surviveToTurn: { turn: 9, points: 2 },
      leaderObjectivesByTurn: {
        1: { controlSpaces: { Jericho: 1, Bethel: 1 } },
        5: { controlSpaces: { Jerusalem: 1 } }
      }
    },
    Canaan: {
      controlSpaces: { Jezreel: 1, 'Upper Galilee': 1, Shechem: 1 },
      surviveToTurn: { turn: 5, points: 2 }
    },
    Amorite: {
      controlSpaces: { Heshbon: 1, Rabbah: 1, Gilead: 1 },
      surviveToTurn: { turn: 6, points: 2 }
    },
    Ammon: {
      controlSpaces: { Rabbah: 1, Gilead: 1 },
      surviveToTurn: { turn: 7, points: 2 }
    },
    Moab: {
      controlSpaces: { Moab: 1, Arnon: 1 },
      surviveToTurn: { turn: 7, points: 2 }
    },
    Edom: {
      controlSpaces: { Edom: 1 },
      surviveToTurn: { turn: 8, points: 2 }
    },
    Phoenicia: {
      controlSpaces: { Phoenicia: 1 },
      surviveToTurn: { turn: 8, points: 2 }
    },
    Philistia: {
      controlSpaces: { Philistia: 1 },
      surviveToTurn: { turn: 6, points: 2 }
    },
    Israel: {
      controlSpaces: { Samaria: 2, Jezreel: 1 },
      surviveToTurn: { turn: 8, points: 2 }
    },
    Judah: {
      controlSpaces: { Jerusalem: 2, Hebron: 1 },
      surviveToTurn: { turn: 9, points: 2 }
    },
    Egypt: {
      replaceControl: 2,
      controlSpaces: { Jerusalem: 1, Philistia: 1 },
      pointsPerDestroyedOrSubmittedUnit: 1
    },
    'Aram-Syria': {
      replaceControl: 2,
      controlSpaces: { Bashan: 1, Dan: 1, Gilead: 1, Shechem: 1, Samaria: 1 },
      pointsPerDestroyedOrSubmittedUnit: 1
    },
    Assyria: {
      replaceControl: 3,
      controlSpaces: { Samaria: 1 },
      eliminateNations: { Israel: 2 },
      pointsPerDestroyedOrSubmittedUnit: 1
    },
    Babylonia: {
      replaceControl: 3,
      controlSpaces: { Jerusalem: 2 },
      eliminateNations: { Judah: 1 },
      pointsPerDestroyedOrSubmittedUnit: 1
    }
  };

  function normalizeNationName(nationName) {
    if (!nationName) {
      return '';
    }

    return NATION_ALIASES.get(nationName) || nationName;
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function buildSpaceNameSet(spaces) {
    const names = new Set();
    toArray(spaces).forEach((space) => {
      if (space && space.name) {
        names.add(space.name);
      }
    });
    return names;
  }

  function resolveSpaceName(spaceName, spaceNames) {
    if (!spaceName) {
      return '';
    }

    if (spaceNames.has(spaceName)) {
      return spaceName;
    }

    const aliases = SPACE_ALIASES.get(spaceName) || [];
    for (const alias of aliases) {
      if (spaceNames.has(alias)) {
        return alias;
      }
    }

    return '';
  }

  function getNationObjectives(nationName, turn, spaces) {
    const normalizedNation = normalizeNationName(nationName);
    const profile = OBJECTIVES[normalizedNation] || {};
    const leaderProfile = profile.leaderObjectivesByTurn && profile.leaderObjectivesByTurn[turn]
      ? profile.leaderObjectivesByTurn[turn]
      : {};
    const spaceNames = buildSpaceNameSet(spaces);
    const mergedControlSpaces = {
      ...(profile.controlSpaces || {}),
      ...(leaderProfile.controlSpaces || {})
    };

    const resolvedControlWeights = {};
    Object.entries(mergedControlSpaces).forEach(([spaceName, points]) => {
      const resolved = resolveSpaceName(spaceName, spaceNames);
      if (resolved) {
        resolvedControlWeights[resolved] = (resolvedControlWeights[resolved] || 0) + Number(points || 0);
      }
    });

    const eliminateNations = { ...(profile.eliminateNations || {}) };

    return {
      nationName: normalizedNation,
      controlSpaceWeights: resolvedControlWeights,
      eliminateNations,
      replaceControl: Number(profile.replaceControl || 0),
      surviveToTurn: profile.surviveToTurn || null
    };
  }

  function getObjectiveProfile(nationName) {
    const normalizedNation = normalizeNationName(nationName);
    const profile = OBJECTIVES[normalizedNation] || {};
    return {
      nationName: normalizedNation,
      controlSpaces: { ...(profile.controlSpaces || {}) },
      eliminateNations: { ...(profile.eliminateNations || {}) },
      replaceControl: Number(profile.replaceControl || 0),
      pointsPerDestroyedOrSubmittedUnit: Number(profile.pointsPerDestroyedOrSubmittedUnit || 0),
      surviveToTurn: profile.surviveToTurn || null,
      leaderObjectivesByTurn: { ...(profile.leaderObjectivesByTurn || {}) }
    };
  }

  function evaluateMove(candidate, context) {
    const scoreParts = [];
    let score = 0;
    const nationUnitCount = Number(context.nationUnitCount || 0);
    const nationRegionCount = Number(context.nationRegionCount || 0);
    const isSmallNation = nationUnitCount > 0 && (nationUnitCount <= 3 || nationRegionCount <= 2);
    const isTinyNation = nationUnitCount > 0 && nationUnitCount <= 2;

    const targetObjectiveWeight = context.controlSpaceWeights[candidate.targetSpaceName] || 0;
    if (targetObjectiveWeight > 0) {
      const objectiveScore = targetObjectiveWeight * 6;
      score += objectiveScore;
      scoreParts.push({ label: 'objective-space', value: objectiveScore });
    }

    const growthScore = (Number(candidate.targetGrowth || 0) * 1.4);
    score += growthScore;
    scoreParts.push({ label: 'growth', value: growthScore });

    const spreadScore = candidate.friendlyInTarget === 0
      ? 1.8
      : Math.max(-2.4, -0.4 * candidate.friendlyInTarget);
    score += spreadScore;
    scoreParts.push({ label: 'spread', value: spreadScore });

    if (isSmallNation && candidate.friendlyInTarget === 0 && candidate.enemyInTarget === 0) {
      // Small nations should expand into uncontested spaces first for preservation.
      const emptySpaceBonus = isTinyNation ? 8.5 : 5.2;
      score += emptySpaceBonus;
      scoreParts.push({ label: 'small-empty-expansion', value: emptySpaceBonus });
    }

    if (candidate.enemyInTarget > 0) {
      const pressureBonus = context.replaceControl > 0 ? 2.8 : 1.5;
      score += pressureBonus;
      scoreParts.push({ label: 'enemy-contact', value: pressureBonus });

      const massAttackBonus = Math.min(10, candidate.friendlyInTarget * 2.5);
      if (massAttackBonus > 0) {
        score += massAttackBonus;
        scoreParts.push({ label: 'mass-attack', value: massAttackBonus });
      }
    }

    if (isSmallNation && candidate.enemyInTarget > 0) {
      const smallContactPenalty = (isTinyNation ? 8 : 6) + Math.min(4, candidate.enemyInTarget * 1.2);
      score -= smallContactPenalty;
      scoreParts.push({ label: 'small-preserve-force', value: -smallContactPenalty });
    }

    if (isTinyNation && candidate.enemyInTarget > 0 && targetObjectiveWeight < 2) {
      // Tiny nations should almost never initiate non-critical battles.
      const tinyBattleAvoidPenalty = 10;
      score -= tinyBattleAvoidPenalty;
      scoreParts.push({ label: 'tiny-battle-avoid', value: -tinyBattleAvoidPenalty });
    }

    if (candidate.enemyInTarget > candidate.friendlySupportNearTarget) {
      const localRiskPenalty = Math.min(3.5, 1 + (candidate.enemyInTarget - candidate.friendlySupportNearTarget) * 0.8);
      score -= localRiskPenalty;
      scoreParts.push({ label: 'local-risk', value: -localRiskPenalty });
    }

    if (candidate.enemyNationsInTarget.some((nation) => context.eliminateNations[nation] > 0)) {
      score += 4;
      scoreParts.push({ label: 'elimination-target', value: 4 });
    }

    if (context.survivalPriority > 0 && candidate.enemyInTarget > candidate.friendlySupportNearTarget + 1) {
      score -= 2.2;
      scoreParts.push({ label: 'survival-risk', value: -2.2 });
    }

    const jitter = isSmallNation
      ? (Math.random() - 0.5) * 0.7
      : (Math.random() - 0.5) * 1.6;
    score += jitter;
    scoreParts.push({ label: 'jitter', value: jitter });

    return {
      score,
      scoreParts
    };
  }

  function chooseMoveCount(totalMovers) {
    if (totalMovers <= 0) {
      return 0;
    }

    if (Math.random() < 0.15) {
      return 0;
    }

    const ratio = 0.45 + Math.random() * 0.55;
    return Math.max(1, Math.min(totalMovers, Math.round(totalMovers * ratio)));
  }

  function chooseCombatAction(context) {
    if (!context.canWithdraw) {
      return 'resolve';
    }

    const nationUnitCount = Number(context.nationUnitCount || 0);
    const nationRegionCount = Number(context.nationRegionCount || 0);
    const isSmallNation = Boolean(context.isSmallNation) ||
      (nationUnitCount > 0 && (nationUnitCount <= 3 || nationRegionCount <= 2));
    const isTinyNation = nationUnitCount > 0 && nationUnitCount <= 2;

    if (isTinyNation && context.roundsResolved >= 1) {
      return 'withdraw';
    }

    if (isSmallNation && context.roundsResolved >= 1) {
      // Small nations should disengage quickly once combat has started.
      if (context.attackerUnits <= context.defenderUnits) {
        return 'withdraw';
      }

      if (context.attackerUnits <= 1) {
        return 'withdraw';
      }

      if (context.attackerUnits <= context.defenderUnits + 1 && Math.random() < 0.85) {
        return 'withdraw';
      }
    }

    if (context.roundsResolved === 0) {
      return 'resolve';
    }

    const attackerPower = context.attackerUnits + context.attackerLeaders * 0.5;
    const defenderPower = context.defenderUnits + context.defenderLeaders * 0.5;
    if (attackerPower + 1 < defenderPower && Math.random() < 0.7) {
      return 'withdraw';
    }

    if (context.attackerUnits <= 1 && context.defenderUnits >= 2 && Math.random() < 0.6) {
      return 'withdraw';
    }

    return 'resolve';
  }

  window.KocNationAI = {
    normalizeNationName,
    resolveSpaceName,
    getObjectiveProfile,
    getNationObjectives,
    evaluateMove,
    chooseMoveCount,
    chooseCombatAction
  };
})();
