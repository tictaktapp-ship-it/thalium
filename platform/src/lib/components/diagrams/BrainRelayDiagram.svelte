<script lang="ts">
  import { onMount } from 'svelte';
  export let width = 560;
  export let height = 560;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    const W = width, H = height;
    const cx = W / 2, cy = H / 2;

    // --- PHASE MACHINE ---
    // 4 phases cycling: IDLE → INVOKE → CHAIN → WRITE
    // Each phase has distinct visual emphasis
    let phase = 0; // 0=idle, 1=invoke, 2=chain, 3=write
    let phaseT = 0; // time within phase
    const phaseDuration = [120, 80, 180, 100]; // frames per phase

    // Roles in the chain — 8 nodes arranged vertically inside the relay
    const roleCount = 8;
    const roleActiveFrames: number[] = new Array(roleCount).fill(0);
    let activeRole = -1;

    // Memory rings: 3 concentric — session (r=90), entity (r=150), institutional (r=220)
    const rings = [
      { r: 88, label: 'session', color: 'rgba(26,58,255,0.6)', dashLen: 3, gapLen: 5, speed: 0.003, nodeCount: 8 },
      { r: 148, label: 'entity', color: 'rgba(26,58,255,0.45)', dashLen: 4, gapLen: 8, speed: -0.002, nodeCount: 12 },
      { r: 220, label: 'institutional', color: 'rgba(26,58,255,0.3)', dashLen: 6, gapLen: 12, speed: 0.001, nodeCount: 18 },
    ];

    // Ring node activity (lights up when written to)
    const ringNodes = rings.map(r =>
      Array.from({ length: r.nodeCount }, (_, i) => ({
        angle: (i / r.nodeCount) * Math.PI * 2 + Math.random() * 0.3,
        active: 0, // brightness 0-1
        r: r.r,
        color: r.color
      }))
    );

    // Input signal from left
    let inputSignal = { x: -40, active: false, progress: 0, alpha: 0 };
    // Output artifact to right
    let outputSignal = { active: false, progress: 0, alpha: 0 };
    // Write pulses to rings
    let writePulses: { ringIdx: number, angle: number, progress: number, alpha: number }[] = [];

    let t = 0;
    let animFrame: number;

    function easeOut(x: number) { return 1 - Math.pow(1 - x, 3); }
    function easeIn(x: number) { return x * x * x; }
    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function glowDot(x: number, y: number, r: number, color: string, alpha: number) {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha * 0.3;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawRingArc(r: number, color: string, dashLen: number, gapLen: number, rotOffset: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([dashLen, gapLen]);
      ctx.lineDashOffset = -rotOffset * r;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function drawSignalLine(fromX: number, fromY: number, toX: number, toY: number, progress: number, color: string, alpha: number) {
      if (alpha <= 0 || progress <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha * 0.2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      const px = fromX + (toX - fromX) * Math.min(progress, 1);
      const py = fromY + (toY - fromY) * Math.min(progress, 1);
      ctx.globalAlpha = alpha;
      ctx.setLineDash([]);
      glowDot(px, py, 4, color, alpha);
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Phase progression
      phaseT++;
      if (phaseT >= phaseDuration[phase]) {
        phaseT = 0;
        phase = (phase + 1) % 4;

        if (phase === 1) {
          // Start input signal
          inputSignal = { x: -40, active: true, progress: 0, alpha: 1 };
        }
        if (phase === 2) {
          // Activate roles sequentially
          activeRole = 0;
        }
        if (phase === 3) {
          // Write to rings
          outputSignal = { active: true, progress: 0, alpha: 1 };
          for (let ri = 0; ri < rings.length; ri++) {
            const nodeIdx = Math.floor(Math.random() * rings[ri].nodeCount);
            writePulses.push({ ringIdx: ri, angle: ringNodes[ri][nodeIdx].angle, progress: 0, alpha: 1 });
            ringNodes[ri][nodeIdx].active = 1;
          }
        }
      }

      const phaseProgress = phaseT / phaseDuration[phase];

      // Role chain progression in phase 2
      if (phase === 2) {
        const roleStep = phaseDuration[2] / roleCount;
        activeRole = Math.min(Math.floor(phaseT / roleStep), roleCount - 1);
        roleActiveFrames[activeRole] = Math.min(roleActiveFrames[activeRole] + 0.08, 1);
      }

      // Decay roles after phase 2
      if (phase !== 2) {
        for (let i = 0; i < roleCount; i++) {
          roleActiveFrames[i] = Math.max(0, roleActiveFrames[i] - 0.015);
        }
      }

      // Decay ring nodes
      ringNodes.forEach(nodes => nodes.forEach(n => {
        n.active = Math.max(0, n.active - 0.008);
      }));

      // === DRAW ===

      // Background radial glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 280);
      bgGrad.addColorStop(0, 'rgba(26,58,255,0.05)');
      bgGrad.addColorStop(0.5, 'rgba(13,13,14,0)');
      bgGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // --- MEMORY RINGS ---
      rings.forEach((ring, ri) => {
        const baseAlpha = 0.5 + (ri === 2 ? 0.1 : 0);
        drawRingArc(ring.r, ring.color, ring.dashLen, ring.gapLen, t * ring.speed, baseAlpha);

        // Ring nodes
        ringNodes[ri].forEach(node => {
          if (node.active > 0.01) {
            const x = cx + Math.cos(node.angle + t * ring.speed * 0.3) * ring.r;
            const y = cy + Math.sin(node.angle + t * ring.speed * 0.3) * ring.r;
            glowDot(x, y, 3, '#1A3AFF', node.active * 0.8);
          }
        });
      });

      // --- ROLE CHAIN (vertical inside relay) ---
      const chainTop = cy - 38;
      const chainSpacing = 10;
      for (let i = 0; i < roleCount; i++) {
        const rx = cx;
        const ry = chainTop + i * chainSpacing;
        const act = roleActiveFrames[i];
        const idleAlpha = 0.08 + (i % 2 === 0 ? 0.02 : 0);

        if (act > 0.01) {
          // Active role — glowing dot
          glowDot(rx, ry, 2.5 + act * 1.5, '#1A3AFF', idleAlpha + act * 0.7);
          // Connection to next role
          if (i < roleCount - 1) {
            ctx.save();
            ctx.globalAlpha = act * 0.4;
            ctx.strokeStyle = '#1A3AFF';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(rx, ry + 3);
            ctx.lineTo(rx, ry + chainSpacing - 3);
            ctx.stroke();
            ctx.restore();
          }
        } else {
          // Idle role — dim dot
          ctx.save();
          ctx.globalAlpha = idleAlpha;
          ctx.fillStyle = '#0D0D0D';
          ctx.beginPath();
          ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // --- CENTRAL RELAY BODY ---
      const centralPulse = 0.5 + 0.5 * Math.sin(t * 0.025);
      const isActive = phase === 2;

      // Outer ring glow
      ctx.save();
      ctx.globalAlpha = 0.06 + (isActive ? centralPulse * 0.1 : 0);
      const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 55);
      outerGlow.addColorStop(0, 'rgba(26,58,255,0.8)');
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Arc strokes — brand mark at scale
      ctx.save();
      ctx.strokeStyle = '#0D0D0D';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(cx, cy, 28, Math.PI * 1.12, Math.PI * 1.88, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 28, Math.PI * 0.12, Math.PI * 0.88, false);
      ctx.stroke();
      ctx.restore();

      // Inner glow when chain is running
      if (isActive) {
        ctx.save();
        ctx.globalAlpha = centralPulse * 0.15;
        const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
        innerGlow.addColorStop(0, '#1A3AFF');
        innerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Node fill
      ctx.save();
      ctx.fillStyle = '#0D0D0D';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      const nodeAlpha = isActive ? 0.7 + centralPulse * 0.3 : 0.8;
      ctx.globalAlpha = nodeAlpha;
      ctx.fillStyle = '#1A3AFF';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- INPUT SIGNAL (left → center) ---
      if (inputSignal.active || phase === 1) {
        const prog = phase === 1 ? easeOut(phaseProgress) : Math.min(inputSignal.progress + 0.03, 1);
        inputSignal.progress = prog;
        const fromX = cx - 240;
        drawSignalLine(fromX, cy, cx - 32, cy, prog, '#1A3AFF', 0.8);
        // Input dot at origin
        glowDot(fromX, cy, 5, '#1A3AFF', 0.3 + 0.4 * (1 - prog));
      }

      // --- OUTPUT ARTIFACT (center → right) ---
      if (outputSignal.active) {
        outputSignal.progress = Math.min(outputSignal.progress + 0.025, 1);
        const toX = cx + 240;
        drawSignalLine(cx + 32, cy, toX, cy, outputSignal.progress, '#0D0D0D', 0.6);
        // Artifact square at destination
        if (outputSignal.progress > 0.8) {
          const artAlpha = (outputSignal.progress - 0.8) / 0.2;
          const artX = toX - 8;
          ctx.save();
          ctx.globalAlpha = artAlpha * 0.8;
          ctx.strokeStyle = '#0D0D0D';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(artX, cy - 8, 16, 16);
          ctx.globalAlpha = artAlpha * 0.1;
          ctx.fillStyle = '#0D0D0D';
          ctx.fillRect(artX, cy - 8, 16, 16);
          ctx.restore();
        }
        if (outputSignal.progress >= 1) {
          outputSignal.alpha = Math.max(0, outputSignal.alpha - 0.01);
          if (outputSignal.alpha <= 0) outputSignal.active = false;
        }
      }

      // --- WRITE PULSES (center → rings) ---
      writePulses = writePulses.filter(p => p.alpha > 0);
      writePulses.forEach(pulse => {
        pulse.progress = Math.min(pulse.progress + 0.04, 1);
        const ring = rings[pulse.ringIdx];
        const px = cx + Math.cos(pulse.angle) * ring.r * pulse.progress;
        const py = cy + Math.sin(pulse.angle) * ring.r * pulse.progress;
        glowDot(px, py, 2 + (1 - pulse.progress) * 2, '#1A3AFF', pulse.alpha * 0.7);
        if (pulse.progress >= 1) pulse.alpha = Math.max(0, pulse.alpha - 0.03);
      });

      // --- ANCHOR INDICATOR (small square above center) ---
      const anchorY = cy - 52;
      ctx.save();
      ctx.globalAlpha = phase === 1 || phase === 2 ? 0.4 + 0.3 * centralPulse : 0.15;
      ctx.strokeStyle = '#1A3AFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 5, anchorY - 5, 10, 10);
      ctx.restore();

      t++;
      animFrame = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrame);
  });
</script>

<canvas
  bind:this={canvas}
  style="width:{width}px;height:{height}px;display:block;"
></canvas>