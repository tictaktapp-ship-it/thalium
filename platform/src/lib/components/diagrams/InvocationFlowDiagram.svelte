<script lang="ts">
  import { onMount } from 'svelte';
  export let width = 720;
  export let height = 200;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    const W = width, H = height;

    // 5 stages left to right
    const stages = [
      { label: 'API CALL', x: 60 },
      { label: 'ANCHOR', x: 180 },
      { label: 'ROLE CHAIN', x: 340 },
      { label: 'ARTIFACT', x: 520 },
      { label: 'RING WRITE', x: 640 },
    ];

    // Active signal travelling through stages
    let signal = { stage: 0, progress: 0, alpha: 1 };
    let stageActive: number[] = new Array(stages.length).fill(0);
    let t = 0;
    const cy = H / 2;
    let animFrame: number;

    function glowNode(x: number, y: number, r: number, color: string, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.25;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Advance signal
      signal.progress += 0.018;
      if (signal.progress >= 1) {
        stageActive[signal.stage] = 1;
        signal.stage++;
        signal.progress = 0;
        if (signal.stage >= stages.length) {
          // Reset after pause
          setTimeout(() => {
            signal = { stage: 0, progress: 0, alpha: 1 };
            stageActive = new Array(stages.length).fill(0);
          }, 1200);
          return;
        }
      }

      // Decay stage highlights
      stageActive = stageActive.map((a, i) => i < signal.stage ? Math.max(0, a - 0.008) : a);

      // Draw connecting lines between stages
      for (let i = 0; i < stages.length - 1; i++) {
        const x1 = stages[i].x + 18;
        const x2 = stages[i + 1].x - 18;
        const lineAlpha = i < signal.stage ? 0.25 : 0.08;
        ctx.save();
        ctx.globalAlpha = lineAlpha;
        ctx.strokeStyle = '#0D0D0D';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(x1, cy);
        ctx.lineTo(x2, cy);
        ctx.stroke();
        ctx.restore();
      }

      // Active signal dot between stages
      if (signal.stage < stages.length - 1) {
        const from = stages[signal.stage].x;
        const to = stages[signal.stage + 1].x;
        const prog = Math.min(signal.progress, 1);
        const sx = from + (to - from) * prog;
        glowNode(sx, cy, 4, '#1A3AFF', 0.9);
      }

      // Stage nodes
      stages.forEach((stage, i) => {
        const isActive = i === signal.stage;
        const wasDone = i < signal.stage;
        const act = stageActive[i];

        // Node shape — circle for most, square for ARTIFACT
        const nodeAlpha = isActive ? 0.9 : wasDone ? 0.3 + act * 0.4 : 0.15;

        if (stage.label === 'ARTIFACT') {
          ctx.save();
          ctx.globalAlpha = nodeAlpha * 0.15;
          ctx.fillStyle = '#0D0D0D';
          ctx.fillRect(stage.x - 14, cy - 14, 28, 28);
          ctx.globalAlpha = nodeAlpha;
          ctx.strokeStyle = isActive ? '#1A3AFF' : '#0D0D0D';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(stage.x - 14, cy - 14, 28, 28);
          ctx.restore();
        } else if (stage.label === 'ROLE CHAIN') {
          // Multiple small dots to suggest chain
          for (let ri = 0; ri < 5; ri++) {
            const ry = cy - 12 + ri * 6;
            const rdot = isActive ? 2.5 : 1.5;
            const rAlpha = nodeAlpha * (isActive && ri === Math.floor(signal.progress * 5) ? 1 : 0.5);
            ctx.save();
            ctx.globalAlpha = rAlpha;
            ctx.fillStyle = isActive ? '#1A3AFF' : '#0D0D0D';
            ctx.beginPath();
            ctx.arc(stage.x, ry, rdot, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        } else {
          glowNode(stage.x, cy, isActive ? 10 : 7, isActive ? '#1A3AFF' : '#0D0D0D', nodeAlpha);
        }

        // Label
        ctx.save();
        ctx.globalAlpha = nodeAlpha * 0.6;
        ctx.fillStyle = '#0D0D0D';
        ctx.font = '8px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(stage.label, stage.x, cy + 30);
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