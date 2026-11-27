// Gobble Dash — everything the player sees, drawn on one canvas with plain shapes:
// the farmyard, barn and kitchen scrolling past, the turkey, the farmer on its tail,
// the oven and the knives, the HUD, and the title and end screens.

import { GROUND_Y, RUN, STAGES, VIEW } from './config.js';
import { stageFor } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function skyGradient(ctx, stage) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  gradient.addColorStop(0, stage.sky[0]);
  gradient.addColorStop(1, stage.sky[1]);
  return gradient;
}

function drawCloud(ctx, x, y, scale, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff8ec';
  ctx.beginPath();
  ctx.ellipse(x, y, 42 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 30 * scale, y + 4 * scale, 30 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 30 * scale, y + 5 * scale, 26 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBackground(ctx, world) {
  const stage = stageFor(world.distance);
  ctx.fillStyle = skyGradient(ctx, stage);
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y + 4);

  // Low autumn sun.
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(820, 84, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9a0';
  ctx.beginPath();
  ctx.arc(820, 84, 46, 0, Math.PI * 2);
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Clouds drift slowly; hills roll past at half speed.
  const drift = world.distance * 22;
  drawCloud(ctx, 160 - (drift % 1100), 70, 1, 0.9);
  drawCloud(ctx, 560 - (drift % 1100), 120, 0.75, 0.7);
  drawCloud(ctx, 900 - (drift % 1100), 60, 0.9, 0.85);
  ctx.fillStyle = stage.grass;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(240 - ((world.distance * 11) % 1200), GROUND_Y - 6, 320, 42, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(760 - ((world.distance * 11) % 1200), GROUND_Y - 4, 380, 50, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // A barn silhouette in the barn stage, a kitchen window in the kitchen stage.
  if (world.distance >= 500 && world.distance < 1000) {
    const bx = 700 - ((world.distance * 22) % 1400);
    ctx.fillStyle = '#7a3b22';
    ctx.fillRect(bx, GROUND_Y - 150, 150, 150);
    ctx.beginPath();
    ctx.moveTo(bx - 12, GROUND_Y - 148);
    ctx.lineTo(bx + 75, GROUND_Y - 210);
    ctx.lineTo(bx + 162, GROUND_Y - 148);
    ctx.closePath();
    ctx.fillStyle = '#5e2c18';
    ctx.fill();
    ctx.fillStyle = '#3d1e10';
    ctx.fillRect(bx + 55, GROUND_Y - 90, 40, 90);
  }
  if (world.distance >= 1000) {
    const kx = 640 - ((world.distance * 22) % 1300);
    ctx.fillStyle = '#6e3a24';
    ctx.fillRect(kx, GROUND_Y - 170, 190, 170);
    ctx.fillStyle = '#ffe9a0';
    ctx.fillRect(kx + 24, GROUND_Y - 140, 60, 60);
    ctx.fillRect(kx + 106, GROUND_Y - 140, 60, 60);
    ctx.strokeStyle = '#4a2416';
    ctx.lineWidth = 4;
    ctx.strokeRect(kx + 24, GROUND_Y - 140, 60, 60);
    ctx.strokeRect(kx + 106, GROUND_Y - 140, 60, 60);
  }

  // The forest gate waits at the end of the run.
  if (world.distance >= RUN.escapeDistance - 60) {
    const gateX = VIEW.width - 120 - (RUN.escapeDistance - world.distance) * 22;
    ctx.fillStyle = '#3e6b34';
    ctx.fillRect(gateX, GROUND_Y - 170, 18, 170);
    ctx.fillRect(gateX + 110, GROUND_Y - 170, 18, 170);
    ctx.fillStyle = '#5e8f4e';
    ctx.fillRect(gateX, GROUND_Y - 178, 146, 20);
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FREEDOM', gateX + 73, GROUND_Y - 186);
  }

  // Ground: packed earth with a grass lip and scrolling tufts.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, GROUND_Y, VIEW.width, 10);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 14; i += 1) {
    const x = ((i * 173 + 40 - world.distance * 22) % 1050 + 1050) % 1050 - 40;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 12);
    ctx.lineTo(x + 5, GROUND_Y + 2);
    ctx.lineTo(x + 10, GROUND_Y + 12);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 211 + 90 - world.distance * 22) % 1000 + 1000) % 1000 - 20;
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y + 52, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCorn(ctx, x, y, radius, golden, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(spin) * 0.15);
  ctx.fillStyle = golden ? '#ffe066' : '#ffd94a';
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.62, radius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = golden ? '#c9a227' : '#d9a400';
  ctx.lineWidth = 1.5;
  for (let row = -2; row <= 2; row += 1) {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.45, row * radius * 0.38);
    ctx.lineTo(radius * 0.45, row * radius * 0.38);
    ctx.stroke();
  }
  ctx.fillStyle = '#7fae4c';
  ctx.beginPath();
  ctx.moveTo(-radius * 0.5, radius * 0.7);
  ctx.lineTo(0, radius * 1.25);
  ctx.lineTo(radius * 0.5, radius * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPie(ctx, x, y, radius, time) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 3) * 3);
  ctx.fillStyle = '#e8b06a';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, -Math.PI * 0.75, Math.PI * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8fb0';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius * 0.72, -Math.PI * 0.75, Math.PI * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(radius * 0.28, -radius * 0.28, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHay(ctx, o) {
  ctx.fillStyle = '#d9a441';
  roundRect(ctx, o.x, o.y + 6, o.width, o.height - 6, 10);
  ctx.fill();
  ctx.strokeStyle = '#a87c22';
  ctx.lineWidth = 2;
  for (let i = 1; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(o.x + 4, o.y + 6 + i * 11);
    ctx.lineTo(o.x + o.width - 4, o.y + 6 + i * 11);
    ctx.stroke();
  }
  ctx.fillStyle = '#e8c25e';
  ctx.beginPath();
  ctx.ellipse(o.x + o.width / 2, o.y + 8, o.width / 2 - 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFence(ctx, o) {
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(o.x, o.y + 6, 6, o.height - 6);
  ctx.fillRect(o.x + o.width - 6, o.y + 6, 6, o.height - 6);
  ctx.fillStyle = '#a06a35';
  ctx.fillRect(o.x - 4, o.y + 14, o.width + 8, 10);
  ctx.fillRect(o.x - 4, o.y + 34, o.width + 8, 10);
  ctx.fillStyle = '#c96f2e';
  ctx.beginPath();
  ctx.moveTo(o.x - 4, o.y + 14);
  ctx.lineTo(o.x + o.width / 2, o.y - 4);
  ctx.lineTo(o.x + o.width + 4, o.y + 14);
  ctx.closePath();
  ctx.fill();
}

function drawOven(ctx, o, time) {
  ctx.fillStyle = '#3d3d46';
  roundRect(ctx, o.x, o.y, o.width, o.height, 8);
  ctx.fill();
  ctx.fillStyle = '#23232b';
  roundRect(ctx, o.x + 8, o.y + 12, o.width - 16, 34, 5);
  ctx.fill();
  // The fire inside the oven window.
  const flicker = Math.sin(time * 11) * 3;
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.ellipse(o.x + o.width / 2, o.y + 34, 12 + flicker * 0.4, 12 - flicker * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.ellipse(o.x + o.width / 2, o.y + 36, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#565664';
  ctx.fillRect(o.x + 10, o.y + 56, o.width - 20, 6);
  ctx.fillStyle = '#ff5a3c';
  ctx.beginPath();
  ctx.arc(o.x + 18, o.y + 72, 4, 0, Math.PI * 2);
  ctx.arc(o.x + 32, o.y + 72, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', o.x + o.width / 2, o.y + o.height - 8);
  // Heat shimmer: rising smoke puffs.
  ctx.fillStyle = 'rgba(200,200,210,0.35)';
  for (let i = 0; i < 3; i += 1) {
    const p = (time * 0.7 + i * 0.33) % 1;
    ctx.beginPath();
    ctx.arc(o.x + o.width / 2 + Math.sin(p * 9 + i) * 8, o.y - p * 46, 5 + p * 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawKnife(ctx, o) {
  const isHigh = o.kind === 'knife-high';
  // A rope from above and a glinting carving knife on it.
  ctx.strokeStyle = '#6e4520';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(o.x + o.width / 2, 0);
  ctx.lineTo(o.x + o.width / 2, o.y);
  ctx.stroke();
  ctx.save();
  ctx.translate(o.x + o.width / 2, o.y + o.height / 2);
  ctx.rotate(isHigh ? -0.25 : 0.25);
  ctx.fillStyle = '#5a3a28';
  roundRect(ctx, -5, -o.height / 2, 10, 22, 3);
  ctx.fill();
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(-7, -o.height / 2 + 20);
  ctx.lineTo(7, -o.height / 2 + 20);
  ctx.lineTo(0, o.height / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -o.height / 2 + 24);
  ctx.lineTo(0, o.height / 2 - 8);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#ff5a3c';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isHigh ? 'DUCK!' : 'JUMP!', o.x + o.width / 2, o.y - 8);
}

function drawObstacle(ctx, o, time) {
  if (o.kind === 'hay') drawHay(ctx, o);
  else if (o.kind === 'fence') drawFence(ctx, o);
  else if (o.kind === 'oven') drawOven(ctx, o, time);
  else drawKnife(ctx, o);
}

function drawTurkey(ctx, world) {
  const t = world.turkey;
  const ducking = t.ducking;
  const legSwing = Math.sin(t.runCycle * 2.4) * (t.grounded ? 10 : 4);
  const bob = t.grounded ? Math.abs(Math.sin(t.runCycle * 2.4)) * 2 : 0;
  const bodyY = t.y + (ducking ? 18 : 0) - bob;
  const blink = Math.abs(world.time % 3.4) < 0.12;

  ctx.save();
  if (t.invulnerableUntil > 0 && Math.floor(world.time * 12) % 2 === 0) ctx.globalAlpha = 0.45;

  // Tail feathers, fanned behind.
  ctx.fillStyle = '#8a5a2b';
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(t.x + 8, bodyY + 22);
    ctx.rotate(i * 0.42 - 0.5);
    ctx.beginPath();
    ctx.ellipse(-14, 0, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#c96f2e';
  for (let i = -1; i <= 1; i += 1) {
    ctx.save();
    ctx.translate(t.x + 8, bodyY + 22);
    ctx.rotate(i * 0.5 - 0.5);
    ctx.beginPath();
    ctx.ellipse(-12, 0, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Legs, running.
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const footY = GROUND_Y;
  ctx.beginPath();
  ctx.moveTo(t.x + 22, bodyY + 34);
  ctx.lineTo(t.x + 22 + legSwing, footY);
  ctx.moveTo(t.x + 32, bodyY + 34);
  ctx.lineTo(t.x + 32 - legSwing, footY);
  ctx.stroke();

  // Body.
  ctx.fillStyle = '#a06a35';
  ctx.beginPath();
  ctx.ellipse(t.x + 28, bodyY + 22, 26, ducking ? 13 : 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98a4a';
  ctx.beginPath();
  ctx.ellipse(t.x + 30, bodyY + 28, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing, flapping harder in the air.
  const flap = t.grounded ? Math.sin(t.runCycle * 2.4) * 3 : -8;
  ctx.fillStyle = '#7a4a22';
  ctx.beginPath();
  ctx.ellipse(t.x + 24, bodyY + 20 + flap, 14, 8, -0.4, 0, Math.PI * 2);
  ctx.fill();

  if (!ducking) {
    // Neck and head.
    ctx.strokeStyle = '#a06a35';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(t.x + 46, bodyY + 14);
    ctx.lineTo(t.x + 50, bodyY - 4);
    ctx.stroke();
    ctx.fillStyle = '#d9d9e0';
    ctx.beginPath();
    ctx.arc(t.x + 50, bodyY - 8, 11, 0, Math.PI * 2);
    ctx.fill();
    // Beak, wattle and eye.
    ctx.fillStyle = '#ff9d1a';
    ctx.beginPath();
    ctx.moveTo(t.x + 58, bodyY - 10);
    ctx.lineTo(t.x + 70, bodyY - 6);
    ctx.lineTo(t.x + 58, bodyY - 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.ellipse(t.x + 54, bodyY + 2, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!blink) {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(t.x + 53, bodyY - 10, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // The red snood over the beak.
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.ellipse(t.x + 58, bodyY - 13, 3, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Ducked: head tucked low, beak forward.
    ctx.fillStyle = '#d9d9e0';
    ctx.beginPath();
    ctx.arc(t.x + 50, bodyY + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff9d1a';
    ctx.beginPath();
    ctx.moveTo(t.x + 57, bodyY + 10);
    ctx.lineTo(t.x + 68, bodyY + 13);
    ctx.lineTo(t.x + 57, bodyY + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(t.x + 52, bodyY + 10, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFarmer(ctx, world) {
  const t = world.turkey;
  const fx = t.x - world.gap - 46;
  if (fx < -90) return;
  const cycle = world.time * 11;
  const legSwing = Math.sin(cycle) * 12;
  const bob = Math.abs(Math.sin(cycle)) * 3;
  const bodyY = GROUND_Y - 78 - bob;

  ctx.save();
  // Pitchfork, held high and shaking.
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(fx + 52, bodyY + 52);
  ctx.lineTo(fx + 62, bodyY - 6);
  ctx.stroke();
  ctx.strokeStyle = '#c0c8d4';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(fx + 62 + i * 7, bodyY - 6);
    ctx.lineTo(fx + 62 + i * 7, bodyY - 22);
    ctx.stroke();
  }
  // Legs in blue overalls, pumping.
  ctx.strokeStyle = '#2e4a7a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fx + 24, bodyY + 40);
  ctx.lineTo(fx + 24 + legSwing, GROUND_Y);
  ctx.moveTo(fx + 36, bodyY + 40);
  ctx.lineTo(fx + 36 - legSwing, GROUND_Y);
  ctx.stroke();
  // Body: red checked shirt.
  ctx.fillStyle = '#b03a2e';
  roundRect(ctx, fx + 12, bodyY + 8, 36, 36, 8);
  ctx.fill();
  ctx.strokeStyle = '#7a241c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fx + 12, bodyY + 22);
  ctx.lineTo(fx + 48, bodyY + 22);
  ctx.moveTo(fx + 30, bodyY + 8);
  ctx.lineTo(fx + 30, bodyY + 44);
  ctx.stroke();
  // Arm reaching for the turkey.
  ctx.strokeStyle = '#e8b98a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(fx + 46, bodyY + 16);
  ctx.lineTo(fx + 62, bodyY + 26 + Math.sin(cycle * 0.5) * 4);
  ctx.stroke();
  // Head with a straw hat and a very angry moustache.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(fx + 30, bodyY - 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c25e';
  ctx.beginPath();
  ctx.ellipse(fx + 30, bodyY - 10, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(fx + 18, bodyY - 22, 24, 13);
  ctx.fillStyle = '#5a3a28';
  ctx.beginPath();
  ctx.ellipse(fx + 30, bodyY + 4, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(fx + 34, bodyY - 5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, world) {
  const stage = stageFor(world.distance);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Top bar.
  ctx.fillStyle = 'rgba(43,29,18,0.72)';
  roundRect(ctx, 12, 10, 330, 64, 10);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`SCORE ${Math.floor(world.score)}`, 24, 36);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffd94a';
  ctx.fillText(`${Math.floor(world.distance)} m  ·  ${stage.name}`, 24, 60);

  // Lives as hearts.
  for (let i = 0; i < 5; i += 1) {
    const x = 372 + i * 30;
    const y = 30;
    ctx.fillStyle = i < world.lives ? '#e63946' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.bezierCurveTo(x - 11, y - 2, x - 6, y - 12, x, y - 4);
    ctx.bezierCurveTo(x + 6, y - 12, x + 11, y - 2, x, y + 8);
    ctx.fill();
  }

  // Distance to freedom: a progress bar across the top.
  const progress = Math.min(1, world.distance / RUN.escapeDistance);
  ctx.fillStyle = 'rgba(43,29,18,0.72)';
  roundRect(ctx, 12, 82, 300, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#7fae4c';
  roundRect(ctx, 14, 84, 296 * progress, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TO THE FOREST GATE', 320, 95);

  // How close the farmer is.
  const gapRatio = Math.max(0, Math.min(1, (world.gap - RUN.minGap) / (RUN.maxGap - RUN.minGap)));
  ctx.fillStyle = 'rgba(43,29,18,0.72)';
  roundRect(ctx, VIEW.width - 252, 10, 240, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#e63946';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('FARMER', VIEW.width - 240, 28);
  ctx.fillStyle = gapRatio > 0.5 ? '#7fae4c' : gapRatio > 0.25 ? '#ffd94a' : '#e63946';
  roundRect(ctx, VIEW.width - 168, 18, 140 * gapRatio, 12, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(VIEW.width - 168, 18, 140, 12);

  // Floating warning banner.
  if (world.message) {
    ctx.fillStyle = 'rgba(230,57,70,0.9)';
    roundRect(ctx, VIEW.width / 2 - 190, 108, 380, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.message.text, VIEW.width / 2, 131);
    ctx.textAlign = 'left';
  }

  // Controls reminder, fading after the first seconds.
  if (world.time < 7 && !world.over) {
    ctx.globalAlpha = Math.min(1, 7 - world.time);
    ctx.fillStyle = 'rgba(43,29,18,0.75)';
    roundRect(ctx, VIEW.width / 2 - 260, VIEW.height - 52, 520, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE / CLICK jump (twice = double jump) · DOWN duck · M mute · P pause', VIEW.width / 2, VIEW.height - 30);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(43,29,18,0.88)';
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd94a';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(43,29,18,0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 130, 62, 700, 400);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 58px sans-serif';
  ctx.fillText('GOBBLE DASH', VIEW.width / 2, 140);
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('A Thanksgiving Escape', VIEW.width / 2, 176);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#ffe9c4';
  ctx.fillText('Thanksgiving is tomorrow, and YOU are the main course.', VIEW.width / 2, 216);
  ctx.fillText('Outrun the farmer, dodge the oven and his carving knives,', VIEW.width / 2, 242);
  ctx.fillText('grab the corn, and reach the forest gate 1,500 m away.', VIEW.width / 2, 268);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('SPACE / ↑ / W or CLICK — jump (press twice in the air)', VIEW.width / 2, 312);
  ctx.fillText('↓ / S — duck under high knives', VIEW.width / 2, 338);
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('▶  PRESS SPACE OR CLICK TO RUN', VIEW.width / 2, 392);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#c9a06a';
  ctx.fillText('Corn +50 · Golden corn +150 · Pumpkin pie +1 life · 3 lives · P pauses · M mutes', VIEW.width / 2, 428);
  ctx.textAlign = 'left';
}

function drawOver(ctx, world) {
  const escaped = world.outcome === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(46,90,46,0.5)' : 'rgba(60,20,16,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 180, 92, 600, 340);
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#a8e08a' : '#ff8a7a';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText(escaped ? 'YOU ESCAPED!' : 'CAUGHT!', VIEW.width / 2, 168);
  ctx.fillStyle = '#fff3c4';
  ctx.font = '19px sans-serif';
  ctx.fillText(
    escaped
      ? 'The turkey slips through the forest gate, free at last.'
      : 'The farmer finally gets his hands on you. Dinner is served…',
    VIEW.width / 2, 206,
  );
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`SCORE  ${Math.floor(world.score)}`, VIEW.width / 2, 258);
  ctx.fillStyle = '#fff3c4';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Distance  ${Math.floor(world.distance)} m of ${RUN.escapeDistance} m`, VIEW.width / 2, 290);
  ctx.fillText(`Best score this session  ${Math.floor(Math.max(world.best, world.score))}`, VIEW.width / 2, 318);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('▶  PRESS R OR CLICK TO RUN AGAIN', VIEW.width / 2, 372);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#c9a06a';
  ctx.fillText('Tip: golden corn pushes the farmer back — grab it when you can.', VIEW.width / 2, 406);
  ctx.textAlign = 'left';
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,29,18,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('PAUSED', VIEW.width / 2, VIEW.height / 2 - 8);
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P or click to keep running', VIEW.width / 2, VIEW.height / 2 + 28);
  ctx.textAlign = 'left';
}

/** Draw the whole scene for the given screen. */
export function draw(ctx, world, screen, paused) {
  // Fill the letterbox around the 960x540 playfield first.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#2b1d12';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  ctx.save();
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 10, (Math.random() - 0.5) * world.shake * 10);
  }
  drawBackground(ctx, world);
  for (const pickup of world.pickups) {
    if (pickup.taken) continue;
    if (pickup.kind === 'corn') drawCorn(ctx, pickup.x, pickup.y, pickup.radius, false, pickup.spin);
    else if (pickup.kind === 'golden') drawCorn(ctx, pickup.x, pickup.y, pickup.radius, true, pickup.spin);
    else drawPie(ctx, pickup.x, pickup.y, pickup.radius, world.time);
  }
  for (const obstacle of world.obstacles) drawObstacle(ctx, obstacle, world.time);
  drawFarmer(ctx, world);
  drawTurkey(ctx, world);
  drawParticles(ctx, world);
  ctx.restore();

  // A red flash on a stumble.
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(230,57,70,${world.flash * 0.22})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  if (screen === SCREEN_TITLE) drawTitle(ctx, world);
  else if (screen === SCREEN_OVER) drawOver(ctx, world);
  else drawHud(ctx, world);
  if (paused && screen === SCREEN_PLAY) drawPaused(ctx);
}
