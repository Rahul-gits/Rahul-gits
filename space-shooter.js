/**
 * Git Invaders: Cosmic Code Defender
 * HTML5 Canvas Space Shooter Mini-Game Engine for rahul-gits
 */

class SpaceShooter {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('rahul_gits_highscore') || '0', 10);
    this.wave = 1;
    this.soundEnabled = true;

    // Canvas size
    this.width = this.canvas.width = 800;
    this.height = this.canvas.height = 500;

    // Player
    this.player = {
      x: this.width / 2 - 20,
      y: this.height - 60,
      width: 40,
      height: 40,
      speed: 6,
      hp: 100,
      maxHp: 100,
      shield: 0,
      tripleShotTimer: 0,
      speedBoostTimer: 0,
      color: '#3fb950'
    };

    // Entities
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.boss = null;

    // Controls
    this.keys = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
      KeyA: false,
      KeyD: false,
      KeyW: false,
      KeyS: false,
      Space: false
    };

    this.lastShotTime = 0;
    this.shotCooldown = 150; // ms
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 1200; // ms

    this.initAudio();
    this.bindEvents();
  }

  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  }

  playSound(type) {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (type === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'explosion') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'powerup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.15);
      osc.frequency.linearRampToValueAtTime(900, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = true;
        if (e.code === 'Space') e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = false;
      }
    });

    // Touch / On-screen controls
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnFire = document.getElementById('btnFire');

    if (btnLeft) {
      btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.ArrowLeft = true; });
      btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.ArrowLeft = false; });
      btnLeft.addEventListener('mousedown', () => { this.keys.ArrowLeft = true; });
      btnLeft.addEventListener('mouseup', () => { this.keys.ArrowLeft = false; });
    }
    if (btnRight) {
      btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.ArrowRight = true; });
      btnRight.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.ArrowRight = false; });
      btnRight.addEventListener('mousedown', () => { this.keys.ArrowRight = true; });
      btnRight.addEventListener('mouseup', () => { this.keys.ArrowRight = false; });
    }
    if (btnFire) {
      btnFire.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.Space = true; });
      btnFire.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.Space = false; });
      btnFire.addEventListener('mousedown', () => { this.keys.Space = true; });
      btnFire.addEventListener('mouseup', () => { this.keys.Space = false; });
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
    this.player.x = this.width / 2 - 20;
    this.player.y = this.height - 60;
    this.player.hp = 100;
    this.player.shield = 0;
    this.player.tripleShotTimer = 0;
    this.player.speedBoostTimer = 0;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.boss = null;
    this.enemySpawnInterval = 1200;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused && this.isRunning) {
      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  triggerBomb() {
    if (this.isGameOver || this.isPaused) return;
    this.enemies.forEach(enemy => {
      this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
      this.score += enemy.points;
    });
    this.enemies = [];
    if (this.boss) {
      this.boss.hp -= 200;
      this.createExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#f85149');
    }
    this.playSound('explosion');
  }

  shoot() {
    const now = performance.now();
    if (now - this.lastShotTime < this.shotCooldown) return;
    this.lastShotTime = now;

    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;

    if (this.player.tripleShotTimer > 0) {
      this.bullets.push(
        { x: px - 10, y: py, vx: -2, vy: -10, color: '#bc8cff' },
        { x: px, y: py, vx: 0, vy: -10, color: '#3fb950' },
        { x: px + 10, y: py, vx: 2, vy: -10, color: '#bc8cff' }
      );
    } else {
      this.bullets.push({ x: px - 2, y: py, vx: 0, vy: -10, color: '#3fb950' });
    }

    this.playSound('laser');
  }

  spawnEnemy() {
    const types = [
      { name: 'Bug 👾', color: '#f85149', hp: 1, speed: 2, points: 10, symbol: '👾' },
      { name: 'Syntax 💥', color: '#d29922', hp: 2, speed: 2.5, points: 25, symbol: '💥' },
      { name: 'Merge 🔀', color: '#a371f7', hp: 4, speed: 1.5, points: 50, symbol: '🔀' },
      { name: 'Memory 💧', color: '#58a6ff', hp: 1, speed: 4, points: 30, symbol: '💧' }
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const w = 36;
    const h = 36;
    const x = Math.random() * (this.width - w);

    this.enemies.push({
      x: x,
      y: -h,
      width: w,
      height: h,
      type: type.name,
      symbol: type.symbol,
      color: type.color,
      hp: type.hp,
      maxHp: type.hp,
      speed: type.speed + (this.wave * 0.2),
      points: type.points
    });

    // Spawn Boss every 500 points if no boss active
    if (this.score > 0 && this.score % 500 < 50 && !this.boss && Math.random() < 0.1) {
      this.boss = {
        x: this.width / 2 - 60,
        y: -100,
        width: 120,
        height: 80,
        hp: 300 + (this.wave * 100),
        maxHp: 300 + (this.wave * 100),
        speedX: 3,
        color: '#f85149',
        symbol: '👹 Monolith'
      };
    }
  }

  spawnPowerup(x, y) {
    if (Math.random() > 0.3) return; // 30% chance
    const types = [
      { name: 'TripleShot', symbol: '⚡', color: '#bc8cff' },
      { name: 'Shield', symbol: '🛡️', color: '#58a6ff' },
      { name: 'Heal', symbol: '💚', color: '#3fb950' },
      { name: 'Bomb', symbol: '💣', color: '#d29922' }
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x, y, width: 24, height: 24, type: type.name, symbol: type.symbol, color: type.color, speed: 2
    });
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        radius: Math.random() * 3 + 1,
        color: color,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.02
      });
    }
  }

  update(delta) {
    if (this.isPaused || this.isGameOver) return;

    // Movement speeds
    const curSpeed = this.player.speedBoostTimer > 0 ? this.player.speed * 1.5 : this.player.speed;

    if ((this.keys.ArrowLeft || this.keys.KeyA) && this.player.x > 0) {
      this.player.x -= curSpeed;
    }
    if ((this.keys.ArrowRight || this.keys.KeyD) && this.player.x < this.width - this.player.width) {
      this.player.x += curSpeed;
    }
    if ((this.keys.ArrowUp || this.keys.KeyW) && this.player.y > 50) {
      this.player.y -= curSpeed;
    }
    if ((this.keys.ArrowDown || this.keys.KeyS) && this.player.y < this.height - this.player.height) {
      this.player.y += curSpeed;
    }
    if (this.keys.Space) {
      this.shoot();
    }

    // Timers
    if (this.player.tripleShotTimer > 0) this.player.tripleShotTimer -= delta;
    if (this.player.speedBoostTimer > 0) this.player.speedBoostTimer -= delta;

    // Enemy spawn
    this.enemySpawnTimer += delta;
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.enemySpawnTimer = 0;
      this.spawnEnemy();
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      if (b.y < -10 || b.x < 0 || b.x > this.width) {
        this.bullets.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.y += e.speed;

      // Enemy hit player
      if (this.checkCollision(this.player, e)) {
        this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
        if (this.player.shield > 0) {
          this.player.shield -= 25;
          if (this.player.shield < 0) this.player.shield = 0;
        } else {
          this.player.hp -= 20;
        }
        this.enemies.splice(i, 1);
        this.playSound('explosion');
        if (this.player.hp <= 0) {
          this.gameOver();
        }
        continue;
      }

      // Enemy reached bottom
      if (e.y > this.height) {
        this.enemies.splice(i, 1);
        this.player.hp -= 5;
        if (this.player.hp <= 0) this.gameOver();
        continue;
      }

      // Bullet collision with enemy
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (this.checkCollision({ x: b.x, y: b.y, width: 4, height: 10 }, e)) {
          e.hp -= 1;
          this.bullets.splice(j, 1);
          if (e.hp <= 0) {
            this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
            this.spawnPowerup(e.x + e.width / 2, e.y + e.height / 2);
            this.score += e.points;
            this.enemies.splice(i, 1);
            this.playSound('explosion');

            // Level progression
            if (this.score >= this.wave * 300) {
              this.wave++;
              if (this.enemySpawnInterval > 400) this.enemySpawnInterval -= 150;
            }
            break;
          }
        }
      }
    }

    // Update Boss
    if (this.boss) {
      if (this.boss.y < 50) this.boss.y += 2;
      this.boss.x += this.boss.speedX;
      if (this.boss.x <= 0 || this.boss.x >= this.width - this.boss.width) {
        this.boss.speedX *= -1;
      }

      // Boss bullet collision
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (this.checkCollision({ x: b.x, y: b.y, width: 4, height: 10 }, this.boss)) {
          this.boss.hp -= 1;
          this.bullets.splice(j, 1);
          if (this.boss.hp <= 0) {
            this.createExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#f85149');
            this.score += 500;
            this.boss = null;
            this.playSound('explosion');
            break;
          }
        }
      }
    }

    // Update Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.speed;
      if (this.checkCollision(this.player, p)) {
        if (p.type === 'TripleShot') this.player.tripleShotTimer = 8000;
        if (p.type === 'Shield') this.player.shield = 50;
        if (p.type === 'Heal') this.player.hp = Math.min(100, this.player.hp + 30);
        if (p.type === 'Bomb') this.triggerBomb();
        this.playSound('powerup');
        this.powerups.splice(i, 1);
      } else if (p.y > this.height) {
        this.powerups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.life -= part.decay;
      if (part.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  gameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    this.playSound('gameover');
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('rahul_gits_highscore', this.highScore.toString());
    }
  }

  render() {
    // Clear Canvas
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Grid / Stars background
    this.ctx.strokeStyle = '#161b22';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    if (!this.isRunning && !this.isGameOver) {
      // Start Screen Overlay
      this.ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#3fb950';
      this.ctx.font = 'bold 28px "Fira Code", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('👾 GIT INVADERS: DEFEND THE REPO 👾', this.width / 2, this.height / 2 - 40);
      this.ctx.fillStyle = '#c9d1d9';
      this.ctx.font = '16px "Fira Code", monospace';
      this.ctx.fillText('Use WASD / Arrows to Move • SPACE to Shoot', this.width / 2, this.height / 2 + 10);
      this.ctx.fillStyle = '#58a6ff';
      this.ctx.fillText('Click "START GAME" button below to launch mission!', this.width / 2, this.height / 2 + 50);
      return;
    }

    // Draw Player
    this.ctx.save();
    this.ctx.fillStyle = this.player.color;

    // Starship shape
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    this.ctx.beginPath();
    this.ctx.moveTo(px + pw / 2, py);
    this.ctx.lineTo(px + pw, py + ph);
    this.ctx.lineTo(px + pw / 2, py + ph - 10);
    this.ctx.lineTo(px, py + ph);
    this.ctx.closePath();
    this.ctx.fill();

    // Draw Shield Aura if active
    if (this.player.shield > 0) {
      this.ctx.strokeStyle = '#58a6ff';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(px + pw / 2, py + ph / 2, 30, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Draw Bullets
    this.bullets.forEach((b) => {
      this.ctx.fillStyle = b.color;
      this.ctx.fillRect(b.x, b.y, 4, 12);
    });

    // Draw Enemies
    this.enemies.forEach((e) => {
      this.ctx.fillStyle = e.color;
      this.ctx.font = '22px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(e.symbol, e.x + e.width / 2, e.y + e.height / 2 + 8);
    });

    // Draw Boss
    if (this.boss) {
      this.ctx.fillStyle = this.boss.color;
      this.ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 18px "Fira Code", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.boss.symbol, this.boss.x + this.boss.width / 2, this.boss.y + 40);

      // Boss Healthbar
      const hpPct = this.boss.hp / this.boss.maxHp;
      this.ctx.fillStyle = '#21262d';
      this.ctx.fillRect(this.boss.x, this.boss.y - 12, this.boss.width, 8);
      this.ctx.fillStyle = '#f85149';
      this.ctx.fillRect(this.boss.x, this.boss.y - 12, this.boss.width * hpPct, 8);
    }

    // Draw Powerups
    this.powerups.forEach((p) => {
      this.ctx.fillStyle = p.color;
      this.ctx.font = '18px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(p.symbol, p.x, p.y);
    });

    // Draw Particles
    this.particles.forEach((part) => {
      this.ctx.save();
      this.ctx.globalAlpha = part.life;
      this.ctx.fillStyle = part.color;
      this.ctx.beginPath();
      this.ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // HUD (Score, Health, High Score, Wave)
    this.ctx.fillStyle = '#c9d1d9';
    this.ctx.font = 'bold 14px "Fira Code", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 15, 25);
    this.ctx.fillText(`HIGH SCORE: ${this.highScore}`, 15, 45);
    this.ctx.fillText(`WAVE: ${this.wave}`, 150, 25);

    // Player Healthbar
    this.ctx.fillStyle = '#21262d';
    this.ctx.fillRect(this.width - 165, 15, 150, 14);
    this.ctx.fillStyle = this.player.hp > 30 ? '#3fb950' : '#f85149';
    this.ctx.fillRect(this.width - 165, 15, Math.max(0, (this.player.hp / this.player.maxHp) * 150), 14);
    this.ctx.strokeStyle = '#30363d';
    this.ctx.strokeRect(this.width - 165, 15, 150, 14);

    if (this.isPaused) {
      this.ctx.fillStyle = 'rgba(13, 17, 23, 0.75)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#d29922';
      this.ctx.font = 'bold 32px "Fira Code", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⏸️ GAME PAUSED', this.width / 2, this.height / 2);
    }

    if (this.isGameOver) {
      this.ctx.fillStyle = 'rgba(13, 17, 23, 0.88)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#f85149';
      this.ctx.font = 'bold 36px "Fira Code", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('💥 GAME OVER 💥', this.width / 2, this.height / 2 - 30);
      this.ctx.fillStyle = '#c9d1d9';
      this.ctx.font = '18px "Fira Code", monospace';
      this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, this.height / 2 + 10);
      this.ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.width / 2, this.height / 2 + 40);
      this.ctx.fillStyle = '#3fb950';
      this.ctx.fillText('Click "RESTART GAME" button to try again!', this.width / 2, this.height / 2 + 80);
    }
  }

  loop(currentTime) {
    if (!this.isRunning && !this.isGameOver && !this.isPaused) return;

    const delta = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(delta);
    this.render();

    if (this.isRunning && !this.isPaused) {
      requestAnimationFrame((t) => this.loop(t));
    }
  }
}

window.SpaceShooter = SpaceShooter;
