export function drawCanvasTestPattern(canvas) {
  const w = 256;
  const h = 256;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  const q = 128;
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(0, 0, q, q);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(q, 0, q, q);
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(0, q, q, q);
  ctx.fillStyle = '#ec4899';
  ctx.fillRect(q, q, q, q);

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('Canvas-Testmuster', 12, 24);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('256×256 px', 12, 44);
}
