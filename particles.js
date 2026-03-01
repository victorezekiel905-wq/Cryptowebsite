// =============================================
//  SwiftCipher Particle Engine
//  Simulates live market data flow
// =============================================

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.lines = [];
    this.mouse = { x: null, y: null, radius: 120 };
    this.colors = ['#F3BA2F', '#6C63FF', '#00d4aa', '#ffffff'];
    this.animId = null;

    this.resize();
    this.init();
    this.bindEvents();
    this.loop();
  }

  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  init() {
    this.particles = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 10000);
    const n = Math.min(Math.max(count, 40), 120);

    for (let i = 0; i < n; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const colorIndex = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * this.colors.length);
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: this.colors[colorIndex],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02
    };
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.init();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  update() {
    this.particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      p.x += p.vx;
      p.y += p.vy;

      // Mouse repulsion
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }
      }

      // Wrap edges
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.canvas.height + 10;
      if (p.y > this.canvas.height + 10) p.y = -10;
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connection lines
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 120;

        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(243, 186, 47, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    this.particles.forEach(p => {
      const pulsedAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      // Glow effect for gold particles
      if (p.color === '#F3BA2F') {
        this.ctx.shadowColor = '#F3BA2F';
        this.ctx.shadowBlur = 8;
      } else {
        this.ctx.shadowBlur = 0;
      }

      this.ctx.fillStyle = p.color.replace(')', `, ${pulsedAlpha})`).replace('rgb', 'rgba').replace('#F3BA2F', `rgba(243, 186, 47, ${pulsedAlpha})`).replace('#6C63FF', `rgba(108, 99, 255, ${pulsedAlpha})`).replace('#00d4aa', `rgba(0, 212, 170, ${pulsedAlpha})`).replace('#ffffff', `rgba(255, 255, 255, ${pulsedAlpha})`);

      // Simpler approach
      const hex = p.color;
      let r, g, b;
      if (hex === '#F3BA2F') { r = 243; g = 186; b = 47; }
      else if (hex === '#6C63FF') { r = 108; g = 99; b = 255; }
      else if (hex === '#00d4aa') { r = 0; g = 212; b = 170; }
      else { r = 255; g = 255; b = 255; }

      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pulsedAlpha})`;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }

  loop() {
    this.update();
    this.draw();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('particle-canvas')) {
    window.particleEngine = new ParticleEngine('particle-canvas');
  }
});
