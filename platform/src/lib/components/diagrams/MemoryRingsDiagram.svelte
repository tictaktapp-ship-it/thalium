<script lang="ts">
  import { onMount } from 'svelte';
  export let width = 480;
  export let height = 480;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    const W = width, H = height;
    const cx = W / 2, cy = H / 2;

    // Three rings with distinct personalities
    const rings = [
      { r: 60, label: 'SESSION', nodeCount: 6, color: '#1A3AFF', speed: 0.006, decay: 0.04, writeFreq: 40 },
      { r: 120, label: 'ENTITY', nodeCount: 10, color: '#1A3AFF', speed: -0.003, decay: 0.015, writeFreq: 80 },
      { r: 190, label: 'INSTITUTIONAL', nodeCount: 16, color: '#1A3AFF', speed: 0.0015, decay: 0.004, writeFreq: 150 },
    ];

    // Node activity levels
    const nodes = rings.map(r =>
      Array.from({ length: r.nodeCount }, (_, i) => ({
        angle: (i / r.nodeCount) * Math.PI * 2,
        active: Math.random() * 0.3,
        age: Math.floor(Math.random() * 200),
      }))
    );

    // Write timers
    const writeTimers = rings.map(r => Math.floor(Math.random() * r.writeFreq));
    // Pulses from center to ring
    let pulses: { ri: number, ni: number, progress: number }[] = [];
    // Accumulated entries per ring (institutional ring grows over time)
    const accumulated = [0, 0, 0];

    let t = 0;
    let animFrame: number;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
      bg.addColorStop(0, 'rgba(26,58,255,0.04)');
      bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Write triggers
      rings.forEach((ring, ri) => {
        writeTimers[ri]--;
        if (writeTimers[ri] <= 0) {
          writeTimers[ri] = ring.writeFreq + Math.floor(Math.random() * ring.writeFreq * 0.5);
          const ni = Math.floor(Math.random() * ring.nodeCount);
          nodes[ri][ni].active = 1;
          nodes[ri][ni].age = 0;
          accumulated[ri] = Math.min(accumulated[ri] + 1, ring.nodeCount);
          pulses.push({ ri, ni, progress: 0 });
        }
      });

      // Decay nodes
      nodes.forEach((ringNodes, ri) => {
        ringNodes.forEach(n => {
          n.active = Math.max(0, n.active - rings[ri].decay * 0.5);
          n.age++;
        });
      });

      // Draw rings
      rings.forEach((ring, ri) => {
        const rot = t * ring.speed;

        // Ring track
        ctx.save();
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = 0.2 + ri * 0.06;
        ctx.setLineDash([ri === 2 ? 6 : ri === 1 ? 4 : 3, ri === 2 ? 14 : ri === 1 ? 10 : 7]);
        ctx.lineDashOffset = -rot * ring.r * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Accumulated fill glow — institutional ring gets brighter as it accumulates
        if (ri === 2 && accumulated[2] > 2) {
          ctx.save();
          ctx.globalAlpha = Math.min(accumulated[2] / ring.nodeCount * 0.08, 0.12);
          const glow = ctx.createRadialGradient(cx, cy, ring.r - 20, cx, cy, ring.r + 20);
          glow.addColorStop(0, 'transparent');
          glow.addColorStop(0.5, ring.color);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, cy, ring.r + 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Nodes
        nodes[ri].forEach((node, ni) => {
          const angle = node.angle + rot;
          const x = cx + Math.cos(angle) * ring.r;
          const y = cy + Math.sin(angle) * ring.r;
          const baseAlpha = ri === 2 ? 0.15 + Math.min(accumulated[2] / ring.nodeCount * 0.3, 0.3) : 0.1;
          const totalAlpha = baseAlpha + node.active * 0.7;

          if (totalAlpha > 0.05) {
            ctx.save();
            // Glow
            ctx.globalAlpha = totalAlpha * 0.4;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 12);
            grad.addColorStop(0, ring.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
            // Dot
            ctx.globalAlpha = totalAlpha;
            ctx.fillStyle = ring.color;
            ctx.beginPath();
            ctx.arc(x, y, 2 + node.active * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
      });

      // Pulses
      pulses = pulses.filter(p => p.progress < 1.2);
      pulses.forEach(p => {
        p.progress += 0.05;
        const ring = rings[p.ri];
        const ni = p.ni;
        const angle = nodes[p.ri][ni].angle + t * ring.speed;
        const px = cx + Math.cos(angle) * ring.r * Math.min(p.progress, 1);
        const py = cy + Math.sin(angle) * ring.r * Math.min(p.progress, 1);
        const alpha = 1 - p.progress / 1.2;
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grad.addColorStop(0, '#1A3AFF');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Central Brain node
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.04);
      ctx.save();
      ctx.globalAlpha = 0.06 + pulse * 0.06;
      const cGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35);
      cGlow.addColorStop(0, '#1A3AFF');
      cGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = cGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.fill();

      // Arcs
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#0D0D0D';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(cx, cy, 18, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 18, Math.PI * 0.12, Math.PI * 0.88);
      ctx.stroke();

      ctx.fillStyle = '#0D0D0D';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.8 + pulse * 0.2;
      ctx.fillStyle = '#1A3AFF';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Ring labels — mono, very small, positioned on right side of each ring
      rings.forEach((ring, ri) => {
        const labelX = cx + ring.r + 10;
        const labelY = cy;
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#0D0D0D';
        ctx.font = '8px "DM Mono", monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText(ring.label, labelX, labelY);
        ctx.restore();
      });

      t++;
      animFrame = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrame);
  });
</script>

<canvas bind:this={canvas} style="width:{width}px;height:{height}px;display:block;"></canvas>