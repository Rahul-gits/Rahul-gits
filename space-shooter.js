/**
 * RAHUL.OS Multi-Game Engine (Space Shooter + Tech Snake)
 * Embedded HTML5 Canvas Engine for Rahul-gits
 */

class SpaceShooter {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Modes: 'shooter' | 'snake'
    this.mode = 'shooter';

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('rahul_arcade_highscore') || '0', 10);
    this.wave = 1;
    this.soundEnabled = true;

    // Canvas size
    this.width = this.canvas.width = 800;
    this.height = this.canvas.height = 460;

    // Space Shooter Player
    this.player = {
      x: this.width / 2 - 20,
      y: this.height - 50,
      width: 36,
      height: 36,
      speed: 6.5,
      hp: 100,
      maxHp: 100,
      shield: 0,
      tripleShotTimer: 0,
      color: '#00e5ff'
    };

    // Tech Snake State
    this.snake = [{ x: 10, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 8 }];
    this.snakeDir = { x: 1, y: 0 };
    this.snakeFood = this.randomFood();
    this.snakeTick = 0;

    // Space Shooter Entities
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.boss = null;

    // Key states
    this.keys = {
      ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false,
      KeyA: false, KeyD: false, KeyW: false, KeyS: false, Space: false
    };

    this.lastShotTime = 0;
    this.shotCooldown = 140;
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 1100;

    this.initAudio();
    this.bindEvents();
  }

  setGameMode(newMode) {
    this.mode = newMode;
    this.reset();
    this.start();
  }

  randomFood() {
    const tech = ['PYTHON', 'REACT', 'FASTAPI', 'MONGODB', 'DOCKER', 'RAG', 'AGENT'];
    return {
      x: Math.floor(Math.random() * 26) + 1,
      y: Math.floor(Math.random() * 14) + 1,
      label: tech[Math.floor(Math.random() * tech.length)]
    };
  }

  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  }

  playSound(type) {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (type === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'explosion') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'powerup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    }
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = true;
        if (e.code === 'Space') e.preventDefault();
      }

      // Snake directions
      if (this.mode === 'snake') {
        if ((e.key === 'ArrowUp' || e.key === 'w') && this.snakeDir.y !== 1) this.snakeDir = { x: 0, y: -1 };
        if ((e.key === 'ArrowDown' || e.key === 's') && this.snakeDir.y !== -1) this.snakeDir = { x: 0, y: 1 };
        if ((e.key === 'ArrowLeft' || e.key === 'a') && this.snakeDir.x !== 1) this.snakeDir = { x: -1, y: 0 };
        if ((e.key === 'ArrowRight' || e.key === 'd') && this.snakeDir.x !== -1) this.snakeDir = { x: 1, y: 0 };
      }

      // Secret Terminal shortcut
      if (e.key.toLowerCase() === 'g') {
        const term = document.getElementById('terminal');
        if (term) term.style.display = term.style.display === 'none' ? 'block' : 'none';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = false;
    });

    // Touch controls
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnFire = document.getElementById('btnFire');

    if (btnLeft) {
      btnLeft.addEventListener('mousedown', () => {
        if (this.mode === 'snake') this.snakeDir = { x: -1, y: 0 };
        else this.keys.ArrowLeft = true;
      });
      btnLeft.addEventListener('mouseup', () => { this.keys.ArrowLeft = false; });
    }
    if (btnRight) {
      btnRight.addEventListener('mousedown', () => {
        if (this.mode === 'snake') this.snakeDir = { x: 1, y: 0 };
        else this.keys.ArrowRight = true;
      });
      btnRight.addEventListener('mouseup', () => { this.keys.ArrowRight = false; });
    }
    if (btnFire) {
      btnFire.addEventListener('click', () => {
        if (this.mode === 'shooter') this.shoot();
      });
    }
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  reset() {
    this.score = 0;
    this.wave = 1;
    this.isGameOver = false;
    this.player.x = this.width / 2 - 18;
    this.player.y = this.height - 50;
    this.player.hp = 100;
    this.player.shield = 0;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.boss = null;

    this.snake = [{ x: 10, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 8 }];
    this.snakeDir = { x: 1, y: 0 };
    this.snakeFood = this.randomFood();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused && this.isRunning) {
      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  triggerBomb() {
    if (this.isGameOver || this.isPaused || this.mode !== 'shooter') return;
    this.enemies.forEach(e => {
      this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
      this.score += e.points;
    });
    this.enemies = [];
    this.playSound('explosion');
  }

  shoot() {
    if (this.mode !== 'shooter') return;
    const now = performance.now();
    if (now - this.lastShotTime < this.shotCooldown) return;
    this.lastShotTime = now;

    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;

    this.bullets.push({ x: px - 2, y: py, vx: 0, vy: -10, color: '#39ff88' });
    this.playSound('laser');
  }

  spawnEnemy() {
    const types = [
      { name: 'Bug 👾', color: '#ff5577', hp: 1, speed: 2.2, points: 100, symbol: '👾' },
      { name: 'Syntax 💥', color: '#ffaa00', hp: 2, speed: 2.6, points: 150, symbol: '💥' },
      { name: 'Merge 🔀', color: '#bc8cff', hp: 3, speed: 1.6, points: 250, symbol: '🔀' }
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    this.enemies.push({
      x: Math.random() * (this.width - 40),
      y: -35,
      width: 35,
      height: 35,
      symbol: type.symbol,
      color: type.color,
      hp: type.hp,
      speed: type.speed + (this.wave * 0.2),
      points: type.points
    });
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        radius: Math.random() * 3 + 1,
        color: color,
        life: 1.0,
        decay: Math.random() * 0.06 + 0.03
      });
    }
  }

  updateShooter(delta) {
    if ((this.keys.ArrowLeft || this.keys.KeyA) && this.player.x > 0) this.player.x -= this.player.speed;
    if ((this.keys.ArrowRight || this.keys.KeyD) && this.player.x < this.width - this.player.width) this.player.x += this.player.speed;
    if (this.keys.Space) this.shoot();

    // Spawning
    this.enemySpawnTimer += delta;
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.enemySpawnTimer = 0;
      this.spawnEnemy();
    }

    // Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy;
      if (b.y < -10) this.bullets.splice(i, 1);
    }

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.y += e.speed;

      if (e.y > this.height - 20) {
        this.enemies.splice(i, 1);
        this.player.hp -= 15;
        if (this.player.hp <= 0) this.gameOver();
        continue;
      }

      // Bullet hits enemy
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (Math.abs(b.x - (e.x + e.width / 2)) < 20 && Math.abs(b.y - (e.y + e.height / 2)) < 20) {
          e.hp--;
          this.bullets.splice(j, 1);
          if (e.hp <= 0) {
            this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
            this.score += e.points;
            this.enemies.splice(i, 1);
            this.playSound('explosion');
            break;
          }
        }
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  updateSnake() {
    this.snakeTick++;
    if (this.snakeTick % 7 !== 0) return;

    const head = { x: this.snake[0].x + this.snakeDir.x, y: this.snake[0].y + this.snakeDir.y };

    if (head.x < 0 || head.y < 0 || head.x > 26 || head.y > 15 || this.snake.some(p => p.x === head.x && p.y === head.y)) {
      this.gameOver();
      return;
    }

    this.snake.unshift(head);
    if (head.x === this.snakeFood.x && head.y === this.snakeFood.y) {
      this.score += 100;
      this.playSound('powerup');
      this.snakeFood = this.randomFood();
    } else {
      this.snake.pop();
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('rahul_arcade_highscore', this.highScore.toString());
    }
  }

  render() {
    this.ctx.fillStyle = '#05070b';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.mode === 'shooter') {
      // Draw Space Shooter
      this.ctx.fillStyle = '#00e5ff';
      const px = this.player.x, py = this.player.y, pw = this.player.width, ph = this.player.height;
      this.ctx.beginPath();
      this.ctx.moveTo(px + pw / 2, py);
      this.ctx.lineTo(px + pw, py + ph);
      this.ctx.lineTo(px + pw / 2, py + ph - 8);
      this.ctx.lineTo(px, py + ph);
      this.ctx.closePath();
      this.ctx.fill();

      // Bullets
      this.bullets.forEach(b => {
        this.ctx.fillStyle = b.color;
        this.ctx.fillRect(b.x, b.y, 4, 12);
      });

      // Enemies
      this.enemies.forEach(e => {
        this.ctx.fillStyle = e.color;
        this.ctx.font = '22px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(e.symbol, e.x + e.width / 2, e.y + e.height / 2 + 6);
      });

      // Particles
      this.particles.forEach(p => {
        this.ctx.save();
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });

      // HUD
      this.ctx.fillStyle = '#39ff88';
      this.ctx.font = 'bold 14px "Fira Code", monospace';
      this.ctx.fillText(`SCORE: ${this.score}`, 15, 25);
      this.ctx.fillText(`HIGH: ${this.highScore}`, 150, 25);
      this.ctx.fillText(`HP: ${this.player.hp}%`, 300, 25);

    } else if (this.mode === 'snake') {
      // Draw Tech Snake
      const cell = 26, ox = 30, oy = 20;

      this.snake.forEach((p, i) => {
        this.ctx.fillStyle = i ? '#18c96e' : '#39ff88';
        this.ctx.fillRect(ox + p.x * cell, oy + p.y * cell, cell - 3, cell - 3);
      });

      this.ctx.fillStyle = '#00e5ff';
      this.ctx.font = 'bold 13px "Fira Code", monospace';
      this.ctx.fillText(this.snakeFood.label, ox + this.snakeFood.x * cell, oy + this.snakeFood.y * cell + 18);

      this.ctx.fillStyle = '#00e5ff';
      this.ctx.font = 'bold 14px "Fira Code", monospace';
      this.ctx.fillText(`SNAKE SCORE: ${this.score}`, 15, 25);
      this.ctx.fillText(`HIGH: ${this.highScore}`, 200, 25);
    }

    if (this.isGameOver) {
      this.ctx.fillStyle = 'rgba(5, 7, 11, 0.88)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#ff5577';
      this.ctx.font = 'bold 32px "Fira Code", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('💥 GAME OVER 💥', this.width / 2, this.height / 2 - 20);
      this.ctx.fillStyle = '#e9f3ff';
      this.ctx.font = '16px "Fira Code", monospace';
      this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, this.height / 2 + 15);
      this.ctx.fillStyle = '#39ff88';
      this.ctx.fillText('Click "START / RESTART" to try again!', this.width / 2, this.height / 2 + 50);
    }
  }

  loop(currentTime) {
    if (!this.isRunning && !this.isGameOver && !this.isPaused) return;

    const delta = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.mode === 'shooter') this.updateShooter(delta);
    else if (this.mode === 'snake') this.updateSnake();

    this.render();

    if (this.isRunning && !this.isPaused) {
      requestAnimationFrame((t) => this.loop(t));
    }
  }
}

window.SpaceShooter = SpaceShooter;
