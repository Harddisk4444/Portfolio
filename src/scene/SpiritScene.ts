/**
 * Spirit Ring scene — raw WebGL2, loaded as its own chunk after first paint.
 *
 * Five draw calls per frame: soul formation, ring bands (instanced), martial-soul
 * aura, ring halos (instanced, same program) and the Qi particle field.
 * The render loop pauses when the hero is off-screen or the tab is hidden, and
 * `prefers-reduced-motion` gets a single static frame.
 */

import { RING_RANKS } from '../data/rings';
import { ARRAY_FS, ARRAY_VS, AURA_FS, AURA_VS, QI_FS, QI_VS, RING_FS, RING_VS } from './shaders';
import { clamp, damp, lookAt, mat4, multiply, perspective, type Vec3 } from './math';

export interface SceneOptions {
  /** Element whose box the canvas covers; drives visibility + scroll. */
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  /** The ring pillar is centred on, and sized to, this element. */
  anchor: HTMLElement;
  reducedMotion: MediaQueryList;
  onReady: () => void;
  onLost: () => void;
}

export interface SpiritScene {
  pulse(): void;
  dispose(): void;
}

const FOV = (32 * Math.PI) / 180;
const PILLAR_HEIGHT = 3.7;
const TARGET: Vec3 = [0, -0.12, 0];
const UP: Vec3 = [0, 1, 0];
const RING_SEG_U = 192;
const RING_SEG_V = 12;
const RING_LAYOUT = [
  { radius: 1.25, y: -1.42 },
  { radius: 1.19, y: -0.86 },
  { radius: 1.13, y: -0.3 },
  { radius: 1.07, y: 0.26 },
  { radius: 1.01, y: 0.82 },
  { radius: 0.95, y: 1.38 }
];
const ARRAY_Y = -1.78;

type Uniforms = Record<string, WebGLUniformLocation | null>;

interface Program {
  program: WebGLProgram;
  shaders: WebGLShader[];
  uniforms: Uniforms;
}

interface GpuResources {
  programs: { ring: Program; aura: Program; array: Program; qi: Program };
  buffers: WebGLBuffer[];
  vaos: { ring: WebGLVertexArrayObject; quad: WebGLVertexArrayObject; qi: WebGLVertexArrayObject };
  ringIndexCount: number;
  particleCount: number;
}

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function buildProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string, names: string[]): Program {
  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(vs, vsSrc);
  gl.shaderSource(fs, fsSrc);
  gl.compileShader(vs);
  gl.compileShader(fs);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  const uniforms: Uniforms = {};
  // Uniform locations are filled in after linking finishes (see `finishProgram`).
  names.forEach(n => (uniforms[n] = null));
  return { program, shaders: [vs, fs], uniforms };
}

function finishProgram(gl: WebGL2RenderingContext, p: Program): boolean {
  if (!gl.getProgramParameter(p.program, gl.LINK_STATUS)) {
    if (import.meta.env.DEV) {
      console.warn('[spirit] link failed', gl.getProgramInfoLog(p.program), p.shaders.map(s => gl.getShaderInfoLog(s)));
    }
    return false;
  }
  for (const name of Object.keys(p.uniforms)) p.uniforms[name] = gl.getUniformLocation(p.program, name);
  return true;
}

function ringGeometry() {
  const uv = new Float32Array((RING_SEG_U + 1) * (RING_SEG_V + 1) * 2);
  let k = 0;
  for (let i = 0; i <= RING_SEG_U; i++) {
    for (let j = 0; j <= RING_SEG_V; j++) {
      uv[k++] = i / RING_SEG_U;
      uv[k++] = j / RING_SEG_V;
    }
  }
  const index = new Uint16Array(RING_SEG_U * RING_SEG_V * 6);
  k = 0;
  const row = RING_SEG_V + 1;
  for (let i = 0; i < RING_SEG_U; i++) {
    for (let j = 0; j < RING_SEG_V; j++) {
      const a = i * row + j, b = (i + 1) * row + j;
      index[k++] = a; index[k++] = b; index[k++] = a + 1;
      index[k++] = b; index[k++] = b + 1; index[k++] = a + 1;
    }
  }
  return { uv, index };
}

function ringInstances() {
  const data = new Float32Array(RING_RANKS.length * 16);
  RING_RANKS.forEach((rank, i) => {
    const o = i * 16;
    const layout = RING_LAYOUT[i];
    // shape: radius, height, half-width, half-thickness
    data.set([layout.radius, layout.y, 0.075, 0.02], o);
    // motion: tiltX, tiltZ, spin, phase
    data.set([Math.sin(i * 2.1) * 0.05, Math.cos(i * 1.7) * 0.05, (i % 2 ? -1 : 1) * (0.018 + i * 0.004), i * 1.37], o + 4);
    data.set([...rank.glA, rank.mode], o + 8);
    data.set([...rank.glB, i], o + 12);
  });
  return data;
}

function particleSeeds(count: number) {
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  return seeds;
}

function particleBudget(): number {
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const weak = (navigator.hardwareConcurrency || 4) <= 4;
  return small || weak ? 700 : 1400;
}

async function createResources(gl: WebGL2RenderingContext): Promise<GpuResources | null> {
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const programs = {
    ring: buildProgram(gl, RING_VS, RING_FS, ['u_viewProj', 'u_offset', 'u_time', 'u_spread', 'u_halo', 'u_eye', 'u_pulse', 'u_intensity']),
    aura: buildProgram(gl, AURA_VS, AURA_FS, ['u_view', 'u_proj', 'u_offset', 'u_center', 'u_size', 'u_time', 'u_pulse', 'u_intensity']),
    array: buildProgram(gl, ARRAY_VS, ARRAY_FS, ['u_viewProj', 'u_offset', 'u_y', 'u_radius', 'u_time', 'u_pulse', 'u_intensity']),
    qi: buildProgram(gl, QI_VS, QI_FS, ['u_viewProj', 'u_offset', 'u_time', 'u_pulse', 'u_mouse', 'u_pxScale', 'u_field', 'u_spread', 'u_intensity'])
  };
  const all = Object.values(programs);

  // Let the GPU process compile in parallel instead of blocking the main thread.
  if (parallel) {
    const done = parallel.COMPLETION_STATUS_KHR;
    while (!all.every(p => gl.getProgramParameter(p.program, done))) {
      await nextFrame();
      if (gl.isContextLost()) return null;
    }
  }
  if (!all.every(p => finishProgram(gl, p))) {
    all.forEach(p => { gl.deleteProgram(p.program); p.shaders.forEach(s => gl.deleteShader(s)); });
    return null;
  }

  const buffers: WebGLBuffer[] = [];
  const buffer = (target: GLenum, data: BufferSource) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    buffers.push(b);
    return b;
  };

  // Rings: per-vertex uv + per-instance attributes (divisor 1).
  const geo = ringGeometry();
  const ringVao = gl.createVertexArray()!;
  gl.bindVertexArray(ringVao);
  buffer(gl.ARRAY_BUFFER, geo.uv);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  buffer(gl.ARRAY_BUFFER, ringInstances());
  for (let a = 0; a < 4; a++) {
    gl.enableVertexAttribArray(1 + a);
    gl.vertexAttribPointer(1 + a, 4, gl.FLOAT, false, 64, a * 16);
    gl.vertexAttribDivisor(1 + a, 1);
  }
  buffer(gl.ELEMENT_ARRAY_BUFFER, geo.index);

  // Unit quad shared by the aura billboard and the ground formation.
  const quadVao = gl.createVertexArray()!;
  gl.bindVertexArray(quadVao);
  buffer(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const particleCount = particleBudget();
  const qiVao = gl.createVertexArray()!;
  gl.bindVertexArray(qiVao);
  buffer(gl.ARRAY_BUFFER, particleSeeds(particleCount));
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  return {
    programs,
    buffers,
    vaos: { ring: ringVao, quad: quadVao, qi: qiVao },
    ringIndexCount: geo.index.length,
    particleCount
  };
}

function deleteResources(gl: WebGL2RenderingContext, res: GpuResources) {
  Object.values(res.programs).forEach(p => {
    p.shaders.forEach(s => { gl.detachShader(p.program, s); gl.deleteShader(s); });
    gl.deleteProgram(p.program);
  });
  res.buffers.forEach(b => gl.deleteBuffer(b));
  Object.values(res.vaos).forEach(v => gl.deleteVertexArray(v));
}

export async function createSpiritScene(opts: SceneOptions): Promise<SpiritScene | null> {
  const { host, canvas, anchor, reducedMotion } = opts;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'default',
    // Never fall back to software rendering: a static CSS hero beats a 10 fps one.
    failIfMajorPerformanceCaveat: true
  });
  if (!gl) return null;

  let res = await createResources(gl);
  if (!res) return null;

  // ── State ──────────────────────────────────────────────────────────────────
  const view = mat4(), proj = mat4(), viewProj = mat4();
  const eye: Vec3 = [0, 0, 6];
  let dpr = 1;
  let width = 1, height = 1;
  let offsetX = 0, offsetY = 0;
  let distance = 8;
  let fieldX = 3, fieldY = 3;
  let time = 7.5;
  let pulseAt = -100;
  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
  let scroll = 0, targetScroll = 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;
  let lost = false;
  let readyFired = false;

  const motionAllowed = () => !reducedMotion.matches;
  const shouldRun = () => !disposed && !lost && visible && !document.hidden && motionAllowed();

  // ── Layout ─────────────────────────────────────────────────────────────────
  const measure = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cw = Math.max(1, canvas.clientWidth), ch = Math.max(1, canvas.clientHeight);
    width = Math.round(cw * dpr);
    height = Math.round(ch * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const c = canvas.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    offsetX = ((a.left + a.width / 2 - c.left) / c.width) * 2 - 1;
    offsetY = -(((a.top + a.height / 2 - c.top) / c.height) * 2 - 1);
    const fraction = clamp(a.height / c.height, 0.2, 1);
    distance = PILLAR_HEIGHT / (fraction * 2 * Math.tan(FOV / 2));
    const visH = 2 * distance * Math.tan(FOV / 2);
    fieldY = visH / 2;
    fieldX = (visH * (c.width / c.height)) / 2;
  };

  const readScroll = () => {
    targetScroll = clamp(window.scrollY / Math.max(1, host.offsetHeight), 0, 1);
  };

  // ── Frame ──────────────────────────────────────────────────────────────────
  const draw = () => {
    if (!res || lost) return;
    const { programs: P, vaos } = res;
    const yaw = mouseX * 0.32 + Math.sin(time * 0.11) * 0.06;
    const pitch = 0.42 + mouseY * 0.07 + scroll * 0.3;
    eye[0] = TARGET[0] + distance * Math.sin(yaw) * Math.cos(pitch);
    eye[1] = TARGET[1] + distance * Math.sin(pitch);
    eye[2] = TARGET[2] + distance * Math.cos(yaw) * Math.cos(pitch);
    perspective(proj, FOV, width / height, 0.1, 100);
    lookAt(view, eye, TARGET, UP);
    multiply(viewProj, proj, view);
    const pulse = time - pulseAt;
    const spread = 1 + scroll * 0.45;
    const intensity = 1 - scroll * 0.55;

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);

    // 1. Soul formation on the ground (additive, behind everything).
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P.array.program);
    let u = P.array.uniforms;
    gl.uniformMatrix4fv(u.u_viewProj, false, viewProj);
    gl.uniform2f(u.u_offset, offsetX, offsetY);
    gl.uniform1f(u.u_y, ARRAY_Y * spread);
    gl.uniform1f(u.u_radius, 1.9);
    gl.uniform1f(u.u_time, time);
    gl.uniform1f(u.u_pulse, pulse);
    gl.uniform1f(u.u_intensity, intensity);
    gl.bindVertexArray(vaos.quad);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 2. Ring bands (premultiplied, depth-writing so they occlude what is behind).
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(P.ring.program);
    u = P.ring.uniforms;
    gl.uniformMatrix4fv(u.u_viewProj, false, viewProj);
    gl.uniform2f(u.u_offset, offsetX, offsetY);
    gl.uniform3f(u.u_eye, eye[0], eye[1], eye[2]);
    gl.uniform1f(u.u_time, time);
    gl.uniform1f(u.u_spread, spread);
    gl.uniform1f(u.u_pulse, pulse);
    gl.uniform1f(u.u_intensity, intensity);
    gl.uniform1f(u.u_halo, 0);
    gl.bindVertexArray(vaos.ring);
    gl.drawElementsInstanced(gl.TRIANGLES, res.ringIndexCount, gl.UNSIGNED_SHORT, 0, RING_RANKS.length);

    // 3. Martial Soul aura (additive; hidden behind the front halves of the rings).
    gl.depthMask(false);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P.aura.program);
    u = P.aura.uniforms;
    gl.uniformMatrix4fv(u.u_view, false, view);
    gl.uniformMatrix4fv(u.u_proj, false, proj);
    gl.uniform2f(u.u_offset, offsetX, offsetY);
    gl.uniform3f(u.u_center, 0, -0.05, 0);
    gl.uniform2f(u.u_size, 0.95, 2.05 * spread);
    gl.uniform1f(u.u_time, time);
    gl.uniform1f(u.u_pulse, pulse);
    gl.uniform1f(u.u_intensity, intensity);
    gl.bindVertexArray(vaos.quad);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 4. Ring halos — same program and instances, fattened in the vertex shader.
    gl.useProgram(P.ring.program);
    gl.uniform1f(P.ring.uniforms.u_halo, 1);
    gl.bindVertexArray(vaos.ring);
    gl.drawElementsInstanced(gl.TRIANGLES, res.ringIndexCount, gl.UNSIGNED_SHORT, 0, RING_RANKS.length);

    // 5. Qi particles.
    gl.useProgram(P.qi.program);
    u = P.qi.uniforms;
    gl.uniformMatrix4fv(u.u_viewProj, false, viewProj);
    gl.uniform2f(u.u_offset, offsetX, offsetY);
    gl.uniform1f(u.u_time, time);
    gl.uniform1f(u.u_pulse, pulse);
    gl.uniform2f(u.u_mouse, mouseX, mouseY);
    gl.uniform1f(u.u_pxScale, height / (2 * Math.tan(FOV / 2)));
    gl.uniform2f(u.u_field, fieldX, fieldY);
    gl.uniform1f(u.u_spread, spread);
    gl.uniform1f(u.u_intensity, intensity);
    gl.bindVertexArray(vaos.qi);
    gl.drawArrays(gl.POINTS, 0, res.particleCount);
    gl.bindVertexArray(null);

    if (!readyFired) {
      readyFired = true;
      opts.onReady();
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (!shouldRun()) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    time += dt;
    mouseX = damp(mouseX, targetMouseX, 4, dt);
    mouseY = damp(mouseY, targetMouseY, 4, dt);
    scroll = damp(scroll, targetScroll, 6, dt);
    draw();
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (raf || !shouldRun()) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  /** Re-evaluate whether to animate; reduced motion renders one calm, static frame. */
  const refresh = () => {
    if (shouldRun()) {
      start();
    } else {
      stop();
      if (!motionAllowed() && !disposed && !lost) {
        mouseX = mouseY = scroll = 0;
        draw();
      }
    }
  };

  // ── Events ─────────────────────────────────────────────────────────────────
  const onPointerMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    targetMouseX = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.2, 1.2);
    targetMouseY = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1.2, 1.2);
  };
  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as Element | null)?.closest('a, button, input, textarea, select, label')) return;
    pulse();
  };
  const onPulseEvent = () => pulse();
  const onScroll = () => readScroll();
  const onVisibility = () => refresh();
  const resizeObserver = new ResizeObserver(() => {
    measure();
    if (!raf) refresh();
  });
  const intersection = new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting);
    refresh();
  });
  const onContextLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    stop();
    res = null; // GPU objects died with the context; nothing left to delete.
    opts.onLost();
  };
  const onContextRestored = () => {
    void createResources(gl).then(r => {
      if (disposed || !r) return;
      res = r;
      lost = false;
      readyFired = false;
      measure();
      refresh();
    });
  };

  function pulse() {
    if (!motionAllowed()) return;
    pulseAt = time;
  }

  host.addEventListener('pointermove', onPointerMove, { passive: true });
  host.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('spirit:pulse', onPulseEvent);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotion.addEventListener('change', refresh);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  resizeObserver.observe(host);
  intersection.observe(host);

  measure();
  readScroll();
  scroll = targetScroll;
  refresh();
  pulse(); // the rings "awaken" with one flash when the scene first appears

  return {
    pulse,
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('spirit:pulse', onPulseEvent);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', refresh);
      resizeObserver.disconnect();
      intersection.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (res && !gl.isContextLost()) deleteResources(gl, res);
      res = null;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  };
}
