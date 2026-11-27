/* Perfect Pour · a quiet gold finish for a five-star cup. */
(() => {
  'use strict';

  function cupPath(ctx, x, top, bottom, widthAt) {
    const height = bottom - top;
    ctx.beginPath();
    ctx.moveTo(x - widthAt(1) / 2, top);
    for (let i = 19; i >= 0; i--) {
      const v = i / 20;
      ctx.lineTo(x - widthAt(v) / 2, bottom - v * height);
    }
    ctx.quadraticCurveTo(x, bottom + 9, x + widthAt(0) / 2, bottom);
    for (let i = 1; i <= 20; i++) {
      const v = i / 20;
      ctx.lineTo(x + widthAt(v) / 2, bottom - v * height);
    }
    ctx.closePath();
  }

  function sparkle(ctx, x, y, radius) {
    const inner = radius * .23;
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + inner, y - inner);
    ctx.lineTo(x + radius, y);
    ctx.lineTo(x + inner, y + inner);
    ctx.lineTo(x, y + radius);
    ctx.lineTo(x - inner, y + inner);
    ctx.lineTo(x - radius, y);
    ctx.lineTo(x - inner, y - inner);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function draw(ctx, {top, bottom, widthAt, centerX = 260, time = 0, reducedMotion = false}) {
    if (!ctx || typeof widthAt !== 'function' || ![top, bottom, centerX, time].every(Number.isFinite) || bottom <= top) return;
    const elapsed = Math.max(0, time);
    const strength = reducedMotion ? 1 : Math.min(1, elapsed / .45);
    const rimWidth = widthAt(1);
    if (!Number.isFinite(rimWidth) || rimWidth <= 0 || strength === 0) return;

    ctx.save();
    try {
      // Follow the actual curved or tapered cup; the existing dark outline
      // remains legible beneath this narrow warm edge.
      ctx.globalAlpha *= strength;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 211, 112, .7)';
      ctx.lineWidth = 1.35;
      ctx.shadowColor = 'rgba(255, 206, 102, .65)';
      ctx.shadowBlur = 12;
      cupPath(ctx, centerX, top, bottom, widthAt);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(centerX, top, rimWidth / 2, 5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 235, 177, .9)';
      ctx.lineWidth = 1.7;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // A slow, low-opacity glass reflection, clipped to the same cup shape.
      // Reduced motion keeps one static reflection instead of sweeping it.
      ctx.save();
      cupPath(ctx, centerX, top, bottom, widthAt);
      ctx.clip();
      const sweep = reducedMotion ? .28 : (elapsed % 6.8) / 6.8;
      const bandX = centerX - rimWidth - 75 + sweep * (rimWidth * 2 + 100);
      const reflection = ctx.createLinearGradient(bandX - 25, top, bandX + 66, top);
      reflection.addColorStop(0, 'rgba(255, 253, 230, 0)');
      reflection.addColorStop(.42, 'rgba(255, 253, 230, .24)');
      reflection.addColorStop(.57, 'rgba(255, 255, 248, .38)');
      reflection.addColorStop(1, 'rgba(255, 253, 230, 0)');
      ctx.fillStyle = reflection;
      ctx.beginPath();
      ctx.moveTo(bandX - 25, top - 10);
      ctx.lineTo(bandX + 25, top - 10);
      ctx.lineTo(bandX + 85, bottom + 10);
      ctx.lineTo(bandX + 35, bottom + 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Three little four-point stars sit near the rim, clear of the fill tag.
      const stars = [
        [centerX - rimWidth / 2 - 14, top + 27, 7.5, 0],
        [centerX + rimWidth / 2 + 12, top - 12, 8.5, 1.8],
        [centerX + rimWidth * .19, top - 23, 4.5, 3.4]
      ];
      ctx.fillStyle = '#fff8d9';
      ctx.strokeStyle = '#dcae56';
      ctx.lineWidth = .8;
      ctx.shadowColor = 'rgba(255, 222, 135, .75)';
      ctx.shadowBlur = 7;
      for (const [x, y, radius, phase] of stars) {
        ctx.save();
        const pulse = reducedMotion ? 1 : .78 + .22 * Math.sin(elapsed * 2.1 + phase);
        ctx.globalAlpha *= pulse;
        sparkle(ctx, x, y, radius * (.84 + .16 * pulse));
        ctx.restore();
      }
    } finally {
      ctx.restore();
    }
  }

  window.PourFinish = Object.freeze({draw});
})();
