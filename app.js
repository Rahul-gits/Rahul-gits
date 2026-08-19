/**
 * App Logic & Terminal CLI Interface for rahul-gits
 */

document.addEventListener('DOMContentLoaded', () => {
  // Init Space Shooter Game
  const game = new SpaceShooter('gameCanvas');
  window.game = game;

  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnBomb = document.getElementById('btnBomb');
  const btnSound = document.getElementById('btnSound');

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      game.start();
      btnStart.textContent = '🔄 RESTART GAME';
    });
  }
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      game.togglePause();
      btnPause.textContent = game.isPaused ? '▶️ RESUME' : '⏸️ PAUSE';
    });
  }
  if (btnBomb) {
    btnBomb.addEventListener('click', () => {
      game.triggerBomb();
    });
  }
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      game.soundEnabled = !game.soundEnabled;
      btnSound.textContent = game.soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
    });
  }

  // Starfield Background Animation
  initStarfield();

  // Terminal Interface
  initTerminal();

  // Skills Tabs
  initSkillsTabs();

  // Copy README Modal
  initReadmeModal();
});

function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.8 + 0.2,
    speed: Math.random() * 0.4 + 0.1
  }));

  function draw() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach(star => {
      star.y += star.speed;
      if (star.y > height) star.y = 0;

      ctx.fillStyle = `rgba(201, 209, 217, ${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

function initTerminal() {
  const terminalInput = document.getElementById('terminalInput');
  const terminalLogs = document.getElementById('terminalLogs');

  if (!terminalInput || !terminalLogs) return;

  const commands = {
    help: () => `
Available commands:
  - <span style="color:#3fb950">about</span>      : Show developer profile summary
  - <span style="color:#3fb950">skills</span>     : Display core tech stack
  - <span style="color:#3fb950">projects</span>   : List featured open-source repositories
  - <span style="color:#3fb950">game</span>       : Scroll to Space Shooter Arcade
  - <span style="color:#3fb950">trophies</span>   : View unlocked developer badges
  - <span style="color:#3fb950">contact</span>    : Show social connect handles
  - <span style="color:#3fb950">clear</span>      : Clear terminal screen
  - <span style="color:#3fb950">sudo hire</span>  : Unlock recruiter direct route
    `,
    about: () => `
<span style="color:#58a6ff">rahul-gits</span> - Full-Stack Software Engineer
----------------------------------------
Building resilient web applications & interactive digital tools.
Location : Deep Space Orbit / Earth 🛰️
Status   : 🟢 Building cool stuff & destroying production bugs!
    `,
    skills: () => `
Frontend : TypeScript, React, Next.js, HTML5/CSS3, Tailwind
Backend  : Node.js, Express, Python, PostgreSQL, MongoDB, Redis
DevOps   : Git, Docker, AWS, Vercel, GitHub Actions
    `,
    projects: () => `
1. <span style="color:#bc8cff">Git Invaders Space Arcade</span> - Embedded HTML5 Canvas game
2. <span style="color:#bc8cff">Cosmic UI Component Kit</span> - Glassmorphic React UI library
    `,
    game: () => {
      const arcade = document.getElementById('space-arcade');
      if (arcade) arcade.scrollIntoView({ behavior: 'smooth' });
      return 'Navigating to Space Shooter Arcade... 🚀';
    },
    trophies: () => `
🏆 Level 99 Space Cadet
👾 Bug Destroyer (1337+ Bugs Slain)
⚡ Async Master
🛡️ Clean Code Sentinel
    `,
    contact: () => `
GitHub   : github.com/rahul-gits
LinkedIn : linkedin.com/in/rahul-gits
X/Twitter: @rahul-gits
Email    : rahul@example.com
    `,
    'sudo hire': () => `
<span style="color:#3fb950; font-weight:bold">ACCESS GRANTED! 🎉</span>
rahul-gits is ready to build high-impact applications with your team!
Send an email to: rahul@example.com
    `,
    clear: () => {
      terminalLogs.innerHTML = '';
      return '';
    }
  };

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = terminalInput.value.trim().toLowerCase();
      terminalInput.value = '';

      if (!cmd) return;

      const logLine = document.createElement('div');
      logLine.className = 'terminal-line';
      logLine.innerHTML = `<span class="prompt">rahul-gits@github:~$</span> ${cmd}`;
      terminalLogs.appendChild(logLine);

      if (commands[cmd]) {
        const result = commands[cmd]();
        if (result) {
          const resLine = document.createElement('div');
          resLine.className = 'terminal-line';
          resLine.innerHTML = result;
          terminalLogs.appendChild(resLine);
        }
      } else {
        const errLine = document.createElement('div');
        errLine.className = 'terminal-line';
        errLine.innerHTML = `<span style="color:#f85149">Command not found: "${cmd}". Type <span style="color:#3fb950">help</span> for commands.</span>`;
        terminalLogs.appendChild(errLine);
      }

      terminalLogs.scrollTop = terminalLogs.scrollHeight;
    }
  });
}

function initSkillsTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const cards = document.querySelectorAll('.skill-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const category = tab.dataset.category;
      cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

function initReadmeModal() {
  const btnOpen = document.getElementById('btnCopyReadme');
  const modal = document.getElementById('readmeModal');
  const btnClose = document.getElementById('btnCloseModal');
  const btnCopy = document.getElementById('btnCopyMarkdown');
  const textarea = document.getElementById('readmeMarkdownText');

  if (!btnOpen || !modal) return;

  btnOpen.addEventListener('click', async () => {
    try {
      const res = await fetch('README.md');
      const text = await res.text();
      if (textarea) textarea.value = text;
    } catch (e) {
      if (textarea) textarea.value = 'Failed to load README.md';
    }
    modal.classList.add('active');
  });

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (btnCopy && textarea) {
    btnCopy.addEventListener('click', () => {
      textarea.select();
      navigator.clipboard.writeText(textarea.value);
      btnCopy.textContent = '✅ COPIED!';
      setTimeout(() => {
        btnCopy.textContent = '📋 COPY MARKDOWN';
      }, 2000);
    });
  }
}
