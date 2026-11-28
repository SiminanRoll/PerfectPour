/* Perfect Pour V1.06 · illustrated glass, living ingredients and counter spills.
 * This layer reads the engine's liquid/foam volumes. It never changes a pour,
 * target, score, ingredient selection or payment.
 */
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const CENTER = 260;
  const INK = '#174b49';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
  const fract = n => n - Math.floor(n);
  const noise = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
  let scene = null;

  function shade(color) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
    const channels = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
    const warm = [91, 46, 33];
    return '#' + channels.map((v, i) => Math.round(v * .84 + warm[i] * .16).toString(16).padStart(2, '0')).join('');
  }

  function hash(value) {
    let h = 2166136261;
    for (const char of String(value ?? 'counter')) {
      h ^= char.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function reset(customerKey) {
    scene = {
      key: String(customerKey ?? 'counter'),
      seed: hash(customerKey) % 997,
      clock: 0,
      lastTime: null,
      lastSpill: null,
      spillEnergy: 0,
      emission: 0,
      turbulence: 0,
      ingredients: [],
      drips: [],
      serial: 0,
      previousSyrup: 0,
      previousLiquidY: null,
      syrupAge: 0,
      animating: false
    };
  }

  function cupPath(ctx, g, inset = 0) {
    const height = g.bottom - g.top;
    ctx.beginPath();
    ctx.moveTo(CENTER - g.width(1) / 2 + inset, g.top);
    for (let i = 24; i >= 0; i--) {
      const u = i / 24;
      ctx.lineTo(CENTER - g.width(u) / 2 + inset, g.bottom - u * height);
    }
    ctx.quadraticCurveTo(CENTER, g.bottom + 7 - inset, CENTER + g.width(0) / 2 - inset, g.bottom);
    for (let i = 1; i <= 24; i++) {
      const u = i / 24;
      ctx.lineTo(CENTER + g.width(u) / 2 - inset, g.bottom - u * height);
    }
    ctx.closePath();
  }

  function ellipse(ctx, x, y, rx, ry, rotation = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rotation, 0, TAU);
  }

  function wallAt(g, y) {
    return g.width(clamp((g.bottom - y) / (g.bottom - g.top), 0, 1)) / 2;
  }

  function spawnIngredient(type, index, g, initial, reducedMotion) {
    const salt = scene.seed + index * 21 + ({cherry: 9, lime: 51, ice: 119}[type]);
    const r = type === 'ice' ? 12 + noise(salt) * 3.5 : type === 'lime' ? 15 : 8.2;
    const lane = type === 'cherry' ? (index ? .27 : -.23) : type === 'lime' ? .27 : ((index % 3) - 1) * .25;
    return {
      type, index, r, salt,
      x: CENTER + lane * Math.max(45, g.width(1) - 28),
      y: initial || reducedMotion ? g.bottom - r - 6 : g.top - r - 23,
      vx: initial || reducedMotion ? 0 : (noise(salt + 2) - .5) * 22,
      vy: 0,
      angle: (noise(salt + 3) - .5) * 1.1,
      spin: (noise(salt + 4) - .5) * 2.5,
      delay: initial || reducedMotion ? 0 : index * .065,
      entered: initial || reducedMotion,
      touchedLiquid: false,
      initialized: initial || reducedMotion
    };
  }

  function syncIngredients(o, g, fresh) {
    const wanted = {
      cherry: clamp(Math.round(finite(o.cherries)), 0, 2),
      lime: clamp(Math.round(finite(o.lime)), 0, 1),
      ice: clamp(Math.round(finite(o.ice)), 0, 2) * 3
    };
    scene.ingredients = scene.ingredients.filter(p => p.index < wanted[p.type]);
    for (const type of ['ice', 'cherry', 'lime']) {
      for (let index = 0; index < wanted[type]; index++) {
        if (!scene.ingredients.some(p => p.type === type && p.index === index)) {
          scene.ingredients.push(spawnIngredient(type, index, g, fresh, !!o.reducedMotion));
        }
      }
    }
  }

  function staticIngredient(p, g, liquidY) {
    const depth = Math.max(0, g.bottom - liquidY - 8);
    const width = g.width(clamp((g.bottom - liquidY) / (g.bottom - g.top), 0, 1));
    const wet = depth > p.r * 1.5;
    if (p.type === 'ice') {
      const row = Math.floor(p.index / 3), col = p.index % 3;
      const verticalRadius = p.r * (Math.abs(Math.cos(p.angle)) + Math.abs(Math.sin(p.angle)));
      p.x = CENTER + (col - 1) * Math.min(28, width * .21) + row * 6 - 3;
      p.y = wet ? liquidY + verticalRadius * .65 + row * p.r * 1.48 : g.bottom - p.r - 6 - row * p.r * 1.6;
    } else if (p.type === 'cherry') {
      p.x = CENTER + (p.index ? 1 : -1) * Math.min(25, g.width(.2) * .18);
      const floatDepth = p.r * (scene.ingredients.some(item => item.type === 'ice') ? 3 : 1.2);
      p.y = wet ? liquidY + Math.min(depth - p.r, floatDepth + p.index * 3) : g.bottom - p.r - 6;
    } else {
      p.x = CENTER + Math.min(34, width * .26);
      p.y = wet ? liquidY + p.r * .23 : g.bottom - p.r - 6;
    }
    p.y = Math.min(g.bottom - p.r - 6, p.y);
    p.x = clamp(p.x, CENTER - wallAt(g, p.y) + p.r + 5, CENTER + wallAt(g, p.y) - p.r - 5);
    p.vx = p.vy = p.spin = 0;
    p.delay = 0;
    p.touchedLiquid = wet;
    p.entered = p.initialized = true;
  }

  function updateIngredients(o, g, liquidY, dt, fresh) {
    const all = scene.ingredients;
    const surfaceTravel = scene.previousLiquidY === null ? 0 : clamp(scene.previousLiquidY - liquidY, -18, 18);
    scene.previousLiquidY = liquidY;
    if (o.reducedMotion || fresh) {
      for (const p of all) staticIngredient(p, g, liquidY);
      return;
    }
    if (!dt) return;
    // A rising body of soda carries its floating inclusions. Buoyancy then
    // resolves their immersion, while the nozzle jet can still push them down.
    // Cherries have much more inertia than ice and follow the rising drink less.
    for (const p of all) {
      if (p.entered && p.delay <= 0 && p.y + p.r > liquidY) {
        // Once a cube reaches the surface, stop carrying it upward as though
        // it were still deep in the rising liquid. Otherwise the whole group
        // can be lifted above the drink during a fast fill or foam collapse.
        const carry = p.type === 'ice' ? .88 * clamp((p.y - liquidY) / (p.r * 1.4), 0, 1) : p.type === 'lime' ? .72 : .19;
        p.y -= surfaceTravel * carry;
      }
    }
    const steps = Math.max(1, Math.ceil(dt / (1 / 120))), step = dt / steps;
    const force = scene.turbulence;
    for (let n = 0; n < steps; n++) {
      for (const p of all) {
        if (p.delay > 0) { p.delay = Math.max(0, p.delay - step); continue; }
        const verticalRadius = p.type === 'ice' ? p.r * (Math.abs(Math.cos(p.angle)) + Math.abs(Math.sin(p.angle))) : p.r;
        const wet = clamp((p.y + verticalRadius - liquidY) / (verticalRadius * 2), 0, 1);
        if (wet > .05) p.touchedLiquid = true;
        // Ice rests about 83% submerged, including its rotated outline.
        const buoyancy = p.type === 'ice' ? 1.2 : p.type === 'lime' ? 1.32 : 1.08;
        const core = Math.exp(-Math.pow((p.x - CENTER) / 23, 2));
        const side = p.x < CENTER ? -1 : 1;
        let ax = 0;
        let ay = (p.type === 'ice' ? 420 : 300) * (1 - wet * buoyancy);
        if (p.type === 'ice' && wet > 0) {
          // A damped return brings deeply jostled cubes back to their floating
          // level without letting a released pour launch them above the drink.
          ay += clamp((liquidY + verticalRadius * .65 - p.y) * 4, -160, 80);
        }
        if (p.type === 'cherry' && wet > 0) {
          // Fruit keeps its heavy initial drop, then caught fizz brings it
          // back into the drink. A damped recovery prevents an almost-neutral
          // cherry from spending tens of seconds on the bottom after release.
          const floatDepth = p.r * (all.some(item => item.type === 'ice') ? 3 : 1.2);
          const target = liquidY + floatDepth + p.index * 3;
          ay += clamp((target - p.y) * (o.pouring ? 4 : 16), -420, 180) * wet;
        }
        if (wet > 0) {
          // A small downward jet and upward return flow move each ingredient
          // independently. The engine remains the only owner of liquid volume.
          ax = force * wet * (side * core * 72 + Math.sin(scene.clock * 2.6 + p.salt) * 24);
          ay += force * wet * (core * 165 - (1 - core) * 66);
          p.spin += force * wet * (Math.sin(scene.clock * 3 + p.salt) * .7 + side * .8) * step;
        }
        p.vx += ax * step;
        p.vy += ay * step;
        const drag = Math.exp(-step * (wet > 0 ? (p.type === 'ice' ? 5.2 + wet * 1.2 : p.type === 'cherry' ? 5.2 + wet * .8 : 2.8 + wet * 1.4) : .25));
        p.vx = clamp(p.vx * drag, -115, 115);
        p.vy = clamp(p.vy * drag, -160, 240);
        p.x += p.vx * step;
        p.y += p.vy * step;
        p.angle += p.spin * step;
        p.spin *= Math.exp(-step * (wet ? 1.1 : .3));
        if (p.y > g.top + p.r) p.entered = true;
        const limit = Math.max(p.r + 2, wallAt(g, p.y) - p.r - 5);
        if (p.x < CENTER - limit) { p.x = CENTER - limit; p.vx = Math.abs(p.vx) * .32; p.spin += .14; }
        if (p.x > CENTER + limit) { p.x = CENTER + limit; p.vx = -Math.abs(p.vx) * .32; p.spin -= .14; }
        if (p.y > g.bottom - p.r - 6) {
          p.y = g.bottom - p.r - 6;
          p.vy = p.vy > 7 ? -p.vy * .16 : 0;
          p.vx *= .92;
          p.spin *= .85;
        }
        if (p.entered && p.y < g.top - p.r * .3) {
          p.y = g.top - p.r * .3;
          p.vy = Math.max(0, p.vy);
        }
      }
      // At most nine ingredients: one small pairwise collision pass is bounded.
      for (let a = 0; a < all.length; a++) {
        const p = all[a];
        if (p.delay > 0) continue;
        for (let b = a + 1; b < all.length; b++) {
          const q = all[b];
          if (q.delay > 0) continue;
          let dx = q.x - p.x, dy = q.y - p.y;
          const min = (p.r + q.r) * .77;
          let distance = Math.hypot(dx, dy);
          if (distance >= min) continue;
          if (distance < .001) { dx = .01; dy = -.01; distance = Math.SQRT2 * .01; }
          const nx = dx / distance, ny = dy / distance, correction = (min - distance) * .45;
          p.x -= nx * correction; p.y -= ny * correction;
          q.x += nx * correction; q.y += ny * correction;
          const approach = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
          if (approach < 0) {
            const impulse = approach * .32;
            p.vx += impulse * nx; p.vy += impulse * ny;
            q.vx -= impulse * nx; q.vy -= impulse * ny;
            p.spin -= impulse * .009; q.spin += impulse * .009;
          }
        }
      }
      // Collision separation can push a resting piece slightly into a wall;
      // restore the same interior bounds before this step is displayed.
      for (const p of all) {
        if (p.delay > 0) continue;
        const half = Math.max(p.r + 2, wallAt(g, p.y) - p.r - 5);
        p.x = clamp(p.x, CENTER - half, CENTER + half);
        p.y = Math.min(p.y, g.bottom - p.r - 6);
        if (p.type === 'ice' && p.entered && p.touchedLiquid && g.bottom - liquidY > p.r * 2.5) {
          const verticalRadius = p.r * (Math.abs(Math.cos(p.angle)) + Math.abs(Math.sin(p.angle)));
          const highestBob = liquidY + verticalRadius * .5;
          // Pairwise contact can stack one cube on top of the others. Keep
          // that collision response in the drink, with only a small protrusion.
          if (p.y < highestBob) { p.y = highestBob; p.vy = Math.max(0, p.vy) * .3; }
        }
      }
    }
  }

  function updateSpills(o, dt, fresh) {
    const spill = Math.max(0, finite(o.spillMl));
    if (fresh || scene.lastSpill === null) scene.lastSpill = spill;
    const delta = Math.max(0, spill - scene.lastSpill);
    scene.lastSpill = spill;
    if (dt > 0) {
      scene.spillEnergy *= Math.exp(-dt * 2.6);
      if (delta > .0001) {
        scene.spillEnergy = Math.min(1, scene.spillEnergy + Math.max(.15, delta * .2));
        scene.emission += delta;
        let made = 0;
        while (scene.emission >= .25 && scene.drips.length < 8 && made < 2) {
          scene.emission -= .25;
          const id = scene.serial++;
          scene.drips.push({age: 0, life: .95 + noise(id + scene.seed) * .35, side: id % 2 ? 1 : -1, salt: id + scene.seed, width: 1.7 + noise(id + 8) * 1.7});
          made++;
        }
        scene.emission = Math.min(scene.emission, .75);
      }
      for (const p of scene.drips) p.age += dt;
      scene.drips = scene.drips.filter(p => p.age < p.life + .15);
    }
  }

  function puddle(ctx, g, spill, color) {
    const base = g.bottom + 8;
    // A layered contact shadow plants even an empty glass on the counter.
    for (let i = 3; i >= 0; i--) {
      ellipse(ctx, CENTER + 4, base + 1, g.width(0) * .56 + i * 7, 5 + i * 2.3);
      ctx.fillStyle = `rgba(15, 61, 57, ${.035 + (3 - i) * .015})`;
      ctx.fill();
    }
    if (spill < .025) return;
    const spread = clamp(15 + Math.sqrt(spill) * 8.5, 15, 157);
    const width = Math.max(g.width(0) * .55, spread);
    const depth = Math.min(14, 4.5 + Math.sqrt(spill) * .85);
    ctx.save();
    ctx.globalAlpha = .56;
    const gradient = ctx.createLinearGradient(0, base - depth, 0, base + depth + 4);
    gradient.addColorStop(0, '#fff2d0');
    gradient.addColorStop(.24, color);
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(CENTER - width, base - 1);
    ctx.bezierCurveTo(CENTER - width - 14, base - depth, CENTER - width * .35, base - depth * .8, CENTER - 17, base - depth * .9);
    ctx.bezierCurveTo(CENTER + width * .5, base - depth * 1.6, CENTER + width * .9, base - depth * .4, CENTER + width, base);
    ctx.bezierCurveTo(CENTER + width + 24, base + depth * .7, CENTER + width * .41, base + depth, CENTER + 19, base + depth * .72);
    ctx.bezierCurveTo(CENTER - width * .37, base + depth * 1.5, CENTER - width - 23, base + depth * .9, CENTER - width, base - 1);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle = color;ctx.lineWidth = .9;ctx.stroke();
    ctx.globalAlpha = .55;
    ctx.strokeStyle = '#fff7de';ctx.lineWidth = 1.5;ctx.lineCap = 'round';
    ctx.beginPath();ctx.moveTo(CENTER - width * .78, base + depth * .42);ctx.quadraticCurveTo(CENTER - width * .59, base + depth * .64, CENTER - width * .35, base + depth * .45);ctx.stroke();
    ctx.beginPath();ctx.moveTo(CENTER + width * .47, base - depth * .26);ctx.lineTo(CENTER + width * .77, base - depth * .02);ctx.stroke();
    const spots = Math.min(8, Math.floor(spill / 2) + 1);
    for (let i = 0; i < spots; i++) {
      const side = i % 2 ? 1 : -1, salt = scene.seed + i * 7;
      const x = CENTER + side * (width + 10 + noise(salt) * 18);
      const y = base - 2 + (noise(salt + 2) - .2) * 18;
      ellipse(ctx, x, Math.min(g.bottom + 23, y), 1.6 + noise(salt + 8) * 4.5, .8 + noise(salt + 4) * 1.7, side * .13);
      ctx.fillStyle = color;ctx.globalAlpha = .35 + noise(salt + 9) * .17;ctx.fill();
    }
    ctx.restore();
  }

  function ingredientArt(ctx, p, wet) {
    ctx.save();
    ctx.translate(p.x, p.y);ctx.rotate(p.angle);
    const r = p.r;
    if (p.type === 'ice') {
      ctx.beginPath();
      ctx.moveTo(-r + 3, -r);ctx.lineTo(r - 3, -r + 1);ctx.quadraticCurveTo(r + 1, -r + 2, r, -r + 6);
      ctx.lineTo(r - 1, r - 3);ctx.quadraticCurveTo(r - 2, r + 1, r - 6, r);ctx.lineTo(-r + 2, r - 1);
      ctx.quadraticCurveTo(-r - 1, r - 3, -r, r - 7);ctx.lineTo(-r + 1, -r + 3);ctx.closePath();
      const frost = ctx.createLinearGradient(-r, -r, r, r);
      frost.addColorStop(0, 'rgba(255, 255, 242, .86)');
      frost.addColorStop(.37, 'rgba(212, 241, 231, .48)');
      frost.addColorStop(1, 'rgba(128, 186, 179, .32)');
      ctx.fillStyle = frost;ctx.fill();ctx.strokeStyle = 'rgba(245, 255, 242, .85)';ctx.lineWidth = 1.3;ctx.stroke();
      ctx.beginPath();ctx.moveTo(-r + 3, -r + 4);ctx.lineTo(r - 6, -r + 5);ctx.lineTo(r - 5, r - 5);
      ctx.strokeStyle = 'rgba(255, 255, 250, .72)';ctx.lineWidth = 1.7;ctx.stroke();
      ctx.beginPath();ctx.moveTo(-r + 4, r - 4);ctx.lineTo(-r + 6, -r + 6);ctx.lineTo(r - 5, -r + 5);
      ctx.strokeStyle = 'rgba(81, 141, 137, .24)';ctx.lineWidth = .8;ctx.stroke();
      ctx.beginPath();ctx.moveTo(-r * .25, -r * .47);ctx.lineTo(r * .12, -r * .08);ctx.lineTo(-r * .02, r * .53);
      ctx.strokeStyle = 'rgba(255, 255, 246, .54)';ctx.lineWidth = .7;ctx.stroke();
      ellipse(ctx, r * .25, -r * .32, r * .21, r * .11, -.5);ctx.fillStyle = 'rgba(255,255,249,.44)';ctx.fill();
    } else if (p.type === 'cherry') {
      const cherry = ctx.createRadialGradient(-r * .38, -r * .48, .5, 1, 1, r * 1.2);
      cherry.addColorStop(0, '#ffac95');cherry.addColorStop(.22, '#df5668');cherry.addColorStop(.66, '#b82750');cherry.addColorStop(1, '#67213d');
      ctx.fillStyle = cherry;
      ctx.beginPath();ctx.moveTo(0, -r * .65);
      ctx.bezierCurveTo(-r * .75, -r * 1.25, -r * 1.17, -r * .23, -r * .92, r * .35);
      ctx.bezierCurveTo(-r * .55, r * 1.1, r * .55, r * 1.1, r * .92, r * .28);
      ctx.bezierCurveTo(r * 1.14, -r * .38, r * .59, -r * 1.12, 0, -r * .65);
      ctx.closePath();ctx.fill();ctx.strokeStyle = '#6a294749';ctx.lineWidth = .7;ctx.stroke();
      ctx.beginPath();ctx.moveTo(0, -r * .65);ctx.quadraticCurveTo(-r * .1, -r * 1.13, r * .28, -r * 1.4);
      ctx.strokeStyle = '#526342';ctx.lineWidth = 1.35;ctx.lineCap = 'round';ctx.stroke();
      ellipse(ctx, -r * .39, -r * .4, r * .3, r * .18, -.6);ctx.fillStyle = '#ffe8d49c';ctx.fill();
      ellipse(ctx, r * .18, r * .66, r * .33, r * .12);ctx.fillStyle = '#f26d6a57';ctx.fill();
    } else {
      ctx.beginPath();ctx.moveTo(-r, r * .14);ctx.arc(0, r * .14, r, Math.PI, TAU);ctx.closePath();
      const rind = ctx.createLinearGradient(0, -r, 0, r * .14);rind.addColorStop(0, '#447d44');rind.addColorStop(1, '#a6c358');ctx.fillStyle = rind;ctx.fill();
      ctx.strokeStyle = '#356b45';ctx.lineWidth = 1;ctx.stroke();
      ctx.beginPath();ctx.moveTo(-r * .83, r * .02);ctx.arc(0, r * .02, r * .83, Math.PI, TAU);ctx.closePath();ctx.fillStyle = '#f0e8a4';ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + i * Math.PI / 5 + .035, b = Math.PI + (i + 1) * Math.PI / 5 - .035;
        ctx.beginPath();ctx.moveTo(0, -1);ctx.arc(0, -1, r * .68, a, b);ctx.closePath();ctx.fillStyle = i % 2 ? '#abc66d' : '#c6d887';ctx.fill();
      }
      ctx.beginPath();ctx.moveTo(-r * .72, -r * .24);ctx.quadraticCurveTo(-r * .3, -r * .78, r * .28, -r * .63);
      ctx.strokeStyle = '#fff9cd90';ctx.lineWidth = 1.5;ctx.stroke();
    }
    if (wet > .1) {
      // A restrained submerged glint integrates the objects into the soda.
      ctx.globalAlpha = wet * .15;ctx.strokeStyle = '#fff3c8';ctx.lineWidth = 1;
      ctx.beginPath();ctx.arc(-r * .25, -r * .15, r * .67, Math.PI * .9, Math.PI * 1.6);ctx.stroke();
    }
    ctx.restore();
  }

  function surfaceY(x, liquidY, motion, t) {
    const distance = Math.abs(x - CENTER);
    return liquidY + (Math.sin(x * .064 + t * 2.4) * .45 + motion * (Math.sin(distance * .17 - t * 8.5) * 1.6 * Math.exp(-distance / 70) + Math.exp(-distance * distance / 135) * 2.6));
  }

  function drawLiquid(ctx, o, g, liquidY, foamY, fill, foam) {
    const t = o.reducedMotion ? 0 : scene.clock, motion = o.reducedMotion ? 0 : scene.turbulence;
    const drink = o.drink || o.soda || {color: '#ef993f', light: '#ffd594'};
    cupPath(ctx, g, 2.7);ctx.save();ctx.clip();
    if (fill > .0002) {
      const liquid = ctx.createLinearGradient(CENTER, liquidY, CENTER, g.bottom + 6);
      liquid.addColorStop(0, drink.light);liquid.addColorStop(.10, drink.color);liquid.addColorStop(.72, drink.color);liquid.addColorStop(1, shade(drink.color));
      ctx.fillStyle = liquid;
      ctx.beginPath();ctx.moveTo(CENTER - 180, g.bottom + 9);ctx.lineTo(CENTER - 180, liquidY);
      for (let x = CENTER - 180; x <= CENTER + 180; x += 4) ctx.lineTo(x, surfaceY(x, liquidY, motion, t));
      ctx.lineTo(CENTER + 180, g.bottom + 9);ctx.closePath();ctx.fill();
      // Darker curved edges give the drink volume without hiding the fill line.
      const sides = ctx.createLinearGradient(CENTER - g.width(1) / 2, 0, CENTER + g.width(1) / 2, 0);
      sides.addColorStop(0, 'rgba(53,48,32,.24)');sides.addColorStop(.17, 'rgba(53,48,32,0)');sides.addColorStop(.70, 'rgba(255,235,178,0)');sides.addColorStop(.91, 'rgba(255,235,178,.13)');sides.addColorStop(1, 'rgba(53,48,32,.2)');
      ctx.fillStyle = sides;ctx.fill();
      const depth = g.bottom - liquidY;
      if (finite(o.syrup) > 0 && depth > 10) {
        ctx.save();ctx.beginPath();ctx.rect(CENTER - 180, liquidY + 2, 360, depth);ctx.clip();
        const fade = .16 * Math.exp(-(o.reducedMotion ? 0 : scene.syrupAge) * .025);
        for (let i = 0; i < Math.min(3, o.syrup + 1); i++) {
          ctx.beginPath();ctx.moveTo(CENTER - 24 + i * 23, liquidY - 3);
          ctx.bezierCurveTo(CENTER + 23 + i * 8, liquidY + depth * .24, CENTER - 30 + i * 10, liquidY + depth * .61, CENTER + 11 + i * 19, g.bottom + 4);
          ctx.strokeStyle = `rgba(136, 32, 63, ${fade})`;ctx.lineWidth = 3 + i * 2;ctx.stroke();
        }
        ctx.restore();
      }
      // Deterministic lanes avoid random flicker and never accumulate particles.
      const fizzBoost = clamp(finite(o.fizzMultiplier, 1), 1, 2);
      const count = Math.min(40, 17 + Math.round(fill * 14) + finite(o.ice) * 3 + Math.round((fizzBoost - 1) * 8));
      ctx.save();ctx.beginPath();ctx.rect(CENTER - 180, liquidY + 2.5, 360, depth + 2);ctx.clip();
      for (let i = 0; i < count; i++) {
        const salt = scene.seed + i * 17.7;
        const progress = fract(noise(salt) + t * (o.reducedMotion ? 0 : (.08 + noise(salt + 3) * .12 + motion * .045)));
        const y = g.bottom - 5 - progress * Math.max(1, depth - 5);
        const w = Math.max(1, wallAt(g, y) - 8);
        const x = CENTER + (noise(salt + 2) * 2 - 1) * w * .85 + Math.sin(progress * 8 + salt) * (o.reducedMotion ? 0 : 1.7);
        const r = .7 + noise(salt + 7) * 1.6 + progress * .4;
        ellipse(ctx, x, y, r, r * 1.08);
        ctx.fillStyle = 'rgba(255,248,219,.075)';ctx.fill();ctx.strokeStyle = 'rgba(255,250,222,.42)';ctx.lineWidth = .65;ctx.stroke();
        ctx.beginPath();ctx.arc(x - .2, y - .25, r * .53, Math.PI, Math.PI * 1.65);ctx.strokeStyle = 'rgba(255,255,240,.58)';ctx.lineWidth = .6;ctx.stroke();
      }
      // Fresh ice nucleates tiny trails at its own edges, visually tying the
      // extra fizz to the ingredient instead of adding unrelated particles.
      for (const p of scene.ingredients) {
        if (p.type !== 'ice' || p.delay > 0 || p.y + p.r < liquidY) continue;
        for (let i = 0; i < 3; i++) {
          const q = fract(t * .72 + noise(p.salt + i * 8));
          const y = p.y + p.r * .3 - q * Math.max(4, Math.min(54, p.y - liquidY + p.r * .3));
          const x = p.x + (i % 2 ? -1 : 1) * p.r * .55 + Math.sin(q * 7 + p.salt) * 1.3;
          ellipse(ctx, x, y, .65 + q * .8, .8 + q * .8);
          ctx.strokeStyle = `rgba(255,255,231,${(.25 + (fizzBoost - 1) * .25) * (1 - q * .5)})`;ctx.lineWidth = .65;ctx.stroke();
        }
      }
      ctx.restore();
      // A narrow surface ellipse is a material cue, not a second target.
      const surfaceWidth = Math.max(1, wallAt(g, liquidY) - 4);
      ellipse(ctx, CENTER, liquidY + .7, surfaceWidth, 3.2);
      ctx.fillStyle = drink.light;ctx.globalAlpha = .36;ctx.fill();ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,248,215,.5)';ctx.lineWidth = 1;ctx.stroke();
    }
    // Deeper objects sit beneath the foam; floating objects are drawn above it.
    for (const p of scene.ingredients) {
      if (p.delay <= 0 && p.entered && p.y > liquidY + p.r * .8) ingredientArt(ctx, p, clamp((p.y + p.r - liquidY) / (p.r * 2), 0, 1));
    }
    if (foam > .0008) {
      const foamDepth = Math.max(1, liquidY - foamY);
      const cap = ctx.createLinearGradient(0, foamY, 0, liquidY + 2);
      cap.addColorStop(0, '#fffdf0');cap.addColorStop(.48, '#fff3d8');cap.addColorStop(1, '#e9cda0');
      ctx.fillStyle = cap;ctx.beginPath();ctx.moveTo(CENTER - 180, liquidY + 2);ctx.lineTo(CENTER - 180, foamY);
      for (let x = CENTER - 180; x <= CENTER + 180; x += 4) {
        const irregular = Math.sin(x * .19 + t * .28) * 1.25 + Math.sin(x * .071 + 1.2) * .75;
        ctx.lineTo(x, foamY + (o.reducedMotion ? Math.sin(x * .19) : irregular));
      }
      ctx.lineTo(CENTER + 180, liquidY + 2);ctx.closePath();ctx.fill();
      ctx.save();ctx.beginPath();ctx.rect(CENTER - 180, foamY + 1, 360, Math.max(.1, foamDepth - 1));ctx.clip();
      const count = Math.min(55, 17 + Math.floor(foamDepth * .3));
      for (let i = 0; i < count; i++) {
        const salt = scene.seed + i * 3.1;
        const y = foamY + 2 + noise(salt + 2) * Math.max(1, foamDepth - 4);
        const x = CENTER + (noise(salt + 9) * 2 - 1) * (wallAt(g, y) - 5);
        const r = 1 + noise(salt + 5) * 3.1;
        ellipse(ctx, x, y, r, r * .81);ctx.fillStyle = 'rgba(255,255,245,.23)';ctx.fill();ctx.strokeStyle = 'rgba(182,143,92,.2)';ctx.lineWidth = .65;ctx.stroke();
      }
      ctx.restore();
    }
    for (const p of scene.ingredients) {
      if (p.delay <= 0 && p.entered && p.y <= liquidY + p.r * .8) ingredientArt(ctx, p, clamp((p.y + p.r - liquidY) / (p.r * 2), 0, 1));
    }
    if (o.pouring && fill > .0001) {
      const surface = foam > .0008 ? foamY : liquidY;
      ellipse(ctx, CENTER, surface + 1.4, 9 + motion * 4.5, 3);
      ctx.fillStyle = '#fff6d376';ctx.fill();
    }
    ctx.restore();
  }

  function glass(ctx, o, g, fill) {
    const left = CENTER - g.width(1) / 2, right = CENTER + g.width(1) / 2;
    ctx.save();cupPath(ctx, g);ctx.clip();
    const sheen = ctx.createLinearGradient(left, 0, right, 0);
    sheen.addColorStop(0, 'rgba(216,246,229,.36)');sheen.addColorStop(.045, 'rgba(255,255,238,.64)');sheen.addColorStop(.12, 'rgba(238,255,235,.1)');
    sheen.addColorStop(.48, 'rgba(255,255,255,0)');sheen.addColorStop(.79, 'rgba(255,255,235,.045)');sheen.addColorStop(.93, 'rgba(255,255,240,.34)');sheen.addColorStop(1, 'rgba(41,101,91,.22)');
    ctx.fillStyle = sheen;ctx.fillRect(left - 3, g.top - 3, right - left + 6, g.bottom - g.top + 12);
    ctx.strokeStyle = '#fffde5a3';ctx.lineWidth = 4;ctx.lineCap = 'round';ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const u = .87 - i / 20 * .61, x = CENTER - g.width(u) / 2 + 10, y = g.bottom - u * (g.bottom - g.top);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();ctx.strokeStyle = '#ffffff55';ctx.lineWidth = 1.5;ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const u = .81 - i / 16 * .64, x = CENTER + g.width(u) / 2 - 8, y = g.bottom - u * (g.bottom - g.top);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    // Condensation is concentrated at the edges, keeping the aiming area calm.
    for (let i = 0; i < 15; i++) {
      const salt = scene.seed + i * 13, u = .1 + noise(salt) * .79;
      const y = g.bottom - u * (g.bottom - g.top), side = i % 2 ? 1 : -1;
      const x = CENTER + side * (g.width(u) / 2 - 5 - noise(salt + 4) * 17);
      const r = .7 + noise(salt + 2) * 1.7;
      ellipse(ctx, x, y, r * .8, r * 1.15, side * .1);
      ctx.fillStyle = `rgba(255,255,240,${.18 + fill * .20})`;ctx.fill();ctx.strokeStyle = 'rgba(38,95,84,.12)';ctx.lineWidth = .6;ctx.stroke();
      ctx.beginPath();ctx.arc(x - r * .2, y - r * .2, r * .55, Math.PI, Math.PI * 1.7);ctx.strokeStyle = '#fffdee9c';ctx.stroke();
    }
    // Keep the familiar smiling glass as a small, printed maker's mark.
    const badgeY = g.bottom - 37;
    ctx.globalAlpha = .64;ellipse(ctx, CENTER, badgeY, 14, 14);ctx.fillStyle = '#fff4d8';ctx.fill();ctx.strokeStyle = '#d3a85b';ctx.lineWidth = 1;ctx.stroke();
    ctx.strokeStyle = INK;ctx.fillStyle = '#e9b353';ctx.lineWidth = 1.2;ctx.lineJoin = 'round';
    ctx.beginPath();ctx.moveTo(CENTER - 6, badgeY - 4);ctx.lineTo(CENTER + 6, badgeY - 4);ctx.lineTo(CENTER + 4.5, badgeY + 7);ctx.lineTo(CENTER - 4.5, badgeY + 7);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(CENTER + 1, badgeY - 4);ctx.lineTo(CENTER + 4, badgeY - 10);ctx.lineTo(CENTER + 8, badgeY - 10);ctx.stroke();
    ctx.fillStyle = INK;ellipse(ctx, CENTER - 2, badgeY, .8, .8);ctx.fill();ellipse(ctx, CENTER + 2, badgeY, .8, .8);ctx.fill();
    ctx.beginPath();ctx.moveTo(CENTER - 2, badgeY + 3);ctx.quadraticCurveTo(CENTER, badgeY + 5, CENTER + 2, badgeY + 3);ctx.stroke();
    ctx.restore();
    // The darker outer contour and bright inner edge keep this illustrated.
    cupPath(ctx, g);ctx.strokeStyle = '#194e47';ctx.lineWidth = 2.5;ctx.lineJoin = 'round';ctx.stroke();
    ctx.beginPath();ctx.ellipse(CENTER, g.bottom - 1, Math.max(1, g.width(0) / 2 - 3), 5, 0, 0, Math.PI);
    ctx.strokeStyle = '#faffdfad';ctx.lineWidth = 3;ctx.stroke();
    ctx.beginPath();ctx.ellipse(CENTER, g.bottom + 1, Math.max(1, g.width(0) / 2 - 1), 4, 0, 0, Math.PI);
    ctx.strokeStyle = '#2c625a66';ctx.lineWidth = 1.3;ctx.stroke();
    ellipse(ctx, CENTER, g.top, g.width(1) / 2, 5.1);ctx.strokeStyle = '#184d47';ctx.lineWidth = 2.4;ctx.stroke();
    ctx.beginPath();ctx.ellipse(CENTER, g.top + .5, g.width(1) / 2 - 3, 3.5, 0, 0, Math.PI);
    ctx.strokeStyle = '#ffffe5d9';ctx.lineWidth = 1.8;ctx.stroke();
  }

  function stream(ctx, o, g, liquidY, foamY, fill, foam) {
    if (!o.pouring) return;
    const soda = o.soda || {color: '#ed9a3b', light: '#ffe0a1'};
    const t = scene.clock, surface = fill + foam > .0004 ? foamY : g.bottom - 5;
    const pressure = clamp(Math.round(finite(o.pressure, 1)), 0, 2);
    const half = [3.5, 5, 6.5][pressure], amplitude = o.reducedMotion ? 0 : .65 + pressure * .2;
    const flow = ctx.createLinearGradient(CENTER - half, 0, CENTER + half, 0);
    flow.addColorStop(0, soda.color);flow.addColorStop(.34, soda.light);flow.addColorStop(.55, soda.color);flow.addColorStop(1, soda.color);
    ctx.save();ctx.globalAlpha = .92;ctx.fillStyle = flow;ctx.beginPath();ctx.moveTo(CENTER - half, 25);
    for (let y = 25; y <= surface; y += 7) ctx.lineTo(CENTER - half + Math.sin(y * .12 - t * 25) * amplitude, y);
    ctx.lineTo(CENTER + half + 1.5, surface);
    for (let y = surface; y >= 25; y -= 7) ctx.lineTo(CENTER + half + Math.sin(y * .1 - t * 22) * amplitude, y);
    ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(CENTER - half * .36, 27);ctx.lineTo(CENTER - half * .36, Math.max(27, surface - 3));
    ctx.strokeStyle = '#fff5ce83';ctx.lineWidth = 1.25;ctx.stroke();
    const drops = o.reducedMotion ? 0 : 7 + pressure * 2;
    for (let i = 0; i < drops; i++) {
      const q = fract(t * (1.3 + pressure * .2) + i * .137), side = i % 2 ? -1 : 1;
      const reach = 12 + noise(i + scene.seed) * (12 + pressure * 5);
      const x = CENTER + side * (half + q * reach), y = surface - Math.sin(q * Math.PI) * (7 + pressure * 4 + noise(i + 4) * 7);
      if (x < CENTER - wallAt(g, Math.max(g.top, y)) + 3 || x > CENTER + wallAt(g, Math.max(g.top, y)) - 3) continue;
      ellipse(ctx, x, y, .8 + (1 - q) * .8, 1.25 + (1 - q) * .7, side * .4);
      ctx.globalAlpha = (1 - q) * .8;ctx.fillStyle = soda.light;ctx.fill();
    }
    ctx.restore();
  }

  function overflow(ctx, o, g) {
    if (finite(o.spillMl) < .025) return;
    const color = (o.drink || o.soda || {}).color || '#ef943d';
    const height = g.bottom - g.top;
    ctx.save();ctx.lineCap = 'round';ctx.lineJoin = 'round';
    // Thin residue remains after a rivulet reaches the counter.
    for (const side of [-1, 1]) {
      ctx.beginPath();
      for (let n = 0; n <= 25; n++) {
        const u = n / 25, y = g.top + u * height;
        const x = CENTER + side * (wallAt(g, y) + 2.2 + Math.sin(u * 9 + side) * .9);
        n ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = color;ctx.globalAlpha = .18;ctx.lineWidth = 1.5;ctx.stroke();
    }
    if (o.reducedMotion) {
      ctx.globalAlpha = .55;ctx.strokeStyle = color;ctx.lineWidth = 2.6;
      for (const side of [-1, 1]) {
        ctx.beginPath();ctx.moveTo(CENTER + side * (g.width(1) / 2 + 2), g.top + 1);
        ctx.quadraticCurveTo(CENTER + side * (wallAt(g, g.top + height * .5) + 4), g.top + height * .5, CENTER + side * (g.width(0) / 2 + 2), g.bottom + 5);ctx.stroke();
      }
      ctx.restore();return;
    }
    for (const p of scene.drips) {
      const progress = clamp(p.age / p.life, 0, 1), start = Math.max(0, progress - .36 - scene.spillEnergy * .5);
      ctx.beginPath();
      let headX = 0, headY = 0;
      for (let n = 0; n <= 18; n++) {
        const u = start + (progress - start) * n / 18;
        const y = g.top + u * (height + 10);
        const x = CENTER + p.side * (wallAt(g, y) + 2 + Math.sin(u * 7 + p.salt) * 1.1);
        n ? ctx.lineTo(x, y) : ctx.moveTo(x, y);headX = x;headY = y;
      }
      ctx.globalAlpha = clamp((p.life + .15 - p.age) / .2, 0, 1) * .8;
      ctx.strokeStyle = color;ctx.lineWidth = p.width;ctx.stroke();
      ctx.globalAlpha *= .57;ctx.strokeStyle = '#fff0ca';ctx.lineWidth = .65;ctx.stroke();
      if (progress < .99) { ellipse(ctx, headX, headY, p.width * .68, p.width * 1.15);ctx.fillStyle = color;ctx.globalAlpha = .84;ctx.fill(); }
    }
    if (scene.spillEnergy > .07) {
      for (const side of [-1, 1]) {
        const x = CENTER + side * (g.width(1) / 2 - .5);
        ellipse(ctx, x, g.top + 1.2, 3.7, 2.6);ctx.fillStyle = '#fff2d5';ctx.globalAlpha = scene.spillEnergy * .8;ctx.fill();
      }
    }
    ctx.restore();
  }

  function draw(ctx, o = {}) {
    const g = o.g;
    if (!ctx || !g || typeof g.level !== 'function' || typeof g.width !== 'function' || !Number.isFinite(g.top) || !Number.isFinite(g.bottom) || g.bottom <= g.top) return;
    const key = String(o.customerKey ?? 'counter') + ':' + String(o.cupIndex ?? 0);
    const fresh = !scene || scene.key !== key;
    if (fresh) reset(key);
    let dt = o.dt;
    if (!Number.isFinite(dt)) dt = scene.lastTime === null ? 0 : finite(o.time) - scene.lastTime;
    dt = clamp(dt, 0, .05);
    scene.lastTime = finite(o.time);
    scene.clock += dt;
    const fill = clamp(finite(o.fill), 0, 1), foam = clamp(finite(o.foam), 0, 1);
    const liquidY = g.level(fill), foamY = g.level(Math.min(1, fill + foam));
    const pressure = clamp(Math.round(finite(o.pressure, 1)), 0, 2);
    const targetMotion = o.pouring ? [.65, 1, 1.4][pressure] : 0;
    if (dt) scene.turbulence += (targetMotion - scene.turbulence) * (1 - Math.exp(-dt * (o.pouring ? 11 : 3.7)));
    if (fresh) scene.turbulence = o.pouring ? targetMotion : 0;
    syncIngredients(o, g, fresh);
    updateIngredients(o, g, liquidY, dt, fresh);
    updateSpills(o, dt, fresh);
    if (finite(o.syrup) !== scene.previousSyrup) { scene.syrupAge = 0;scene.previousSyrup = finite(o.syrup); }
    scene.syrupAge += dt * (o.pouring ? 1 : .25);
    const drink = o.drink || o.soda || {color: '#ef993f', light: '#ffd594'};
    ctx.save();
    ctx.lineCap = 'round';ctx.lineJoin = 'round';
    puddle(ctx, g, Math.max(0, finite(o.spillMl)), drink.color);
    // Back wall and rear rim remain visible through an empty drink.
    cupPath(ctx, g);const back = ctx.createLinearGradient(CENTER - g.width(1) / 2, 0, CENTER + g.width(1) / 2, 0);
    back.addColorStop(0, 'rgba(200,234,214,.21)');back.addColorStop(.4, 'rgba(255,254,226,.08)');back.addColorStop(1, 'rgba(170,213,194,.15)');ctx.fillStyle = back;ctx.fill();
    ctx.beginPath();ctx.ellipse(CENTER, g.top, g.width(1) / 2 - 1, 4.6, 0, Math.PI, TAU);ctx.strokeStyle = '#5882779c';ctx.lineWidth = 2;ctx.stroke();
    drawLiquid(ctx, o, g, liquidY, foamY, fill, foam);
    glass(ctx, o, g, fill);
    stream(ctx, o, g, liquidY, foamY, fill, foam);
    overflow(ctx, o, g);
    for (const p of scene.ingredients) if (p.delay <= 0 && !p.entered) ingredientArt(ctx, p, 0);
    ctx.restore();
    scene.animating = !o.reducedMotion && (o.pouring || foam > .001 || fill > .005 || scene.drips.length > 0 || scene.turbulence > .005 || scene.ingredients.some(p => p.delay > 0 || Math.abs(p.vy) + Math.abs(p.vx) > .7 || p.y < g.bottom - p.r - 7));
  }

  window.BarLiquid = Object.freeze({draw, reset, needsFrame: () => !!scene?.animating});
})();
