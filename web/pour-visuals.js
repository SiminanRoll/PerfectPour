/* Perfect Pour V1.05 · physical glass, carbonation and bounded pour effects.
 * Presentation only. Fill and foam always use the engine's volume/height map.
 * All dimensions below are in the existing 420 × 440 pouring coordinate space.
 */
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const X = 260;
  const NOZZLE_Y = 25;
  const MAX_PARTICLES = 68;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
  const fract = v => v - Math.floor(v);
  const noise = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
  const rgba = (rgb, alpha) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  const shade = (rgb, scale, lift = 0) => rgb.map(v => Math.round(clamp(v * scale + lift, 0, 255)));
  const parseColor = value => {
    const match = /^#([a-f\d]{6})$/i.exec(String(value));
    return match ? [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16)) : [230, 142, 44];
  };

  function validGeometry(g) {
    return g && g.cup && typeof g.width === 'function' && typeof g.level === 'function' &&
      Number.isFinite(g.top) && Number.isFinite(g.bottom) && g.bottom > g.top &&
      Number.isFinite(g.cup.height) && g.cup.height > 0 && Number.isFinite(g.width(1)) && g.width(1) > 0;
  }

  // This follows the game's path exactly, including the volume-dependent width.
  // A supplied path callback can be used if that path is changed in a later version.
  function glassPath(ctx, g, suppliedPath) {
    if (typeof suppliedPath === 'function') { suppliedPath(g); return; }
    ctx.beginPath();
    ctx.moveTo(X - g.width(1) / 2, g.top);
    for (let i = 19; i >= 0; i--) {
      const v = i / 20;
      ctx.lineTo(X - g.width(v) / 2, g.bottom - v * g.cup.height);
    }
    ctx.quadraticCurveTo(X, g.bottom + 9, X + g.width(0) / 2, g.bottom);
    for (let i = 1; i <= 20; i++) {
      const v = i / 20;
      ctx.lineTo(X + g.width(v) / 2, g.bottom - v * g.cup.height);
    }
    ctx.closePath();
  }

  function sidePath(ctx, g, side, inset, start = .98, end = .025) {
    ctx.beginPath();
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const v = start + (end - start) * i / steps;
      const x = X + side * (g.width(v) / 2 - inset);
      const y = g.bottom - v * g.cup.height;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  }

  function ellipse(ctx, x, y, rx, ry, fill, stroke, width = 1) {
    ctx.beginPath();ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill;ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke;ctx.lineWidth = width;ctx.stroke(); }
  }

  function create({reducedMotion = false} = {}) {
    const reduced = Boolean(reducedMotion);
    let particles = [];
    let serial = 0;
    let previousSpill = 0;
    let wasPouring = false;
    let streamCredit = 0;
    let rippleTime = 0;
    let spillTime = 0;
    let dripTime = 0;
    let time = 0;
    let initialized = false;

    function reset({spillMl = 0} = {}) {
      particles.length = 0;
      previousSpill = clamp(spillMl, 0, 1e9);
      wasPouring = false;
      streamCredit = rippleTime = spillTime = dripTime = time = serial = 0;
      initialized = true;
    }

    function spawn(kind, x, y, vx, vy, radius, life, surface) {
      if (particles.length >= MAX_PARTICLES) return;
      particles.push({kind, x, y, vx, vy, radius, life, total: life, surface});
    }

    function update(delta, input = {}) {
      const dt = clamp(delta, 0, .25);
      const spill = clamp(input.spillMl, 0, 1e9);
      if (!initialized || spill < previousSpill - .001) reset({spillMl: spill});
      const pouring = Boolean(input.pouring);
      const g = input.geometry;
      const spillDelta = Math.max(0, spill - previousSpill);
      previousSpill = spill;
      if (reduced || !validGeometry(g)) {
        particles.length = 0;
        wasPouring = pouring;
        streamCredit = rippleTime = spillTime = dripTime = 0;
        return false;
      }
      time += dt;
      const fill = clamp(input.fill, 0, 1);
      const foam = clamp(input.foam, 0, 1);
      const surface = fill + foam > .001 ? g.level(Math.min(1, fill + foam)) : g.bottom - 4;
      if (pouring) rippleTime = 1.25;
      else rippleTime = Math.max(0, rippleTime - dt);
      spillTime = Math.max(0, spillTime - dt);
      dripTime = Math.max(0, dripTime - dt);

      // Finish only the stream already below the closed tap. These are visual
      // droplets: no additional liquid, score or foam is ever sent to the engine.
      if (wasPouring && !pouring) {
        dripTime = .72;
        spawn('drip', X - 1, NOZZLE_Y + 13, 1.4, 155, 1.65, .72, surface);
        spawn('drip', X + .8, NOZZLE_Y + 3, -.7, 112, 1.15, .85, surface);
      }
      wasPouring = pouring;

      if (pouring) {
        streamCredit = Math.min(5, streamCredit + dt * 26);
        while (streamCredit >= 1) {
          streamCredit--;
          const n = ++serial;
          const side = n % 2 ? -1 : 1;
          spawn('impact', X + side * 3, surface - .5,
            side * (12 + noise(n + 1) * 32), -(23 + noise(n + 4) * 52),
            .65 + noise(n + 8) * 1.3, .36 + noise(n + 2) * .26, surface);
        }
      } else streamCredit = 0;

      // Only newly reported engine overflow emits fresh droplets. A loaded
      // spilled cup retains its puddle without replaying the original accident.
      if (spillDelta > .002) {
        spillTime = 1.6;
        const count = Math.min(12, Math.max(1, Math.ceil(spillDelta * 1.8)));
        for (let i = 0; i < count; i++) {
          const n = ++serial, side = n % 2 ? -1 : 1;
          spawn('spill', X + side * (g.width(1) / 2 + 1.5), g.top + 3,
            side * (8 + noise(n) * 30), 14 + noise(n + 2) * 55,
            .9 + noise(n + 5) * 2.1, 1.65, g.bottom + 9);
        }
      }

      // A stable, finite pool. No timers, animation frames, DOM nodes, or global
      // listeners belong to this renderer; the game's existing frame loop owns it.
      let alive = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life -= dt;
        p.vy += (p.kind === 'impact' ? 205 : 340) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0 || p.y > p.surface + (p.kind === 'spill' ? 3 : 5)) continue;
        particles[alive++] = p;
      }
      particles.length = alive;
      return isAnimating();
    }

    function isAnimating() {
      return !reduced && (particles.length > 0 || rippleTime > 0 || spillTime > 0 || dripTime > 0);
    }

    function drawGround(ctx, g, spillMl, drinkRgb) {
      const base = g.width(0);
      // Broad cast shadow, a tight contact shadow, then the leather coaster.
      // Layered translucent ellipses avoid a costly per-frame shadow filter.
      ellipse(ctx, X + 9, g.bottom + 13, base * .87, 10, 'rgba(16,32,28,.07)');
      ellipse(ctx, X + 4, g.bottom + 10, base * .67, 7, 'rgba(16,32,28,.14)');
      const coaster = ctx.createLinearGradient(0, g.bottom + 2, 0, g.bottom + 13);
      coaster.addColorStop(0, '#a27d52');coaster.addColorStop(.45, '#6f5237');coaster.addColorStop(.56, '#a18b68');coaster.addColorStop(1, '#4c3a29');
      ellipse(ctx, X, g.bottom + 7.5, Math.max(base * .62, 62), 9, coaster, 'rgba(35,29,22,.28)', .6);
      ellipse(ctx, X, g.bottom + 5.8, Math.max(base * .60, 60), 6.8, '#b5a07b', '#d8c7a3', .65);
      ellipse(ctx, X, g.bottom + 5.6, Math.max(base * .55, 55), 5.5, null, 'rgba(80,58,34,.25)', .55);
      for (let i = 0; i < 10; i++) {
        const u = noise(i + 7), x = X + (u - .5) * base;
        ellipse(ctx, x, g.bottom + 4.5 + noise(i + 27) * 4, .4 + noise(i + 42) * .9, .22, 'rgba(61,46,29,.21)');
      }
      if (spillMl > .03) {
        const amount = Math.min(spillMl, 160);
        const width = Math.min(150, base * .44 + Math.sqrt(amount) * 5.3);
        const puddle = ctx.createLinearGradient(0, g.bottom + 2, 0, g.bottom + 21);
        puddle.addColorStop(0, rgba(drinkRgb, .15));puddle.addColorStop(.55, rgba(drinkRgb, .55));puddle.addColorStop(1, rgba(shade(drinkRgb, .62), .30));
        ctx.beginPath();
        ctx.moveTo(X - width, g.bottom + 12);
        ctx.bezierCurveTo(X - width - 10, g.bottom + 1, X - width * .17, g.bottom - 1, X + width * .33, g.bottom + 5);
        ctx.bezierCurveTo(X + width * .83, g.bottom, X + width + 18, g.bottom + 15, X + width * .79, g.bottom + 19);
        ctx.bezierCurveTo(X + width * .3, g.bottom + 28, X - width * .67, g.bottom + 22, X - width, g.bottom + 12);
        ctx.fillStyle = puddle;ctx.fill();ctx.strokeStyle = rgba(shade(drinkRgb, .6), .24);ctx.lineWidth = .7;ctx.stroke();
        ctx.beginPath();ctx.moveTo(X - width * .83, g.bottom + 13);ctx.bezierCurveTo(X - width * .55, g.bottom + 20, X - width * .13, g.bottom + 20, X + width * .06, g.bottom + 18);
        ctx.strokeStyle = 'rgba(255,255,245,.63)';ctx.lineWidth = 1.15;ctx.stroke();
        if (spillTime > 0) {
          const phase = reduced ? .7 : fract(time * 2.3);
          ellipse(ctx, X + width * .64, g.bottom + 13, 5 + phase * 16, .8 + phase * 2, null, `rgba(255,250,223,${(1 - phase) * .48})`, .8);
        }
      }
      ellipse(ctx, X, g.bottom + 3.7, base * .49, 4.5, 'rgba(23,31,27,.22)');
    }

    function drawLiquid(ctx, g, fill, foam, drinkRgb, lightRgb, t) {
      const liquidY = g.level(fill), foamY = g.level(Math.min(1, fill + foam));
      const rim = g.width(1), left = X - rim / 2, right = X + rim / 2;
      if (fill > 0) {
        // Clear soda transmits some of the bar behind it. A gently saturated
        // optical tint keeps this from looking like an opaque pastel juice.
        const peak = Math.max(...drinkRgb);
        const opticalRgb = drinkRgb.map(v => Math.round(clamp(peak + (v - peak) * 1.14, 0, 255)));
        const body = ctx.createLinearGradient(0, liquidY, 0, g.bottom + 5);
        body.addColorStop(0, rgba(shade(opticalRgb, 1.03, 3), .73));
        body.addColorStop(.22, rgba(opticalRgb, .77));
        body.addColorStop(.68, rgba(shade(opticalRgb, .91), .82));
        body.addColorStop(1, rgba(shade(opticalRgb, .61), .91));
        const amplitude = reduced ? 0 : Math.min(1.4, rippleTime * 1.05);
        ctx.beginPath();ctx.moveTo(left - 5, g.bottom + 9);ctx.lineTo(left - 5, liquidY);
        for (let x = left - 5; x <= right + 7; x += 3) {
          const taper = 1 - Math.min(1, Math.abs(x - X) / (rim * .5));
          ctx.lineTo(x, liquidY + Math.sin((x - X) * .11 + t * 7.5) * amplitude * taper);
        }
        ctx.lineTo(right + 7, g.bottom + 9);ctx.closePath();ctx.fillStyle = body;ctx.fill();

        ctx.save();ctx.beginPath();ctx.rect(left - 4, liquidY + 1, rim + 8, g.bottom - liquidY + 10);ctx.clip();
        const transmission = ctx.createLinearGradient(left, 0, right, 0);
        transmission.addColorStop(0, 'rgba(23,23,16,.42)');transmission.addColorStop(.055, 'rgba(27,24,14,.22)');
        transmission.addColorStop(.19, rgba(lightRgb, .055));transmission.addColorStop(.46, rgba(lightRgb, .14));
        transmission.addColorStop(.72, rgba(lightRgb, .035));transmission.addColorStop(.95, 'rgba(31,25,14,.30)');transmission.addColorStop(1, 'rgba(23,23,16,.46)');
        ctx.fillStyle = transmission;ctx.fillRect(left - 3, liquidY, rim + 6, g.bottom - liquidY + 9);
        // Narrow, curved caustic bands read as transmitted light through a
        // cylindrical wall, without washing the drink's center into cream.
        const refractedLight = ctx.createLinearGradient(0, liquidY, 0, g.bottom);
        refractedLight.addColorStop(0, rgba(lightRgb, .08));refractedLight.addColorStop(.25, rgba(lightRgb, .38));
        refractedLight.addColorStop(.7, rgba(lightRgb, .20));refractedLight.addColorStop(1, rgba(lightRgb, .44));
        ctx.strokeStyle = refractedLight;ctx.lineWidth = 1.25;
        sidePath(ctx, g, 1, 11, clamp((g.bottom - liquidY) / g.cup.height, .01, 1), .035);ctx.stroke();
        ctx.lineWidth = .65;sidePath(ctx, g, -1, 17, clamp((g.bottom - liquidY) / g.cup.height, .01, 1), .045);ctx.stroke();
        // A small natural caustic at the foot, rather than a uniform flat fill.
        const caustic = ctx.createRadialGradient(X - rim * .1, g.bottom - 15, 1, X - rim * .1, g.bottom - 15, rim * .52);
        caustic.addColorStop(0, rgba(lightRgb, .37));caustic.addColorStop(.5, rgba(lightRgb, .07));caustic.addColorStop(1, rgba(lightRgb, 0));
        ctx.fillStyle = caustic;ctx.fillRect(left, liquidY, rim, g.bottom - liquidY + 8);

        // Different nucleation lanes, radii and speeds keep carbonation organic.
        const depth = Math.max(1, g.bottom - liquidY - 5);
        const bubbleCount = Math.min(104, 30 + Math.ceil(depth * .26));
        for (let i = 0; i < bubbleCount; i++) {
          const seed = noise(i + 17), lane = noise(i + 91), speed = 9 + noise(i + 32) * 23;
          const progress = fract(seed + (reduced ? 0 : t * speed / depth));
          const y = g.bottom - 4 - progress * depth;
          const v = clamp((g.bottom - y) / g.cup.height, 0, 1);
          const x = X + (lane - .5) * g.width(v) * .84 + (reduced ? 0 : Math.sin(t * .8 + i) * .75);
          const radius = .28 + noise(i + 54) ** 3 * 1.5 + progress * .24;
          ellipse(ctx, x, y, radius, radius * 1.12, rgba(lightRgb, .025), rgba(lightRgb, .48), .34);
          ellipse(ctx, x - radius * .28, y - radius * .43, Math.max(.16, radius * .25), Math.max(.15, radius * .20), 'rgba(255,255,240,.76)');
        }
        ctx.restore();

        // The meniscus follows the exact mapped liquid boundary. Depth is
        // suggested below that line, so perspective never changes the target.
        const surfaceWidth = g.width(clamp((g.bottom - liquidY) / g.cup.height, 0, 1)) / 2 - 2;
        ctx.beginPath();ctx.ellipse(X, liquidY + 1.4, Math.max(1, surfaceWidth), 3, 0, 0, Math.PI);
        ctx.strokeStyle = rgba(shade(drinkRgb, .48), .42);ctx.lineWidth = 1.7;ctx.stroke();
        ctx.beginPath();ctx.ellipse(X, liquidY + 1, Math.max(1, surfaceWidth), 2.5, 0, 0, Math.PI);
        ctx.strokeStyle = rgba(lightRgb, .70);ctx.lineWidth = .75;ctx.stroke();
      }

      if (foam > .001) {
        const height = Math.max(.1, liquidY - foamY);
        const froth = ctx.createLinearGradient(0, foamY, 0, liquidY + 2);
        froth.addColorStop(0, '#fffdf2');froth.addColorStop(.25, '#f5efd9');
        froth.addColorStop(.78, '#e2d5b4');froth.addColorStop(1, rgba(lightRgb, .92));
        ctx.save();
        ctx.beginPath();ctx.moveTo(left - 3, liquidY + 1.1);ctx.lineTo(left - 3, foamY);
        for (let x = left - 3; x <= right + 5; x += 2) {
          const rough = Math.sin(x * .51) * .43 + Math.sin(x * .177 + (reduced ? 0 : t * .45)) * .45;
          // Less than a pixel of texture; the volume line itself is unchanged.
          ctx.lineTo(x, foamY + rough * Math.min(1, height / 3));
        }
        ctx.lineTo(right + 5, liquidY + 1.1);ctx.closePath();ctx.fillStyle = froth;ctx.fill();ctx.clip();
        const edge = ctx.createLinearGradient(left, 0, right, 0);
        edge.addColorStop(0, 'rgba(111,94,57,.30)');edge.addColorStop(.13, 'rgba(255,255,247,0)');edge.addColorStop(.7, 'rgba(255,255,247,.23)');edge.addColorStop(1, 'rgba(111,94,57,.27)');
        ctx.fillStyle = edge;ctx.fillRect(left, foamY - 2, rim, height + 5);
        const cells = Math.min(145, 24 + Math.ceil(height * 2));
        for (let i = 0; i < cells; i++) {
          const x = left + noise(i + 201) * rim;
          const y = foamY + .7 + noise(i + 364) * Math.max(.5, height - 1);
          const r = Math.min(Math.max(.45, height * .28), .5 + noise(i + 88) ** 2 * 3.7);
          ellipse(ctx, x, y, r, r * (.76 + noise(i + 12) * .25), 'rgba(220,206,167,.10)', 'rgba(172,150,108,.28)', .45);
          if (r > 1.1) {
            ctx.beginPath();ctx.arc(x - .15, y - .2, r * .73, Math.PI * 1.05, Math.PI * 1.58);
            ctx.strokeStyle = 'rgba(255,255,250,.84)';ctx.lineWidth = .6;ctx.stroke();
          }
        }
        ctx.restore();
      }

      const surfaceY = foam > .001 ? foamY : liquidY;
      if (!reduced && rippleTime > 0 && fill + foam > .008) {
        const intensity = Math.min(1, rippleTime / .75);
        ctx.save();
        ctx.beginPath();ctx.rect(left, surfaceY, rim, Math.max(4, Math.min(12, g.bottom - surfaceY)));ctx.clip();
        for (let i = 0; i < 3; i++) {
          const q = fract(t * 1.8 + i / 3), radius = 4 + q * Math.min(rim * .35, 45);
          ellipse(ctx, X, surfaceY + 2, radius, 1.2 + q * 3.8, null,
            foam > .001 ? `rgba(170,147,104,${(1 - q) * .25 * intensity})` : rgba(lightRgb, (1 - q) * .52 * intensity), .72);
        }
        ctx.restore();
      }
    }

    function drawGlass(ctx, g, fill, t, suppliedPath) {
      const rim = g.width(1), left = X - rim / 2, right = X + rim / 2;
      // Fresnel reflection becomes strongest at the edges of the curved glass.
      const edge = ctx.createLinearGradient(left, 0, right, 0);
      edge.addColorStop(0, 'rgba(22,53,48,.69)');edge.addColorStop(.018, 'rgba(239,255,249,.86)');
      edge.addColorStop(.042, 'rgba(33,65,58,.32)');edge.addColorStop(.08, 'rgba(219,241,228,.12)');
      edge.addColorStop(.23, 'rgba(255,255,248,.025)');edge.addColorStop(.76, 'rgba(255,255,248,.01)');
      edge.addColorStop(.91, 'rgba(245,252,239,.13)');edge.addColorStop(.969, 'rgba(24,50,44,.38)');
      edge.addColorStop(.987, 'rgba(255,255,247,.77)');edge.addColorStop(1, 'rgba(25,53,47,.67)');
      ctx.fillStyle = edge;ctx.fillRect(left - 1, g.top, rim + 2, g.cup.height + 10);

      // A reflected window with crisp inner lines and a soft falloff. Reflection
      // stays fixed to the glass; aiming never depends on an animated silhouette.
      const reflection = ctx.createLinearGradient(left, 0, left + rim * .3, 0);
      reflection.addColorStop(0, 'rgba(255,255,248,0)');reflection.addColorStop(.15, 'rgba(255,255,248,.06)');
      reflection.addColorStop(.3, 'rgba(255,255,248,.48)');reflection.addColorStop(.41, 'rgba(255,255,248,.31)');
      reflection.addColorStop(.53, 'rgba(255,255,248,.04)');reflection.addColorStop(.64, 'rgba(255,255,248,.16)');reflection.addColorStop(1, 'rgba(255,255,248,0)');
      ctx.fillStyle = reflection;ctx.fillRect(left, g.top + 8, rim * .31, g.cup.height - 16);
      const softbox = ctx.createLinearGradient(right - rim * .23, 0, right, 0);
      softbox.addColorStop(0, 'rgba(212,239,233,0)');softbox.addColorStop(.42, 'rgba(212,239,233,.025)');
      softbox.addColorStop(.68, 'rgba(255,255,246,.22)');softbox.addColorStop(.76, 'rgba(255,255,246,.38)');softbox.addColorStop(1, 'rgba(255,255,246,0)');
      ctx.fillStyle = softbox;ctx.fillRect(right - rim * .23, g.top + 14, rim * .23, g.cup.height - 21);

      const highlight = ctx.createLinearGradient(0, g.top + 6, 0, g.bottom - 8);
      highlight.addColorStop(0, 'rgba(255,255,255,.82)');highlight.addColorStop(.25, 'rgba(255,255,255,.45)');highlight.addColorStop(.65, 'rgba(255,255,255,.14)');highlight.addColorStop(1, 'rgba(255,255,255,.43)');
      ctx.lineCap = 'round';ctx.strokeStyle = highlight;ctx.lineWidth = 1.3;
      sidePath(ctx, g, -1, 7, .96, .045);ctx.stroke();
      ctx.lineWidth = .8;sidePath(ctx, g, 1, 5.5, .93, .045);ctx.stroke();

      // Condensation is anchored, sparse and deterministic; droplets do not
      // obscure the exact liquid/foam boundary or simulate extra beverage.
      if (fill > .025) {
        const liquidY = g.level(fill);
        for (let i = 0; i < 25; i++) {
          const v = .1 + noise(i + 601) * .79, y = g.bottom - v * g.cup.height;
          if (y < liquidY - 14 || y > g.bottom - 16) continue;
          const lane = noise(i + 712), side = lane < .5 ? -1 : 1;
          const x = X + side * g.width(v) * (.25 + noise(i + 823) * .20);
          const r = .55 + noise(i + 934) * 1.15;
          ellipse(ctx, x, y, r, r * 1.35, 'rgba(245,255,246,.06)', 'rgba(26,52,44,.16)', .42);
          ellipse(ctx, x - r * .24, y - r * .58, r * .35, r * .23, 'rgba(255,255,253,.73)');
        }
      }

      // Thick, polished glass foot: dark refraction behind two clean highlights.
      const base = ctx.createLinearGradient(0, g.bottom - 8, 0, g.bottom + 5);
      base.addColorStop(0, 'rgba(35,69,56,.05)');base.addColorStop(.27, 'rgba(22,47,40,.28)');
      base.addColorStop(.48, 'rgba(242,255,238,.76)');base.addColorStop(.61, 'rgba(88,118,99,.63)');
      base.addColorStop(.87, 'rgba(237,251,222,.72)');base.addColorStop(1, 'rgba(25,51,42,.53)');
      ctx.fillStyle = base;ctx.fillRect(left, g.bottom - 8, rim, 15);
      ellipse(ctx, X, g.bottom - 1, g.width(0) * .47, 3.5, null, 'rgba(255,255,240,.64)', .8);
    }

    function drawRim(ctx, g) {
      const width = g.width(1) / 2;
      const rim = ctx.createLinearGradient(X - width, g.top - 5, X + width, g.top + 5);
      rim.addColorStop(0, 'rgba(23,49,44,.79)');rim.addColorStop(.12, 'rgba(232,254,244,.94)');
      rim.addColorStop(.36, 'rgba(255,255,252,.97)');rim.addColorStop(.55, 'rgba(105,130,112,.75)');
      rim.addColorStop(.8, 'rgba(235,254,237,.95)');rim.addColorStop(1, 'rgba(20,48,40,.8)');
      ellipse(ctx, X, g.top, width, 5.5, 'rgba(224,243,225,.06)', 'rgba(28,51,45,.60)', 2.6);
      ellipse(ctx, X, g.top - .7, Math.max(1, width - .5), 5.1, null, rim, 1.7);
      ellipse(ctx, X, g.top + .2, Math.max(1, width - 3.2), 3.7, null, 'rgba(34,56,47,.31)', .65);
      ctx.beginPath();ctx.ellipse(X, g.top + .6, width - 1, 5, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(255,255,247,.90)';ctx.lineWidth = .9;ctx.stroke();
    }

    function drawEffects(ctx, g, fill, foam, sodaRgb, lightRgb, t, pouring) {
      const surface = fill + foam > .001 ? g.level(Math.min(1, fill + foam)) : g.bottom - 4;
      if (pouring) {
        const stream = ctx.createLinearGradient(X - 5, 0, X + 5, 0);
        stream.addColorStop(0, rgba(shade(sodaRgb, .58), .69));stream.addColorStop(.2, rgba(sodaRgb, .91));
        stream.addColorStop(.45, rgba(lightRgb, .97));stream.addColorStop(.62, rgba(sodaRgb, .90));stream.addColorStop(1, rgba(shade(sodaRgb, .62), .52));
        const wiggle = y => reduced ? 0 : Math.sin(y * .15 - t * 30) * .42;
        ctx.beginPath();ctx.moveTo(X - 5, NOZZLE_Y);
        for (let y = NOZZLE_Y; y < surface; y += 6) ctx.lineTo(X - 5 + wiggle(y), y);
        ctx.lineTo(X + 4.4, surface);
        for (let y = surface; y >= NOZZLE_Y; y -= 6) ctx.lineTo(X + 4.4 + wiggle(y + 9), y);
        ctx.closePath();ctx.fillStyle = stream;ctx.fill();
        ctx.beginPath();ctx.moveTo(X - 1.2, NOZZLE_Y);ctx.lineTo(X - 1.2, Math.max(NOZZLE_Y, surface - 2));
        ctx.strokeStyle = rgba(lightRgb, .72);ctx.lineWidth = .85;ctx.stroke();
        ellipse(ctx, X, surface + 1, 7.5, 2.4, foam > .001 ? 'rgba(255,250,228,.9)' : rgba(lightRgb, .55));
      }
      if (spillTime > 0) {
        const fade = Math.min(1, spillTime / .75);
        for (let i = 0; i < 4; i++) {
          const side = i % 2 ? -1 : 1;
          const progress = reduced ? 1 : Math.min(1, fract(time * .6 + i * .24) * 1.4);
          const stop = 1 - progress, inset = -1.5 - (i > 1 ? 3 : 0);
          sidePath(ctx, g, side, inset, .995, stop);
          ctx.strokeStyle = foam > .01 ? `rgba(247,238,210,${fade * .76})` : rgba(sodaRgb, fade * .66);
          ctx.lineWidth = i > 1 ? 1.7 : 3.3;ctx.lineCap = 'round';ctx.stroke();
          sidePath(ctx, g, side, inset - .6, .995, stop);
          ctx.strokeStyle = `rgba(255,255,239,${fade * .48})`;ctx.lineWidth = .7;ctx.stroke();
        }
      }
      if (!reduced) {
        for (const p of particles) {
          const opacity = Math.min(1, p.life / .2) * (p.kind === 'spill' ? .83 : .80);
          const elongation = p.kind === 'impact' ? 1.2 : Math.min(2.8, 1 + Math.abs(p.vy) / 180);
          ellipse(ctx, p.x, p.y, p.radius, p.radius * elongation,
            p.kind === 'spill' && foam > .01 ? `rgba(244,232,199,${opacity})` : rgba(sodaRgb, opacity), rgba(shade(sodaRgb, .5), opacity * .2), .35);
          ellipse(ctx, p.x - p.radius * .25, p.y - p.radius * .35, Math.max(.25, p.radius * .3), Math.max(.3, p.radius * elongation * .35), rgba(lightRgb, opacity));
        }
      }
    }

    function draw(ctx, options = {}) {
      const g = options.geometry;
      if (!ctx || !validGeometry(g)) return false;
      const fill = clamp(options.fill, 0, 1), foam = clamp(options.foam, 0, 1);
      const spillMl = clamp(options.spillMl, 0, 1e9);
      const drinkRgb = parseColor(options.drink?.color), lightRgb = parseColor(options.drink?.light || '#ffda9b');
      const sodaRgb = parseColor(options.soda?.color || options.drink?.color), sodaLight = parseColor(options.soda?.light || options.drink?.light || '#ffda9b');
      const t = reduced ? 0 : clamp(options.time ?? time, 0, 1e9);
      ctx.save();
      try {
        ctx.lineCap = 'round';ctx.lineJoin = 'round';
        drawGround(ctx, g, spillMl, drinkRgb);
        glassPath(ctx, g, options.path);
        const back = ctx.createLinearGradient(X - g.width(1) / 2, 0, X + g.width(1) / 2, 0);
        back.addColorStop(0, 'rgba(123,161,147,.20)');back.addColorStop(.2, 'rgba(236,249,237,.06)');back.addColorStop(.62, 'rgba(210,234,218,.018)');back.addColorStop(1, 'rgba(142,171,152,.19)');
        ctx.fillStyle = back;ctx.fill();
        ctx.save();ctx.clip();
        drawLiquid(ctx, g, fill, foam, drinkRgb, lightRgb, t);
        options.drawInside?.();
        drawGlass(ctx, g, fill, t, options.path);
        options.drawMark?.();
        ctx.restore();
        // Fine tinted contour: depth without the former heavy cartoon outline.
        glassPath(ctx, g, options.path);ctx.strokeStyle = 'rgba(22,48,41,.64)';ctx.lineWidth = .9;ctx.stroke();
        drawRim(ctx, g);
        options.drawRim?.();
        drawEffects(ctx, g, fill, foam, sodaRgb, sodaLight, t, options.pouring ?? wasPouring);
      } finally { ctx.restore(); }
      return true;
    }

    // diagnostics() exposes only presentation counters, useful for bounded
    // lifecycle tests; it never exposes or takes ownership of engine state.
    const diagnostics = () => Object.freeze({particles: particles.length, limit: MAX_PARTICLES,
      rippleTime, spillTime, dripTime, time, reducedMotion: reduced});
    return Object.freeze({reset, update, isAnimating, draw, diagnostics, debugSummary: diagnostics});
  }

  window.PourVisuals = Object.freeze({create});
})();
