/**
 * Pseudo-3D Isometric Voxel Canvas Background
 * Highly optimized rendering loop with responsive particle mouse tracking.
 */

interface Voxel {
  x: number;
  y: number;
  z: number;
  size: number;
  speedY: number;
  color: string;
  angle: number;
  pulseSpeed: number;
}

export class CanvasGrid {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private voxels: Voxel[] = [];
  private mouse = { x: 0, y: 0 };
  private animationId: number = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.resizeCanvas();
    this.spawnVoxels();
    this.setupListeners();
    this.animate();
  }

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private spawnVoxels() {
    const voxelCount = Math.min(25, Math.floor((window.innerWidth * window.innerHeight) / 60000));
    const colors = [
      'rgba(0, 229, 255, 0.15)', // Neon Blue
      'rgba(57, 255, 20, 0.12)',  // Neon Green
      'rgba(255, 51, 102, 0.15)'  // Redstone Red
    ];

    this.voxels = [];
    for (let i = 0; i < voxelCount; i++) {
      this.voxels.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        z: Math.random() * 50 - 25,
        size: Math.random() * 16 + 12,
        speedY: -(Math.random() * 0.4 + 0.15),
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }

  private setupListeners() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.spawnVoxels();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }

  /**
   * Draws a pseudo-3D isometric cube
   */
  private drawIsometricCube(cx: number, cy: number, size: number, color: string, angle: number) {
    // Generate faces based on isometric projection
    const h = size * 0.577; // Hex aspect ratio for isometric faces
    const w = size;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(angle);

    // Color tones based on source
    // Extrapolate colors from rgba string
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    const r = match ? match[1] : '0';
    const g = match ? match[2] : '0';
    const b = match ? match[3] : '0';
    const a = match ? (match[4] ? parseFloat(match[4]) : 1) : 0.15;

    // Top Face (Rhombus)
    this.ctx.fillStyle = `rgba(${Math.min(255, parseInt(r) + 40)}, ${Math.min(255, parseInt(g) + 40)}, ${Math.min(255, parseInt(b) + 40)}, ${a})`;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -h);
    this.ctx.lineTo(w * 0.866, -h * 0.5);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(-w * 0.866, -h * 0.5);
    this.ctx.closePath();
    this.ctx.fill();

    // Left Face
    this.ctx.fillStyle = `rgba(${Math.max(0, parseInt(r) - 20)}, ${Math.max(0, parseInt(g) - 20)}, ${Math.max(0, parseInt(b) - 20)}, ${a})`;
    this.ctx.beginPath();
    this.ctx.moveTo(-w * 0.866, -h * 0.5);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(0, h);
    this.ctx.lineTo(-w * 0.866, h * 0.5);
    this.ctx.closePath();
    this.ctx.fill();

    // Right Face
    this.ctx.fillStyle = `rgba(${Math.max(0, parseInt(r) - 50)}, ${Math.max(0, parseInt(g) - 50)}, ${Math.max(0, parseInt(b) - 50)}, ${a})`;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(w * 0.866, -h * 0.5);
    this.ctx.lineTo(w * 0.866, h * 0.5);
    this.ctx.lineTo(0, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Draw cyber grid outline
    this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a + 0.15})`;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -h);
    this.ctx.lineTo(w * 0.866, -h * 0.5);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(-w * 0.866, -h * 0.5);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(-w * 0.866, -h * 0.5);
    this.ctx.lineTo(-w * 0.866, h * 0.5);
    this.ctx.lineTo(0, h);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(w * 0.866, h * 0.5);
    this.ctx.lineTo(w * 0.866, -h * 0.5);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private animate = () => {
    // Solid background paint to clear the canvas efficiently without layout flickering
    this.ctx.fillStyle = '#0F0F12';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background cyber matrix grids
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    this.ctx.lineWidth = 1;
    const gridSpacing = 80;
    for (let x = 0; x < this.canvas.width; x += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Render voxels
    this.voxels.forEach((voxel) => {
      // Float voxel upward
      voxel.y += voxel.speedY;
      voxel.angle += 0.002;

      // Wrap-around if voxel goes off screen top
      if (voxel.y < -voxel.size * 2) {
        voxel.y = this.canvas.height + voxel.size * 2;
        voxel.x = Math.random() * this.canvas.width;
      }

      // Add slight parallax based on cursor coordinate distance
      const dx = (this.mouse.x - this.canvas.width / 2) * (voxel.z * 0.0005);
      const dy = (this.mouse.y - this.canvas.height / 2) * (voxel.z * 0.0005);

      this.drawIsometricCube(
        voxel.x + dx,
        voxel.y + dy,
        voxel.size,
        voxel.color,
        voxel.angle
      );
    });

    this.animationId = requestAnimationFrame(this.animate);
  };

  destroy() {
    cancelAnimationFrame(this.animationId);
  }
}
