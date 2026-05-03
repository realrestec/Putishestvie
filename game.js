// ============================
//  ПУТЕШЕСТВИЕ
// ============================

const GAME_W = 960;
const GAME_H = 560;
const MAX_LEVEL = 2;
const SPRITES = 'assets/sprites/cutout/resized/';
const LB_KEY = 'puteshestvie_scores';

function getLeaderboard() {
  try { return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); }
  catch { return []; }
}

function saveToLeaderboard(name, score) {
  const board = getLeaderboard();
  board.push({ name: (name.trim() || 'Игрок'), score });
  board.sort((a, b) => b.score - a.score);
  board.splice(10);
  localStorage.setItem(LB_KEY, JSON.stringify(board));
  return board.findIndex(e => e.name === (name.trim() || 'Игрок') && e.score === score);
}

function isNewRecord(score) {
  if (score <= 0) return false;
  const board = getLeaderboard();
  return board.length < 10 || score > board[board.length - 1].score;
}

// --- Сцена загрузки ---
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('girl_idle',     SPRITES + 'girl_idle.png');
    this.load.image('girl_jump',     SPRITES + 'girl_jump.png');
    this.load.image('girl_fire',     SPRITES + 'girl_fire.png');
    this.load.image('girl_menu',     SPRITES + 'girl_menu.png');
    this.load.image('girl_win',      SPRITES + 'girl_win.png');
    this.load.image('girl_levelup',  SPRITES + 'girl_levelup.png');
    this.load.image('girl_gameover', SPRITES + 'girl_gameover.png');
  }

  create() {
    drawTurtle(this);
    drawHedgehog(this);
    drawCapybara(this);
    drawPlane(this);
    drawBalloon(this);
    drawBeachBackground(this);
    drawBeachGround(this);
    drawBeachPlatform(this);
    drawPalmTree(this);
    drawShell(this);
    drawStarfishBonus(this);
    drawCrab(this);
    drawCrabB(this);
    drawOctopus(this);
    drawBeachUmbrella(this);
    drawSupBoard(this);
    drawJumpingFish(this);
    drawPotion(this);
    drawApple(this);
    drawPlatform(this);
    drawGround(this);
    drawGrassBlades(this);
    drawFlowers(this);
    drawBackground(this);
    drawClouds(this);
    this.scene.start('Menu');
  }
}

// --- Стартовый экран ---
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    // Фон
    this.add.image(GAME_W / 2, GAME_H / 2, 'background');

    // Живые облака
    this.cloudList = spawnClouds(this);

    // Затемнение
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.35);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    // Рамка — чуть выше и шире чтобы вместить весь контент
    const frame = this.add.graphics();
    frame.fillStyle(0x1a0a2e, 0.80);
    frame.fillRoundedRect(GAME_W / 2 - 270, GAME_H / 2 - 195, 540, 390, 22);
    frame.lineStyle(4, 0xFFD700, 1);
    frame.strokeRoundedRect(GAME_W / 2 - 270, GAME_H / 2 - 195, 540, 390, 22);

    // Звёздочки вокруг названия
    ['✨', '⭐', '🌟', '✨', '⭐'].forEach((s, i) => {
      this.add.text(GAME_W / 2 - 200 + i * 100, GAME_H / 2 - 162, s, {
        fontSize: '22px'
      }).setOrigin(0.5);
    });

    // Название игры
    this.add.text(GAME_W / 2, GAME_H / 2 - 105, 'Путешествие', {
      fontSize: '60px', fill: '#FFD700',
      stroke: '#8B0000', strokeThickness: 6, fontStyle: 'bold',
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5);

    // Подзаголовок
    this.add.text(GAME_W / 2, GAME_H / 2 - 42, '— сказочное приключение —', {
      fontSize: '20px', fill: '#ffccff', fontStyle: 'italic'
    }).setOrigin(0.5);

    // Персонаж
    const girl = this.add.image(GAME_W / 2 + 178, GAME_H / 2 + 40, 'girl_menu').setScale(0.85);
    this.tweens.add({ targets: girl, y: girl.y + 22, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Разделитель
    const div = this.add.graphics();
    div.lineStyle(1, 0x9966cc, 0.6);
    div.beginPath();
    div.moveTo(GAME_W / 2 - 200, GAME_H / 2 - 10);
    div.lineTo(GAME_W / 2 + 200, GAME_H / 2 - 10);
    div.strokePath();

    // Лучший результат (если есть)
    const top1 = getLeaderboard()[0];
    if (top1) {
      const lbBtn = this.add.text(GAME_W / 2, GAME_H / 2 + 20,
        `🏆  Рекорд: ${top1.name} — ${top1.score} очков`, {
        fontSize: '17px', fill: '#FFD700', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      lbBtn.on('pointerdown', () => this.scene.start('Leaderboard'));
      lbBtn.on('pointerover', () => lbBtn.setStyle({ fill: '#ffffaa' }));
      lbBtn.on('pointerout',  () => lbBtn.setStyle({ fill: '#FFD700' }));
    }

    // Кнопка старта (мигающая)
    const startText = this.add.text(GAME_W / 2, GAME_H / 2 + 80, '▶  Нажми любую клавишу  ◀', {
      fontSize: '22px', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.add({ targets: startText, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });

    // Управление
    this.add.text(GAME_W / 2, GAME_H / 2 + 130, '⬅ ➡ — идти   ⬆ Пробел — прыжок   F — яблоко', {
      fontSize: '14px', fill: '#aaaaff'
    }).setOrigin(0.5);

    // Кнопка рейтинга
    this.add.text(GAME_W / 2, GAME_H / 2 + 168, '[ посмотреть весь рейтинг ]', {
      fontSize: '13px', fill: '#cc99ff', stroke: '#000', strokeThickness: 1
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('Leaderboard'))
      .on('pointerover', function() { this.setAlpha(0.7); })
      .on('pointerout',  function() { this.setAlpha(1); });

    // Старт по любой клавише или клику → экран выбора уровня
    const goSelect = () => this.scene.start('LevelSelect');
    this.input.keyboard.once('keydown', goSelect);
    this.input.once('pointerdown', goSelect);
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.cloudList.forEach(cloud => {
      cloud.x += cloud._cloudSpeed * dt;
      if (cloud.x > GAME_W + cloud._cloudW) {
        cloud.x = -cloud._cloudW;
        cloud.y = Phaser.Math.Between(30, 110);
      }
    });
  }
}

// --- Выбор уровня ---
class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'background');

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.45);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    this.add.text(GAME_W / 2, 55, 'Выбери уровень', {
      fontSize: '42px', fill: '#FFD700', stroke: '#000', strokeThickness: 6, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Два уровня
    const levels = [
      { num: 1, emoji: '🌲', name: 'Лес',    sub: 'Черепашки и ёжики',  color: 0x2d6e1a },
      { num: 2, emoji: '🏖', name: 'Пляж',   sub: 'Крабики и морские звёзды', color: 0x1a6e8c },
    ];

    this._sel = 0;
    this._cards = [];

    levels.forEach((lvl, i) => {
      const cx = GAME_W / 2 - 190 + i * 380;
      const cy = GAME_H / 2 + 10;

      // Рамка карточки
      const card = this.add.graphics();
      this._cards.push({ card, cx, cy, lvl });

      // Иконка уровня
      this.add.text(cx, cy - 60, lvl.emoji, { fontSize: '64px' }).setOrigin(0.5);

      // Название уровня
      this.add.text(cx, cy + 25, `Уровень ${lvl.num}`, {
        fontSize: '22px', fill: '#ffffff', stroke: '#000', strokeThickness: 3, fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(cx, cy + 55, lvl.name, {
        fontSize: '30px', fill: '#FFD700', stroke: '#000', strokeThickness: 4, fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(cx, cy + 90, lvl.sub, {
        fontSize: '15px', fill: '#ddddff', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5);

      // Кликабельность
      const hitZone = this.add.zone(cx, cy, 320, 260).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => { this._sel = i; this._startSelected(); });
      hitZone.on('pointerover', () => { this._sel = i; this._drawCards(); });
    });

    this._drawCards();

    // Подсказка управления
    const hint = this.add.text(GAME_W / 2, GAME_H - 42, '⬅ ➡ — выбор     Enter / Space — начать     Esc — назад', {
      fontSize: '15px', fill: '#aaaaff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });

    this.input.keyboard.on('keydown', e => {
      if (e.key === 'ArrowLeft')  { this._sel = 0; this._drawCards(); }
      if (e.key === 'ArrowRight') { this._sel = 1; this._drawCards(); }
      if (e.key === 'Enter' || e.key === ' ') this._startSelected();
      if (e.key === 'Escape') this.scene.start('Menu');
    });
  }

  _drawCards() {
    this._cards.forEach(({ card, cx, cy, lvl }, i) => {
      card.clear();
      const selected = i === this._sel;
      card.fillStyle(selected ? lvl.color : 0x111133, selected ? 0.85 : 0.6);
      card.fillRoundedRect(cx - 158, cy - 130, 316, 260, 18);
      card.lineStyle(selected ? 5 : 2, selected ? 0xFFD700 : 0x555588, 1);
      card.strokeRoundedRect(cx - 158, cy - 130, 316, 260, 18);
    });
  }

  _startSelected() {
    this.scene.start('Game', { level: this._sel + 1, score: 0, lives: 3, apples: 5 });
  }
}

// Данные уровней
function generateLevelData(levelNum) {
  const r    = Math.random.bind(Math);
  const rInt = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const jit  = (v, d)   => v + Math.round((r() - 0.5) * d);

  const diff = {
    1: { extra: 0, tc: 3, hc: 2, ts: [50,  75], hs: [30, 50], ms: [55,  85] },
    2: { extra: 3, tc: 4, hc: 3, ts: [75, 100], hs: [45, 65], ms: [85, 120] },
  }[levelNum] || { extra: 4, tc: 5, hc: 4, ts: [90, 120], hs: [55, 80], ms: [110, 150] };

  // 4 reachable rows (each ~80-90 px apart — well within max jump ~225 px)
  const rowY = [390, 305, 220, 150];
  const colX = [100, 200, 320, 450, 580, 700, 820];

  // 2 platforms per row, at different columns
  const platforms = [];
  for (const y of rowY) {
    const cols = [...colX].sort(() => r() - 0.5);
    let added = 0;
    for (const cx of cols) {
      if (added >= 2) break;
      const x = Math.max(70, Math.min(GAME_W - 70, jit(cx, 25)));
      const clash = platforms.some(p => p.y === y && Math.abs(p.x - x) < 90);
      if (!clash) { platforms.push({ x, y }); added++; }
    }
  }
  // Extra platforms for higher levels
  for (let i = 0; i < diff.extra; i++) {
    const y = rowY[Math.floor(r() * rowY.length)];
    const x = rInt(80, GAME_W - 80);
    const clash = platforms.some(p => Math.abs(p.x - x) < 90 && Math.abs(p.y - y) < 30);
    if (!clash) platforms.push({ x, y });
  }

  // Moving platform — full width, random height
  const mpY    = rInt(110, GAME_H - 140);
  const mpMinX = 60;
  const mpMaxX = GAME_W - 60;

  // Enemy slots: ground + top of platforms
  const groundSlots = [130, 270, 410, 540, 670, 800]
    .map(x => ({ x: jit(x, 50), y: GAME_H - 80 }));
  const platSlots = platforms.map(p => ({ x: jit(p.x, 20), y: p.y - 30 }));
  const pool = [...groundSlots, ...platSlots].sort(() => r() - 0.5);

  const usedKeys = new Set();
  const turtles = [], hedgehogs = [];
  for (const pos of pool) {
    if (turtles.length + hedgehogs.length >= diff.tc + diff.hc) break;
    const key = `${Math.round(pos.x / 70)},${Math.round(pos.y / 70)}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    if (turtles.length < diff.tc) turtles.push(pos);
    else hedgehogs.push(pos);
  }

  return {
    platforms,
    turtles,
    hedgehogs,
    movingPlatform: {
      x: mpMinX,
      y: mpY,
      minX: mpMinX,
      maxX: mpMaxX,
      speed: rInt(diff.ms[0], diff.ms[1])
    },
    turtleSpeed:   rInt(diff.ts[0], diff.ts[1]),
    hedgehogSpeed: rInt(diff.hs[0], diff.hs[1]),
  };
}

// --- Экран между уровнями ---
class LevelCompleteScene extends Phaser.Scene {
  constructor() { super('LevelComplete'); }

  init(data) {
    this.prevLevel = data.level;
    this.score = data.score;
    this.lives = data.lives;
    this.apples = data.apples;
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'background');

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000022, 0.6);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    // Звёзды
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(20, GAME_W - 20);
      const y = Phaser.Math.Between(20, GAME_H - 20);
      this.add.text(x, y, '⭐', { fontSize: Phaser.Math.Between(10, 22) + 'px' }).setAlpha(Phaser.Math.FloatBetween(0.3, 1));
    }

    // Рамка
    const frame = this.add.graphics();
    frame.fillStyle(0x1a0a2e, 0.85);
    frame.fillRoundedRect(GAME_W / 2 - 280, GAME_H / 2 - 170, 560, 340, 24);
    frame.lineStyle(4, 0xFFD700);
    frame.strokeRoundedRect(GAME_W / 2 - 280, GAME_H / 2 - 170, 560, 340, 24);

    // Заголовок
    this.add.text(GAME_W / 2, GAME_H / 2 - 130, `🌟  Уровень ${this.prevLevel} пройден!  🌟`, {
      fontSize: '34px', fill: '#FFD700', stroke: '#000', strokeThickness: 5, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Очки
    this.add.text(GAME_W / 2, GAME_H / 2 - 60, `Очки: ${this.score}`, {
      fontSize: '26px', fill: '#ffffff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Жизни
    const hearts = ['', '❤️', '❤️❤️', '❤️❤️❤️'];
    this.add.text(GAME_W / 2, GAME_H / 2 - 15, `Жизни: ${hearts[Math.max(0, this.lives)]}`, {
      fontSize: '24px', fill: '#ff88aa'
    }).setOrigin(0.5);

    // Яблоки: +3 бонус
    const newApples = Math.min(this.apples + 3, 99);
    this.add.text(GAME_W / 2, GAME_H / 2 + 30, `🍎 Яблоки: ${this.apples} + 3 бонус = ${newApples}`, {
      fontSize: '20px', fill: '#ffdd00', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Следующий уровень
    this.add.text(GAME_W / 2, GAME_H / 2 + 85, `Следующий: Уровень ${this.prevLevel + 1}`, {
      fontSize: '22px', fill: '#aaffaa', stroke: '#000', strokeThickness: 3, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Кнопка (мигает)
    const btn = this.add.text(GAME_W / 2, GAME_H / 2 + 135, '▶  Нажми любую клавишу  ◀', {
      fontSize: '20px', fill: '#fff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.add({ targets: btn, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    // Персонаж прыгает от радости
    const girl = this.add.image(GAME_W / 2 + 210, GAME_H / 2 + 30, 'girl_levelup').setScale(0.85);
    this.tweens.add({ targets: girl, y: girl.y - 20, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const goNext = () => this.scene.start('Game', {
      level: this.prevLevel + 1,
      score: this.score,
      lives: this.lives,
      apples: newApples
    });
    this.input.keyboard.once('keydown', goNext);
    this.input.once('pointerdown', goNext);
  }
}

// --- Экран победы (все уровни пройдены) ---
class VictoryScene extends Phaser.Scene {
  constructor() { super('Victory'); }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'background');

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000022, 0.5);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    // Много звёзд
    for (let i = 0; i < 50; i++) {
      const star = this.add.text(
        Phaser.Math.Between(10, GAME_W - 10),
        Phaser.Math.Between(10, GAME_H - 10),
        Phaser.Math.RND.pick(['⭐','🌟','✨']),
        { fontSize: Phaser.Math.Between(12, 28) + 'px' }
      ).setAlpha(0);
      this.tweens.add({ targets: star, alpha: 1, delay: Phaser.Math.Between(0, 2000), duration: 500, yoyo: true, repeat: -1 });
    }

    const frame = this.add.graphics();
    frame.fillStyle(0x1a0a2e, 0.88);
    frame.fillRoundedRect(GAME_W / 2 - 300, GAME_H / 2 - 180, 600, 360, 24);
    frame.lineStyle(5, 0xFFD700);
    frame.strokeRoundedRect(GAME_W / 2 - 300, GAME_H / 2 - 180, 600, 360, 24);

    this.add.text(GAME_W / 2, GAME_H / 2 - 140, '🎉 Ты прошла игру! 🎉', {
      fontSize: '38px', fill: '#FFD700', stroke: '#8B0000', strokeThickness: 6, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 - 75, 'Путешествие завершено!', {
      fontSize: '26px', fill: '#ffccff', fontStyle: 'italic'
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 - 20, `Итоговые очки: ${this.finalScore}`, {
      fontSize: '30px', fill: '#ffffff', stroke: '#000', strokeThickness: 3, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Персонаж
    const girl = this.add.image(GAME_W / 2 + 220, GAME_H / 2 + 20, 'girl_win').setScale(1.0);
    this.tweens.add({ targets: girl, y: girl.y - 15, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const btn = this.add.text(GAME_W / 2, GAME_H / 2 + 135, '▶  Нажми любую клавишу  ◀', {
      fontSize: '22px', fill: '#fff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.add({ targets: btn, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    const next = () => {
      if (isNewRecord(this.finalScore)) {
        this.scene.start('NameInput', { score: this.finalScore });
      } else {
        this.scene.start('Leaderboard', { score: this.finalScore });
      }
    };
    this.input.keyboard.once('keydown', next);
    this.input.once('pointerdown', next);
  }
}

// --- Ввод имени при новом рекорде ---
class NameInputScene extends Phaser.Scene {
  constructor() { super('NameInput'); }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'background');
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000022, 0.72);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    const frame = this.add.graphics();
    frame.fillStyle(0x1a0a2e, 0.94);
    frame.fillRoundedRect(GAME_W / 2 - 290, GAME_H / 2 - 170, 580, 340, 22);
    frame.lineStyle(4, 0xFFD700, 1);
    frame.strokeRoundedRect(GAME_W / 2 - 290, GAME_H / 2 - 170, 580, 340, 22);

    this.add.text(GAME_W / 2, GAME_H / 2 - 130, '🏆 Новый рекорд!', {
      fontSize: '38px', fill: '#FFD700', stroke: '#000', strokeThickness: 5, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 - 70, `Твои очки: ${this.finalScore}`, {
      fontSize: '28px', fill: '#ffffff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 - 20, 'Введи своё имя:', {
      fontSize: '20px', fill: '#ffccff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    this._name = '';
    this._cursor = true;
    this._nameText = this.add.text(GAME_W / 2, GAME_H / 2 + 30, '|', {
      fontSize: '30px', fill: '#ffff88', stroke: '#000', strokeThickness: 3, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { this._cursor = !this._cursor; this._refresh(); }
    });

    this.add.text(GAME_W / 2, GAME_H / 2 + 105, 'Enter — сохранить', {
      fontSize: '18px', fill: '#aaaaff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown', e => {
      if (e.key === 'Enter') {
        this._submit();
      } else if (e.key === 'Backspace') {
        this._name = this._name.slice(0, -1);
        this._refresh();
      } else if (e.key.length === 1 && this._name.length < 14) {
        this._name += e.key;
        this._refresh();
      }
    });
  }

  _refresh() {
    this._nameText.setText(this._name + (this._cursor ? '|' : ' '));
  }

  _submit() {
    const idx = saveToLeaderboard(this._name, this.finalScore);
    this.scene.start('Leaderboard', { highlightIdx: idx, score: this.finalScore });
  }
}

// --- Таблица рекордов ---
class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }

  init(data) {
    this.highlightIdx = data.highlightIdx !== undefined ? data.highlightIdx : -1;
    this.currentScore = data.score || 0;
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'background');
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000022, 0.68);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    const frame = this.add.graphics();
    frame.fillStyle(0x1a0a2e, 0.93);
    frame.fillRoundedRect(GAME_W / 2 - 300, 24, 600, GAME_H - 48, 22);
    frame.lineStyle(4, 0xFFD700, 1);
    frame.strokeRoundedRect(GAME_W / 2 - 300, 24, 600, GAME_H - 48, 22);

    this.add.text(GAME_W / 2, 60, '🏆  Рейтинг', {
      fontSize: '38px', fill: '#FFD700', stroke: '#000', strokeThickness: 5, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Шапка таблицы
    this.add.text(GAME_W / 2 - 230, 108, '#', { fontSize: '16px', fill: '#aaaaaa' }).setOrigin(0.5);
    this.add.text(GAME_W / 2 - 90,  108, 'Имя',   { fontSize: '16px', fill: '#aaaaaa' }).setOrigin(0, 0.5);
    this.add.text(GAME_W / 2 + 220, 108, 'Очки',  { fontSize: '16px', fill: '#aaaaaa' }).setOrigin(1, 0.5);
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x555577, 1);
    divider.beginPath(); divider.moveTo(GAME_W / 2 - 260, 118); divider.lineTo(GAME_W / 2 + 260, 118); divider.strokePath();

    const board = getLeaderboard();
    const medals = ['🥇', '🥈', '🥉'];

    if (board.length === 0) {
      this.add.text(GAME_W / 2, 290, 'Пока нет рекордов...', {
        fontSize: '22px', fill: '#888899'
      }).setOrigin(0.5);
    }

    board.forEach((entry, i) => {
      const y = 138 + i * 38;
      const isHl = i === this.highlightIdx;
      const color = isHl ? '#ffff44' : (i === 0 ? '#FFD700' : i === 1 ? '#dddddd' : i === 2 ? '#cc9944' : '#cccccc');

      // Подсветка строки нового рекорда
      if (isHl) {
        const hlRow = this.add.graphics();
        hlRow.fillStyle(0xffaa00, 0.18);
        hlRow.fillRoundedRect(GAME_W / 2 - 258, y - 14, 516, 30, 6);
      }

      const medal = medals[i] || `${i + 1}`;
      this.add.text(GAME_W / 2 - 230, y, medal, { fontSize: '20px', fill: color }).setOrigin(0.5);

      const nt = this.add.text(GAME_W / 2 - 190, y, entry.name, {
        fontSize: '22px', fill: color, fontStyle: isHl ? 'bold' : 'normal'
      }).setOrigin(0, 0.5);

      this.add.text(GAME_W / 2 + 220, y, String(entry.score), {
        fontSize: '22px', fill: color, fontStyle: 'bold'
      }).setOrigin(1, 0.5);

      if (isHl) {
        this.tweens.add({ targets: nt, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
      }
    });

    const btn = this.add.text(GAME_W / 2, GAME_H - 52, '▶  Нажми любую клавишу  ◀', {
      fontSize: '20px', fill: '#fff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.add({ targets: btn, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown', () => this.scene.start('Menu'));
    this.input.once('pointerdown',      () => this.scene.start('Menu'));
  }
}

// --- Главная игровая сцена ---
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.currentLevel = data.level || 1;
    this.score = data.score || 0;
    this.lives = data.lives !== undefined ? data.lives : 3;
    this.apples = data.apples !== undefined ? data.apples : 5;
    this.girlSize = 'big';
    this.isInvincible = false;
    this.levelOver = false;
    this.theme = this.currentLevel === 2 ? 'beach' : 'forest';
    // Следующий порог для получения жизни
    const prevMilestone = Math.floor(this.score / 50) * 50;
    this.nextLifeMilestone = prevMilestone + 50;
  }

  create() {
    const levelData = generateLevelData(this.currentLevel);

    const isBeach = this.theme === 'beach';
    const bgKey   = isBeach ? 'beach_bg'       : 'background';
    const gndKey  = isBeach ? 'beach_ground'   : 'ground';
    const platKey = isBeach ? 'beach_platform' : 'platform';

    // Анимация ходьбы краба (два кадра)
    if (isBeach && !this.anims.exists('crab_walk')) {
      this.anims.create({
        key: 'crab_walk',
        frames: [{ key: 'crab' }, { key: 'crab_b' }],
        frameRate: 7,
        repeat: -1
      });
    }

    // Фон (depth -2 — под оверлеем заката/ночи)
    this.bgImage = this.add.image(GAME_W / 2, GAME_H / 2, bgKey).setDepth(-2);

    // === Ночная тема / закат (активируется в середине уровня) ===
    // Пляж: оверлей за игровыми объектами (depth -1), тёплый закат
    // Лес:  оверлей поверх всего (depth 5), полная тьма
    const overlayDepth = isBeach ? -1 : 5;
    const overlayColor = isBeach ? 0xCC4400 : 0x05021a;
    this.nightOverlay = this.add.graphics().setScrollFactor(0).setDepth(overlayDepth).setAlpha(0);
    this.nightOverlay.fillStyle(overlayColor, 1);
    this.nightOverlay.fillRect(0, 0, GAME_W, GAME_H);

    // Звёзды — рисуем заранее, показываем с ночью
    this.nightStars = this.add.graphics().setScrollFactor(0).setDepth(7).setAlpha(0);
    for (let i = 0; i < 100; i++) {
      const sx = Phaser.Math.Between(0, GAME_W);
      const sy = Phaser.Math.Between(0, Math.round(GAME_H * 0.7));
      const sr = Phaser.Math.FloatBetween(0.5, 2.2);
      const br = Phaser.Math.FloatBetween(0.5, 1.0);
      this.nightStars.fillStyle(0xffffff, br);
      this.nightStars.fillCircle(sx, sy, sr);
    }

    // Луна
    this.nightMoon = this.add.graphics().setScrollFactor(0).setDepth(7).setAlpha(0);
    const mx = GAME_W - 115, my = 68;
    this.nightMoon.fillStyle(0xFFF8C0, 0.2);
    this.nightMoon.fillCircle(mx, my, 54);
    this.nightMoon.fillStyle(0xFFF5A0, 0.45);
    this.nightMoon.fillCircle(mx, my, 42);
    this.nightMoon.fillStyle(0xFFFDE8, 1);
    this.nightMoon.fillCircle(mx, my, 32);
    this.nightMoon.fillStyle(0xE0D890, 0.55);
    this.nightMoon.fillCircle(mx - 10, my + 8,  6);
    this.nightMoon.fillCircle(mx + 11, my - 5,  4);
    this.nightMoon.fillCircle(mx - 4,  my - 13, 5);

    this._nightTriggered = false;

    // Номер уровня (вверху по центру)
    this.add.text(GAME_W / 2, 12, `Уровень ${this.currentLevel}`, {
      fontSize: '18px', fill: '#FFD700', stroke: '#000', strokeThickness: 3, fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

    // Земля
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < GAME_W; x += 64) {
      this.ground.create(x + 32, GAME_H - 16, gndKey).refreshBody();
    }

    // Платформы
    this.platforms = this.physics.add.staticGroup();
    levelData.platforms.forEach(p => {
      this.platforms.create(p.x, p.y, platKey).refreshBody();
    });

    // Движущаяся платформа — статическое тело, позиция обновляется вручную
    const mpd = levelData.movingPlatform;
    this.movingPlatform = this.physics.add.staticImage(mpd.x, mpd.y, platKey);
    this.movingPlatform._minX     = mpd.minX;
    this.movingPlatform._maxX     = mpd.maxX;
    this.movingPlatform._speed    = mpd.speed;
    this.movingPlatform._dir      = 1;
    this.movingPlatform._changing = false;

    // Девочка
    this.girl = this.physics.add.sprite(100, GAME_H - 100, 'girl_idle');
    this.girl.setBounce(0.1);
    this.girl.setCollideWorldBounds(true);
    this.girl.body.setSize(28, 90);   // физическое тело чуть меньше картинки 80×100
    // Яркий игровой вид: насыщенность + яркость
    if (this.girl.preFX) {
      this.girl.preFX.addColorMatrix().saturate(0.9).brightness(1.4);
    }

    this.turtleSpeed   = levelData.turtleSpeed;
    this.hedgehogSpeed = levelData.hedgehogSpeed;

    // На пляже — крабики; в лесу — черепашки и ёжики
    const enemyTex = isBeach ? 'crab' : 'turtle';

    this.turtles = this.physics.add.group();
    levelData.turtles.forEach(pos => {
      const t = this.turtles.create(pos.x, pos.y, enemyTex);
      t.setVelocityX(Phaser.Math.RND.pick([-this.turtleSpeed, this.turtleSpeed]));
      t.setBounceX(1);
      t.setCollideWorldBounds(true);
      if (isBeach) t.play('crab_walk');
    });

    // Ёжики — только в лесу
    this.hedgehogs = this.physics.add.group();
    if (!isBeach) {
      (levelData.hedgehogs || []).forEach(pos => {
        const h = this.hedgehogs.create(pos.x, pos.y, 'hedgehog');
        h.setVelocityX(Phaser.Math.RND.pick([-this.hedgehogSpeed, this.hedgehogSpeed]));
        h.setBounceX(1);
        h.setCollideWorldBounds(true);
      });
    }

    // Капибары — бонусные существа, падают сверху
    this.capybaras = this.physics.add.group();

    // Осьминоги (только пляж) — стоят на месте и кидают яблоки в игрока
    this.octopusGroup  = this.physics.add.group();
    this.octopusApples = this.physics.add.group();

    // Пикапы (зелья и яблоки) — динамический спавн
    this.pickupItems = this.physics.add.group();

    // Яблоки (снаряды)
    this.appleGroup = this.physics.add.group();

    // Коллизии
    this.physics.add.collider(this.girl, this.ground);
    this.physics.add.collider(this.girl, this.platforms);
    this.physics.add.collider(this.turtles, this.ground);
    this.physics.add.collider(this.turtles, this.platforms);
    this.physics.add.collider(this.hedgehogs, this.ground);
    this.physics.add.collider(this.hedgehogs, this.platforms);

    this.physics.add.collider(this.capybaras, this.ground);
    this.physics.add.collider(this.capybaras, this.platforms);

    this.physics.add.collider(this.octopusGroup, this.ground);
    this.physics.add.collider(this.octopusGroup, this.platforms);
    this.physics.add.collider(this.octopusApples, this.ground,     (a) => { if (a.active) a.destroy(); });
    this.physics.add.collider(this.octopusApples, this.platforms,  (a) => { if (a.active) a.destroy(); });

    this.physics.add.collider(this.girl,      this.movingPlatform);
    this.physics.add.collider(this.turtles,   this.movingPlatform);
    this.physics.add.collider(this.hedgehogs, this.movingPlatform);
    this.physics.add.collider(this.capybaras, this.movingPlatform);
    this.physics.add.collider(this.octopusGroup,  this.movingPlatform);
    this.physics.add.collider(this.appleGroup, this.movingPlatform, (apple) => {
      if (apple.active) apple.destroy();
    });

    // Яблоко отскакивает от земли 3 раза, потом исчезает
    this.physics.add.collider(this.appleGroup, this.ground, (apple) => {
      if (!apple.active) return;
      apple._bounces = (apple._bounces || 0) + 1;
      if (apple._bounces >= 3) apple.destroy();
    });
    this.physics.add.collider(this.appleGroup, this.platforms, (apple) => {
      if (apple.active) apple.destroy();
    });

    // Яблоко → черепашка
    this.physics.add.overlap(this.appleGroup, this.turtles, (apple, turtle) => {
      apple.destroy();
      this.killEnemy(turtle, 'turtle');
    });

    // Яблоко → ёжик
    this.physics.add.overlap(this.appleGroup, this.hedgehogs, (apple, hedgehog) => {
      apple.destroy();
      this.killEnemy(hedgehog, 'hedgehog');
    });

    // Девочка → черепашка
    this.physics.add.overlap(this.girl, this.turtles, (girl, turtle) => {
      if (this.levelOver || this.isInvincible) return;
      if (girl.body.velocity.y > 0 && girl.y < turtle.y - 10) {
        // Прыжок на черепашку
        this.killEnemy(turtle, 'turtle');
        girl.setVelocityY(-350);
        this.shrinkGirl();
      } else {
        this.hurtGirl();
      }
    });

    // Девочка → ёжик — ВСЕГДА конец игры
    this.physics.add.overlap(this.girl, this.hedgehogs, (girl, hedgehog) => {
      if (this.levelOver || this.isInvincible) return;
      this.hedgehogHit(hedgehog);
    });

    // Девочка → капибара — подбираем, +20 очков
    this.physics.add.overlap(this.girl, this.capybaras, (girl, capy) => {
      if (!capy.active) return;
      this.collectCapybara(capy);
    });

    // Яблоко игрока → осьминог
    this.physics.add.overlap(this.appleGroup, this.octopusGroup, (apple, octo) => {
      apple.destroy();
      this.killEnemy(octo, 'octopus');
    });
    // Девочка → осьминог (прыжок убивает, боком — урон)
    this.physics.add.overlap(this.girl, this.octopusGroup, (girl, octo) => {
      if (this.levelOver || this.isInvincible) return;
      if (girl.body.velocity.y > 0 && girl.y < octo.y - 10) {
        this.killEnemy(octo, 'octopus');
        girl.setVelocityY(-350);
        this.shrinkGirl();
      } else {
        this.hurtGirl();
      }
    });
    // Яблоко осьминога → девочка
    this.physics.add.overlap(this.octopusApples, this.girl, (apple, girl) => {
      if (this.levelOver || this.isInvincible) return;
      apple.destroy();
      this.hurtGirl();
    });

    // Девочка → пикап (зелье или яблоко)
    this.physics.add.overlap(this.girl, this.pickupItems, (girl, item) => {
      if (!item.active) return;
      const type = item._type;
      this.tweens.killTweensOf(item);
      item.destroy();
      if (type === 'potion') {
        this.growGirl();
      } else {
        this.apples++;
        this.applesText.setText('🍎 x ' + this.apples);
        const pop = this.add.text(item.x, item.y - 10, '+1 🍎', {
          fontSize: '20px', fill: '#ff4444', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
        this.tweens.add({
          targets: pop, y: pop.y - 40, alpha: 0, duration: 700,
          onComplete: () => pop.destroy()
        });
      }
      // Переспавн через короткую паузу
      this.time.delayedCall(800, () => this.spawnPickup(type));
    });

    // Управление
    this.cursors = this.input.keyboard.createCursorKeys();
    this.throwKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // UI
    this.scoreText = this.add.text(10, 10, 'Очки: ' + this.score, {
      fontSize: '20px', fill: '#fff', stroke: '#000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(10);

    this.livesText = this.add.text(10, 36, '❤️'.repeat(this.lives), {
      fontSize: '18px', fill: '#ff4466'
    }).setScrollFactor(0).setDepth(10);

    this.applesText = this.add.text(GAME_W - 130, 10, '🍎 x ' + this.apples, {
      fontSize: '20px', fill: '#ffdd00', stroke: '#000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(10);

    this.sizeText = this.add.text(GAME_W / 2 - 60, 36, '', {
      fontSize: '18px', fill: '#aaffaa', stroke: '#000', strokeThickness: 2
    }).setScrollFactor(0).setDepth(10);

    // Таймер уровня — 5 минут
    this.levelTimeLeft = 300;
    this.timerText = this.add.text(GAME_W / 2, 10, '⏱ 5:00', {
      fontSize: '22px', fill: '#ffffff', stroke: '#000', strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

    this.cameras.main.setBounds(0, 0, GAME_W, GAME_H);
    this.cameras.main.startFollow(this.girl, true, 0.1, 0.1);

    this.throwCooldown = 0;
    this.cloudList = spawnClouds(this);
    if (isBeach) {
      this.decorList = spawnBeachDecor(this);
      this.startWaves();
      this.startSupBoarder();
      this.scheduleFishJump(30000);
      this.time.delayedCall(Phaser.Math.Between(6000, 12000), () => this.flySeagullFlock());
      SoundFX.startBeachAmbient();
      SoundFX.startBeachMusic();
      SoundFX.startSeagulls();
      // 2 осьминога — появляются через несколько секунд
      this.time.delayedCall(3000,  () => this.spawnOctopus(Phaser.Math.Between(120, 380)));
      this.time.delayedCall(5000,  () => this.spawnOctopus(Phaser.Math.Between(560, 840)));
      // Новые осьминоги каждые 30 секунд
      this.time.addEvent({ delay: 30000, loop: true, callback: () => {
        if (!this.levelOver) this.spawnOctopus(Phaser.Math.Between(80, GAME_W - 80));
      }});
      // Таймер бросков — каждые 3 секунды
      this.time.addEvent({ delay: 3000, loop: true, callback: this.octopusThrowUpdate, callbackScope: this });
    } else {
      this.decorList = spawnGroundDecor(this);
    }
    this._windTime = 0;

    // Самолёт — ~3 раза за уровень
    this.spawnPlaneFlights();
    // Воздушный шар — каждые 2 минуты
    this.time.delayedCall(Phaser.Math.Between(15000, 30000), () => this.scheduleBalloon());

    // Первая капибара / морская звезда через 5 сек, потом каждые 8-14 сек
    this.scheduleCapybara(5000);

    // Враги респавнятся — первый через 4-7 сек, потом каждые 5-10 сек
    this.scheduleEnemy(Phaser.Math.Between(4000, 7000));

    // Запускаем пикапы со случайной задержкой чтобы не появились все разом
    this.time.delayedCall(300,  () => this.spawnPickup('potion'));
    this.time.delayedCall(800,  () => this.spawnPickup('potion'));
    this.time.delayedCall(200,  () => this.spawnPickup('apple'));
    this.time.delayedCall(1100, () => this.spawnPickup('apple'));
    this.time.delayedCall(1500, () => this.spawnPickup('apple'));
  }

  spawnPickup(type) {
    if (this.levelOver) return;

    // Все платформы (статичные + движущаяся)
    const allPlats = [
      ...this.platforms.getChildren(),
      this.movingPlatform
    ];

    // Исключаем занятые
    const occupiedX = this.pickupItems.getChildren().map(i => Math.round(i._platX));
    const free = allPlats.filter(p => !occupiedX.includes(Math.round(p.x)));
    const pool = free.length > 0 ? free : allPlats;
    const plat = Phaser.Utils.Array.GetRandom(pool);

    const texture = type === 'potion' ? 'potion' : 'apple';
    const baseY = plat.y - 22;
    const item = this.pickupItems.create(plat.x, baseY, texture);
    item.body.setAllowGravity(false);
    item.setImmovable(true);
    item._type = type;
    item._platX = plat.x;

    // Покачивание
    this.tweens.add({
      targets: item,
      y: baseY - 7,
      duration: 550 + Phaser.Math.Between(0, 250),
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Через 5 сек — мигание и исчезновение → переспавн
    this.time.delayedCall(5000, () => {
      if (!item.active) return;
      this.tweens.add({
        targets: item, alpha: 0,
        duration: 100, yoyo: true, repeat: 5,
        onComplete: () => {
          if (item.active) {
            this.tweens.killTweensOf(item);
            item.destroy();
          }
          this.time.delayedCall(400, () => this.spawnPickup(type));
        }
      });
    });
  }

  startNight() {
    // Надпись
    const nightLabel = this.theme === 'beach' ? '🌅 Закат на пляже...' : '🌙 Наступает ночь...';
    const msg = this.add.text(GAME_W / 2, GAME_H / 2 - 70, nightLabel, {
      fontSize: '36px', fill: '#c8c8ff',
      stroke: '#00001a', strokeThickness: 6, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(12).setAlpha(0);
    this.tweens.add({
      targets: msg, alpha: 1, duration: 1000,
      yoyo: true, hold: 2000,
      onComplete: () => msg.destroy()
    });

    // Пляж: лёгкое потепление только фона; лес: полная тьма поверх всего
    const overlayTargetAlpha = this.theme === 'beach' ? 0.30 : 0.58;
    const starsTargetAlpha   = this.theme === 'beach' ? 0.45 : 1.0;
    this.tweens.add({
      targets: this.nightOverlay,
      alpha: overlayTargetAlpha,
      duration: 10000,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: [this.nightStars, this.nightMoon],
      alpha: starsTargetAlpha,
      duration: 10000,
      ease: 'Sine.easeInOut'
    });
  }

  scheduleBalloon() {
    if (this.levelOver) return;
    this.flyBalloon();
    this.time.delayedCall(120000, () => this.scheduleBalloon());
  }

  flyBalloon() {
    const fromLeft = Phaser.Math.RND.frac() > 0.5;
    const startX   = fromLeft ? -70 : GAME_W + 70;
    const endX     = fromLeft ? GAME_W + 70 : -70;
    const y        = Phaser.Math.Between(40, 130);
    const duration = Phaser.Math.Between(22000, 34000);

    const balloon = this.add.image(startX, y, 'balloon')
      .setScrollFactor(0).setDepth(-1).setFlipX(!fromLeft);

    // Лёгкое покачивание
    this.tweens.add({
      targets: balloon, y: y + 12,
      duration: Phaser.Math.Between(1800, 2600),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: balloon, x: endX, duration, ease: 'Linear',
      onComplete: () => balloon.destroy()
    });
  }

  spawnPlaneFlights() {
    // 3 пролёта — случайно в первой, второй и третьей трети уровня
    const t1 = Phaser.Math.Between(20000,  80000);
    const t2 = Phaser.Math.Between(110000, 180000);
    const t3 = Phaser.Math.Between(210000, 275000);
    [t1, t2, t3].forEach(delay => {
      this.time.delayedCall(delay, () => {
        if (!this.levelOver) {
          if (this.theme === 'beach') this.flyBannerPlane();
          else this.flyPlane();
        }
      });
    });
  }

  flyPlane() {
    const fromLeft = Phaser.Math.RND.frac() > 0.5;
    const y        = Phaser.Math.Between(30, 100);
    const startX   = fromLeft ? -110 : GAME_W + 110;
    const endX     = fromLeft ? GAME_W + 110 : -110;
    const duration = Phaser.Math.Between(6000, 10000);

    const plane = this.add.image(startX, y, 'plane')
      .setScrollFactor(0).setDepth(0).setFlipX(!fromLeft);

    // Инверсионный след — маленькие белые точки
    const trail = this.time.addEvent({
      delay: 180, loop: true,
      callback: () => {
        if (!plane.active) { trail.remove(); return; }
        const dot = this.add.graphics().setScrollFactor(0).setDepth(-1);
        dot.fillStyle(0xffffff, 0.55);
        dot.fillEllipse(plane.x + (fromLeft ? -30 : 30), plane.y, 14, 5);
        this.tweens.add({ targets: dot, alpha: 0, duration: 2200,
          onComplete: () => dot.destroy() });
      }
    });

    this.tweens.add({
      targets: plane, x: endX, duration, ease: 'Linear',
      onComplete: () => { trail.remove(); plane.destroy(); }
    });
  }

  flyBannerPlane() {
    const fromLeft = Phaser.Math.RND.frac() > 0.5;
    const y        = Phaser.Math.Between(35, 90);
    const startX   = fromLeft ? -130 : GAME_W + 130;
    const endX     = fromLeft ? GAME_W + 130 : -130;
    const duration = Phaser.Math.Between(9000, 14000);

    const plane = this.add.image(startX, y, 'plane')
      .setScrollFactor(0).setDepth(0).setFlipX(!fromLeft).setScale(0.85);

    // Баннер "Привет Милана!" на верёвке за самолётом
    const bannerOffX = fromLeft ? -90 : 90;
    const banner = this.add.text(startX + bannerOffX, y + 12, 'Привет Милана! 💕', {
      fontSize: '13px', fill: '#ffffff',
      stroke: '#cc0066', strokeThickness: 3, fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(0).setOrigin(fromLeft ? 1 : 0, 0.5);

    // Верёвка
    const rope = this.add.graphics().setScrollFactor(0).setDepth(0);

    const trail = this.time.addEvent({
      delay: 200, loop: true,
      callback: () => {
        if (!plane.active) { trail.remove(); return; }
        const dot = this.add.graphics().setScrollFactor(0).setDepth(-1);
        dot.fillStyle(0xffffff, 0.4);
        dot.fillEllipse(plane.x + (fromLeft ? -28 : 28), plane.y, 10, 4);
        this.tweens.add({ targets: dot, alpha: 0, duration: 2000, onComplete: () => dot.destroy() });
      }
    });

    // Синхронно двигаем самолёт + баннер + верёвку
    this.tweens.add({
      targets: plane, x: endX, duration, ease: 'Linear',
      onUpdate: () => {
        banner.x = plane.x + bannerOffX;
        banner.y = plane.y + 12 + Math.sin(Date.now() * 0.003) * 3;
        rope.clear();
        rope.lineStyle(1, 0xffffff, 0.7);
        rope.beginPath();
        rope.moveTo(plane.x + (fromLeft ? -20 : 20), plane.y + 8);
        rope.lineTo(banner.x + (fromLeft ? 0 : 0), banner.y);
        rope.strokePath();
      },
      onComplete: () => {
        trail.remove(); plane.destroy(); banner.destroy(); rope.destroy();
      }
    });
  }

  startWaves() {
    // Три ряда волн с разными скоростями — плывут справа налево
    const rows = [
      { y: 355, speed: 28, alpha: 0.55, w: 90, h: 9,  color: 0xAADFF8 },
      { y: 372, speed: 20, alpha: 0.45, w: 72, h: 7,  color: 0xCCEEFF },
      { y: 388, speed: 14, alpha: 0.35, w: 56, h: 6,  color: 0xDDF5FF },
    ];
    this._waveGfx = [];
    rows.forEach(row => {
      // Создаём 14 эллипсов на ряд с равным шагом
      const step = 90;
      for (let i = 0; i < Math.ceil(GAME_W / step) + 2; i++) {
        const wg = this.add.graphics().setDepth(-1).setScrollFactor(0);
        wg.fillStyle(row.color);
        wg.fillEllipse(0, 0, row.w, row.h);
        wg.setAlpha(row.alpha);
        // Начальная x-позиция — равномерно по экрану
        wg._startX = i * step;
        wg._speed  = row.speed + Phaser.Math.FloatBetween(-4, 4);
        wg._row    = row;
        wg.x = wg._startX;
        wg.y = row.y;
        this._waveGfx.push(wg);
      }
    });
  }

  flySeagullFlock() {
    if (this.levelOver) return;
    const fromLeft = Phaser.Math.RND.frac() > 0.5;
    const count    = Phaser.Math.Between(2, 4);
    for (let k = 0; k < count; k++) {
      const y        = Phaser.Math.Between(55, 130);
      const startX   = fromLeft ? -60 - k * 30 : GAME_W + 60 + k * 30;
      const endX     = fromLeft ? GAME_W + 80   : -80;
      const duration = Phaser.Math.Between(10000, 16000);
      const sg = this.add.graphics().setScrollFactor(0).setDepth(1);
      // Силуэт чайки: две дуги-крыла в форме буквы M
      const drawGull = (gfx, flip) => {
        gfx.clear();
        gfx.lineStyle(2, 0x555566, 0.85);
        const d = flip ? -1 : 1;
        gfx.beginPath();
        gfx.moveTo(-12 * d, 0);
        gfx.lineTo(-6  * d, -5);
        gfx.lineTo(0,        2);
        gfx.lineTo(6   * d, -5);
        gfx.lineTo(12  * d, 0);
        gfx.strokePath();
      };
      drawGull(sg, fromLeft);
      sg.x = startX;
      sg.y = y + k * Phaser.Math.Between(8, 18);

      // Лёгкое вертикальное покачивание
      this.tweens.add({
        targets: sg, y: sg.y + 8,
        duration: Phaser.Math.Between(1200, 1800),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: sg, x: endX, duration, ease: 'Linear',
        onComplete: () => sg.destroy()
      });
    }
    // Следующая стая через 28–40 сек
    this.time.delayedCall(Phaser.Math.Between(28000, 40000), () => {
      if (!this.levelOver) this.flySeagullFlock();
    });
  }

  startSupBoarder() {
    const seaY = GAME_H - 56; // чуть выше земли, у воды
    const sup = this.add.image(80, seaY, 'sup_board')
      .setDepth(-3).setAlpha(0.88).setScale(1.1);

    const goRight = () => {
      this.tweens.add({
        targets: sup, x: GAME_W - 90, duration: Phaser.Math.Between(14000, 20000),
        ease: 'Sine.easeInOut',
        onComplete: () => { sup.setFlipX(true); goLeft(); }
      });
    };
    const goLeft = () => {
      this.tweens.add({
        targets: sup, x: 80, duration: Phaser.Math.Between(14000, 20000),
        ease: 'Sine.easeInOut',
        onComplete: () => { sup.setFlipX(false); goRight(); }
      });
    };

    // Лёгкое покачивание на волнах
    this.tweens.add({ targets: sup, y: seaY - 4, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    goRight();
  }

  scheduleFishJump(delay) {
    this.time.delayedCall(delay, () => {
      if (this.levelOver) return;
      this.doFishJump();
      this.scheduleFishJump(30000);
    });
  }

  doFishJump() {
    // Рыбки прыгают из моря (≈y 430 — граница воды и песка на пляже)
    const seaY = 432;
    const count = Phaser.Math.Between(2, 5);
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 200, () => {
        const x = Phaser.Math.Between(60, GAME_W - 60);
        const sc = Phaser.Math.FloatBetween(0.9, 1.4);
        const fish = this.add.image(x, seaY, 'jumping_fish')
          .setDepth(-1).setAlpha(0.92).setScale(sc)
          .setAngle(Phaser.Math.Between(-15, 15));
        this.tweens.add({
          targets: fish,
          y: seaY - Phaser.Math.Between(80, 130),
          duration: 320, ease: 'Sine.easeOut', yoyo: true,
          onComplete: () => fish.destroy()
        });
      });
    }
  }

  scheduleEnemy(delay) {
    this.time.delayedCall(delay, () => {
      if (!this.levelOver) this.spawnEnemy();
      this.scheduleEnemy(Phaser.Math.Between(5000, 10000));
    });
  }

  spawnEnemy(type) {
    if (this.levelOver) return;
    // Не спавним если на экране уже много врагов
    const total = this.turtles.countActive() + this.hedgehogs.countActive();
    if (total >= 8) return;

    // На пляже только крабики (в группе черепах, можно запрыгнуть); ёжики только в лесу
    const kind = this.theme === 'beach' ? 'crab' :
      (type || (Phaser.Math.RND.frac() < 0.55 ? 'turtle' : 'hedgehog'));
    const x = Phaser.Math.Between(60, GAME_W - 60);

    if (kind === 'turtle' || kind === 'crab') {
      const tex = kind === 'crab' ? 'crab' : 'turtle';
      const t = this.turtles.create(x, -20, tex);
      const spd = this.turtleSpeed;
      t.setVelocityX(Phaser.Math.RND.pick([-spd, spd]));
      t.setBounceX(1);
      t.setCollideWorldBounds(true);
      if (kind === 'crab') t.play('crab_walk');
    } else {
      const h = this.hedgehogs.create(x, -20, 'hedgehog');
      const spd = this.hedgehogSpeed;
      h.setVelocityX(Phaser.Math.RND.pick([-spd, spd]));
      h.setBounceX(1);
      h.setCollideWorldBounds(true);
    }
  }

  scheduleCapybara(delay) {
    this.time.delayedCall(delay, () => {
      if (!this.levelOver) this.spawnCapybara();
      this.scheduleCapybara(Phaser.Math.Between(8000, 14000));
    });
  }

  spawnCapybara() {
    if (this.levelOver) return;
    const x = Phaser.Math.Between(60, GAME_W - 60);
    const bonusTex = this.theme === 'beach' ? 'starfish_bonus' : 'capybara';
    const capy = this.capybaras.create(x, -20, bonusTex);
    capy.setCollideWorldBounds(true);
    capy.setBounceX(1);
    capy.setVelocityY(120);
    const spd = Phaser.Math.Between(40, 75);
    capy.setVelocityX(Phaser.Math.RND.pick([-spd, spd]));
    capy._walkSpeed = spd;

    // Периодически меняем направление
    capy._walkTimer = this.time.addEvent({
      delay: Phaser.Math.Between(2000, 4000),
      loop: true,
      callback: () => {
        if (!capy.active) return;
        const newDir = Phaser.Math.RND.pick([-1, 1]);
        capy.setVelocityX(newDir * capy._walkSpeed);
        capy._walkTimer.delay = Phaser.Math.Between(2000, 4000);
      }
    });

    // Мигание-уведомление при появлении
    this.tweens.add({
      targets: capy, alpha: 0.3,
      duration: 120, yoyo: true, repeat: 4
    });
  }

  spawnOctopus(x) {
    if (this.levelOver) return;
    const octo = this.octopusGroup.create(x, -40, 'octopus');
    octo.setCollideWorldBounds(true);
    // Небольшое покачивание (tween обновит y после приземления)
    this.time.delayedCall(1500, () => {
      if (!octo.active) return;
      this.tweens.add({
        targets: octo, y: octo.y - 8,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });
  }

  octopusThrowUpdate() {
    if (this.levelOver || !this.girl || !this.girl.active) return;
    this.octopusGroup.children.iterate(octo => {
      if (!octo || !octo.active) return;
      const dx = this.girl.x - octo.x;
      const dy = this.girl.y - octo.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 520) return;
      // Бросок яблока по параболе в сторону игрока
      const speed = 210;
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed - 160;
      const apple = this.octopusApples.create(octo.x, octo.y - 22, 'apple');
      apple.setTint(0xCC66FF);
      apple.setVelocity(vx, vy);
      apple.setGravityY(320);
      apple.setCollideWorldBounds(false);
      this.time.delayedCall(3500, () => { if (apple.active) apple.destroy(); });
      // Осьминог сжимается при броске
      this.tweens.add({
        targets: octo, scaleX: 1.35, scaleY: 0.65, duration: 100,
        yoyo: true, repeat: 1
      });
      SoundFX.throwFX();
    });
  }

  collectCapybara(capy) {
    if (capy._walkTimer) capy._walkTimer.remove();
    capy.destroy();

    SoundFX.bonus();
    this.score += 20;
    this.scoreText.setText('Очки: ' + this.score);

    const bonusEmoji = this.theme === 'beach' ? '⭐ +20' : '🦫 +20';
    const pop = this.add.text(capy.x, capy.y - 20, bonusEmoji, {
      fontSize: '22px', fill: '#ffdd00', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.add({
      targets: pop, y: pop.y - 55, alpha: 0, duration: 900,
      ease: 'Cubic.easeOut', onComplete: () => pop.destroy()
    });
    this.cameras.main.flash(200, 180, 240, 80);
  }

  updateLivesText() {
    this.livesText.setText('❤️'.repeat(Math.max(0, this.lives)));
  }

  // Убить любого врага с эффектом
  killEnemy(enemy, type) {
    if (this.levelOver) return;
    const pts = type === 'octopus' ? 20 : 10;
    this.score += pts;
    this.scoreText.setText('Очки: ' + this.score);

    SoundFX.hitFX();
    const boom = this.add.text(enemy.x, enemy.y - 20, `✨+${pts}`, {
      fontSize: '18px', fill: '#ffff00', stroke: '#000', strokeThickness: 2
    });
    this.tweens.add({
      targets: boom, y: boom.y - 40, alpha: 0, duration: 700,
      onComplete: () => boom.destroy()
    });
    enemy.destroy();

    // Бонусная жизнь каждые 50 очков
    if (this.score >= this.nextLifeMilestone) {
      this.nextLifeMilestone += 50;
      this.lives++;
      this.updateLivesText();

      // Эффект +❤️ посередине экрана
      const bonus = this.add.text(GAME_W / 2, GAME_H / 2 - 30, '+❤️  Бонусная жизнь!', {
        fontSize: '28px', fill: '#ff4466', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
      this.tweens.add({
        targets: bonus, y: bonus.y - 50, alpha: 0, duration: 1400,
        ease: 'Cubic.easeOut', onComplete: () => bonus.destroy()
      });
      this.cameras.main.flash(300, 255, 100, 150);
    }

  }

  shrinkGirl() {
    if (this.girlSize === 'small') return;
    this.girlSize = 'small';
    this.girl.body.setSize(17, 54);
    this.sizeText.setText('🔻 Ты маленькая!');
    this.tweens.add({
      targets: this.girl, scaleX: 0.6, scaleY: 0.6, duration: 300, ease: 'Back.easeOut'
    });
    this.cameras.main.shake(200, 0.005);
  }

  growGirl() {
    const wasSmall = this.girlSize === 'small';
    this.girlSize = 'big';
    this.girl.body.setSize(28, 90);
    this.sizeText.setText(wasSmall ? '🔺 Ты выросла!' : '⭐ Зелье!');
    this.time.delayedCall(1500, () => { if (this.sizeText) this.sizeText.setText(''); });
    this.tweens.add({
      targets: this.girl, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut'
    });
    // Вспышка
    const flash = this.add.graphics().setScrollFactor(0);
    flash.fillStyle(0xaaffaa, 0.4);
    flash.fillRect(0, 0, GAME_W, GAME_H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
  }

  hedgehogHit(hedgehog) {
    this.levelOver = true;
    // Вспышка красная
    const flash = this.add.graphics().setScrollFactor(0);
    flash.fillStyle(0xff0000, 0.5);
    flash.fillRect(0, 0, GAME_W, GAME_H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300 });

    this.girl.setTint(0xff4444);
    this.cameras.main.shake(400, 0.015);
    this.time.delayedCall(700, () => this.gameOver());
  }

  finishLevel() {
    SoundFX.stopAll();
    const maxLevel = MAX_LEVEL;
    if (this.currentLevel >= maxLevel) {
      this.scene.start('Victory', { score: this.score });
    } else {
      this.scene.start('LevelComplete', {
        level: this.currentLevel,
        score: this.score,
        lives: this.lives,
        apples: this.apples
      });
    }
  }

  hurtGirl() {
    this.lives--;
    this.isInvincible = true;
    this.updateLivesText();

    this.tweens.add({
      targets: this.girl, alpha: 0, duration: 100, yoyo: true, repeat: 5,
      onComplete: () => { this.girl.setAlpha(1); this.isInvincible = false; }
    });

    this.girl.setVelocityY(-200);

    if (this.lives <= 0) {
      this.time.delayedCall(500, () => this.gameOver());
    }
  }

  throwApple() {
    if (this.apples <= 0 || this.throwCooldown > 0) return;

    this.apples--;
    this.throwCooldown = 400;
    this.applesText.setText('🍎 x ' + this.apples);
    SoundFX.throwFX();

    // Поза броска на 400 мс
    this.girl.setTexture('girl_fire');
    this.time.delayedCall(400, () => {
      if (this.girl.active) this.girl.setTexture('girl_idle');
    });

    const dir = this.girl.flipX ? -1 : 1;
    const apple = this.appleGroup.create(this.girl.x + dir * 20, this.girl.y, 'apple');
    apple.setVelocityX(dir * 320);
    apple.setVelocityY(-80);
    apple.setGravityY(400);
    apple.setBounceY(0.55);   // коэффициент отскока
    apple.setCollideWorldBounds(true);
    apple._bounces = 0;

    // Страховочный таймер — если застряло (например на краю)
    this.time.delayedCall(4000, () => { if (apple.active) apple.destroy(); });
  }

  gameOver() {
    this.levelOver = true;
    SoundFX.stopAll();

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(11);
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    this.add.text(GAME_W / 2, GAME_H / 2 - 60, '💔 Игра окончена', {
      fontSize: '40px', fill: '#ff4466', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(12);

    this.add.text(GAME_W / 2, GAME_H / 2, `Очки: ${this.score}`, {
      fontSize: '28px', fill: '#fff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(12);

    const isRecord = isNewRecord(this.score);
    const hint = isRecord ? '🏆 Новый рекорд! Нажми любую клавишу' : '▶  Нажми любую клавишу  ◀';
    const hintColor = isRecord ? '#FFD700' : '#ffffff';

    const btn = this.add.text(GAME_W / 2, GAME_H / 2 + 65, hint, {
      fontSize: '20px', fill: hintColor, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(12);
    this.tweens.add({ targets: btn, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown', () => {
      if (isNewRecord(this.score)) {
        this.scene.start('NameInput', { score: this.score });
      } else {
        this.scene.start('Leaderboard', { score: this.score });
      }
    });
  }

  update(time, delta) {
    if (this.levelOver) return;
    const dt = delta / 1000;
    if (this.throwCooldown > 0) this.throwCooldown -= delta;

    // Обратный отсчёт
    this.levelTimeLeft -= dt;
    if (!this._nightTriggered && this.levelTimeLeft <= 150) {
      this._nightTriggered = true;
      this.startNight();
    }
    if (this.levelTimeLeft <= 0) {
      this.levelTimeLeft = 0;
      this.levelOver = true;
      this.time.delayedCall(800, () => this.finishLevel());
    }
    const sec = Math.ceil(this.levelTimeLeft);
    const mm = Math.floor(sec / 60);
    const ss = String(sec % 60).padStart(2, '0');
    const timeStr = `⏱ ${mm}:${ss}`;
    this.timerText.setText(timeStr);
    // Красный цвет и пульс когда осталось ≤ 30 сек
    if (sec <= 30) {
      this.timerText.setStyle({ fill: '#ff4444', stroke: '#000', strokeThickness: 4, fontStyle: 'bold', fontSize: '22px' });
      if (Math.floor(this.levelTimeLeft * 2) % 2 === 0) {
        this.timerText.setAlpha(1);
      } else {
        this.timerText.setAlpha(0.6);
      }
    } else {
      this.timerText.setStyle({ fill: '#ffffff', stroke: '#000', strokeThickness: 4, fontStyle: 'bold', fontSize: '22px' });
      this.timerText.setAlpha(1);
    }

    const onGround = this.girl.body.blocked.down;

    if (this.cursors.left.isDown) {
      this.girl.setVelocityX(-180);
      this.girl.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.girl.setVelocityX(180);
      this.girl.setFlipX(false);
    } else {
      this.girl.setVelocityX(0);
    }

    if ((this.cursors.up.isDown || this.cursors.space.isDown) && onGround) {
      this.girl.setVelocityY(-520);
      SoundFX.jump();
    }

    if (Phaser.Input.Keyboard.JustDown(this.throwKey)) {
      this.throwApple();
    }

    // Смена текстуры: прыжок / земля
    // Переключаемся на jump только при явном взлёте (скорость вверх > 80),
    // а не при каждом мерцании onGround из-за погрешности физики
    const isFiring = this.girl.texture.key === 'girl_fire';
    if (!isFiring) {
      const clearlyAirborne = !onGround && this.girl.body.velocity.y < -80;
      if (clearlyAirborne) {
        if (this.girl.texture.key !== 'girl_jump') this.girl.setTexture('girl_jump');
      } else if (onGround) {
        if (this.girl.texture.key !== 'girl_idle') this.girl.setTexture('girl_idle');
      }
    }

    const sz = this.girlSize === 'small' ? 0.6 : 1.0;
    this.girl.setScale(sz, sz);

    // Движущаяся платформа — двигаем вручную, при смене направления меняет высоту
    const mp = this.movingPlatform;
    const mpVel = mp._speed * mp._dir;
    mp.x += mpVel * dt;

    const hitRight = mp.x >= mp._maxX;
    const hitLeft  = mp.x <= mp._minX;
    if ((hitRight || hitLeft) && !mp._changing) {
      mp.x = hitRight ? mp._maxX : mp._minX;
      mp._dir *= -1;
      mp._changing = true;
      const newY = Phaser.Math.Between(110, GAME_H - 140);
      this.tweens.add({
        targets: mp,
        y: newY,
        duration: 600,
        ease: 'Sine.easeInOut',
        onUpdate: () => mp.refreshBody(),
        onComplete: () => { mp._changing = false; }
      });
      // Краткое свечение платформы
      this.tweens.add({
        targets: mp, alpha: 0.4,
        duration: 150, yoyo: true, repeat: 2,
        onComplete: () => mp.setAlpha(1)
      });
    }
    mp.refreshBody();

    // Перевозим игрока: используем физические границы тел
    const onTop = this.girl.body.blocked.down
      && this.girl.body.bottom <= mp.body.top + 10
      && this.girl.body.right  >  mp.body.left
      && this.girl.body.left   <  mp.body.right;
    if (onTop) {
      this.girl.x = Phaser.Math.Clamp(
        this.girl.x + mpVel * dt, 16, GAME_W - 16
      );
    }

    this.turtles.children.iterate(t => {
      if (!t) return;
      if (t.x <= 32) t.setVelocityX(Math.abs(t.body.velocity.x));
      if (t.x >= GAME_W - 32) t.setVelocityX(-Math.abs(t.body.velocity.x));
    });
    this.hedgehogs.children.iterate(h => {
      if (!h) return;
      if (h.x <= 32) h.setVelocityX(Math.abs(h.body.velocity.x));
      if (h.x >= GAME_W - 32) h.setVelocityX(-Math.abs(h.body.velocity.x));
    });
    this.capybaras.children.iterate(c => {
      if (!c) return;
      if (c.x <= 32) c.setVelocityX(Math.abs(c.body.velocity.x));
      if (c.x >= GAME_W - 32) c.setVelocityX(-Math.abs(c.body.velocity.x));
    });

    // Анимация волн (пляж)
    if (this._waveGfx) {
      this._waveGfx.forEach(wg => {
        wg.x -= wg._speed * dt;
        if (wg.x < -wg._row.w) wg.x = GAME_W + wg._row.w;
      });
    }

    // Двигаем облака
    this.cloudList.forEach(cloud => {
      cloud.x += cloud._cloudSpeed * dt;
      if (cloud.x > GAME_W + cloud._cloudW) {
        cloud.x = -cloud._cloudW;
        cloud.y = Phaser.Math.Between(30, 110);
      }
    });

    // Покачивание травы и цветов от ветра (только для леса)
    this._windTime += dt;
    const windStrength = 5 + 3 * Math.sin(this._windTime * 0.4);
    this.decorList.forEach(d => {
      if (d.speed > 0) d.img.angle = windStrength * Math.sin(this._windTime * d.speed + d.phase);
    });
  }
}

// ============================
//  Функции рисования спрайтов
// ============================

function drawBackground(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Небо
  const sky = scene.add.graphics();
  sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xffd6ff, 0xffd6ff, 1);
  sky.fillRect(0, 0, GAME_W, GAME_H);

  // Деревья на горизонте (стоят на земле, выглядят вдали — меньше и чуть бледнее)
  const groundY = GAME_H - 32;
  [
    [60,  groundY, 0.55],
    [200, groundY, 0.45],
    [400, groundY, 0.60],
    [600, groundY, 0.50],
    [780, groundY, 0.55],
    [900, groundY, 0.48],
  ].forEach(([x, y, sc]) => {
    const th = Math.round(80 * sc);   // высота ствола
    const tw = Math.round(6  * sc);   // ширина ствола
    const cr = Math.round(60 * sc);   // радиус кроны
    const cr2 = Math.round(45 * sc);
    // Ствол
    g.fillStyle(0x6B4226, 0.75);
    g.fillRect(x - tw, y - th, tw * 2, th);
    // Нижний ярус кроны
    g.fillStyle(0x2d6e1a, 0.7);
    g.fillTriangle(x, y - th - cr, x - cr, y - th + 8, x + cr, y - th + 8);
    // Верхний ярус кроны
    g.fillStyle(0x3a8822, 0.7);
    g.fillTriangle(x, y - th - cr - cr2 * 0.55, x - cr2, y - th - cr + 12, x + cr2, y - th - cr + 12);
  });

  // Цветы
  [[150, 460], [230, 462], [560, 461], [640, 460]].forEach(([x, y]) => {
    g.fillStyle(0xFF69B4);
    g.fillCircle(x, y, 5);
    g.fillStyle(0xFFFF00);
    g.fillCircle(x, y, 3);
  });

  g.generateTexture('background', GAME_W, GAME_H);
  g.destroy();
}

function drawGround(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x4a7c22);
  g.fillRect(0, 0, 64, 32);
  g.fillStyle(0x5a9a2a);
  g.fillRect(0, 0, 64, 10);
  g.fillStyle(0x7ec850);
  for (let i = 0; i < 64; i += 8) {
    g.fillTriangle(i, 10, i + 4, 2, i + 8, 10);
  }
  g.generateTexture('ground', 64, 32);
  g.destroy();
}

function drawPlatform(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x8B4513);
  g.fillRoundedRect(0, 4, 64, 24, 6);
  g.fillStyle(0x5C3A1E);
  g.fillRoundedRect(4, 4, 56, 8, 4);
  g.fillStyle(0xA0522D);
  g.fillRect(8, 8, 12, 4);
  g.fillRect(30, 8, 14, 4);
  // Мох
  g.fillStyle(0x7ec850);
  for (let i = 0; i < 64; i += 6) {
    g.fillCircle(i + 3, 5, 3);
  }
  g.generateTexture('platform', 64, 28);
  g.destroy();
}

function drawGirl(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Платье (розовое)
  g.fillStyle(0xFF69B4);
  g.fillTriangle(16, 26, 4, 52, 28, 52);

  // Тело
  g.fillStyle(0xFF85C2);
  g.fillRect(10, 18, 12, 14);

  // Голова
  g.fillStyle(0xFFDBAC);
  g.fillCircle(16, 14, 10);

  // Волосы (рыжие, как у сказочной героини)
  g.fillStyle(0xFF6600);
  g.fillEllipse(16, 8, 22, 12);
  g.fillCircle(6, 14, 5);
  g.fillCircle(26, 14, 5);
  // Косички
  g.fillRect(4, 14, 4, 12);
  g.fillRect(24, 14, 4, 12);

  // Глаза
  g.fillStyle(0x2244CC);
  g.fillCircle(12, 13, 2);
  g.fillCircle(20, 13, 2);
  g.fillStyle(0xffffff);
  g.fillCircle(13, 12, 1);
  g.fillCircle(21, 12, 1);

  // Рот (улыбка)
  g.fillStyle(0xFF3366);
  g.fillEllipse(16, 18, 6, 3);

  // Ноги
  g.fillStyle(0xFFDBAC);
  g.fillRect(9, 50, 5, 10);
  g.fillRect(18, 50, 5, 10);

  // Башмаки
  g.fillStyle(0x8B0000);
  g.fillRoundedRect(7, 58, 8, 5, 2);
  g.fillRoundedRect(17, 58, 8, 5, 2);

  g.generateTexture('girl', 32, 64);
  g.destroy();
}

function drawTurtle(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // === Хвостик (сзади, справа) ===
  g.fillStyle(0x58aa38);
  g.fillEllipse(40, 19, 9, 6);

  // === 4 лапки — рисуем ДО тела чтобы тело их перекрыло сверху ===
  g.fillStyle(0x58aa38);
  // Передние лапки (слева): одна тянется вперёд, вторая чуть назад
  g.fillPoints([{x:10,y:18},{x:14,y:18},{x:12,y:28},{x:5,y:28}],  true); // перед
  g.fillPoints([{x:14,y:19},{x:18,y:19},{x:18,y:27},{x:11,y:27}], true); // зад-перед

  // Задние лапки (справа)
  g.fillPoints([{x:25,y:19},{x:29,y:19},{x:32,y:27},{x:25,y:27}], true); // перед-зад
  g.fillPoints([{x:29,y:18},{x:33,y:18},{x:39,y:28},{x:31,y:28}], true); // зад

  // Пальчики на передних лапках
  g.fillStyle(0x3a7a22);
  g.fillCircle(5, 28, 2.5);
  g.fillCircle(9, 29, 2.5);
  g.fillCircle(13, 28, 2);
  // Пальчики на задних лапках
  g.fillCircle(25, 28, 2);
  g.fillCircle(29, 29, 2.5);
  g.fillCircle(33, 28, 2.5);
  g.fillCircle(38, 28, 2.5);

  // === Тело / брюхо — приплюснутый горизонтальный овал ===
  g.fillStyle(0x7ac840);
  g.fillEllipse(23, 20, 38, 13);

  // === Панцирь — купол над телом ===
  g.fillStyle(0x2a6228);
  g.fillEllipse(23, 13, 32, 20);

  // Щиток центральный
  g.fillStyle(0x3a8a36);
  g.fillEllipse(23, 12, 16, 12);
  // Боковые щитки
  g.fillStyle(0x348030);
  g.fillEllipse(14, 15, 11, 8);
  g.fillEllipse(32, 15, 11, 8);
  g.fillEllipse(19,  7, 10, 7);
  g.fillEllipse(27,  7, 10, 7);
  // Контур панциря
  g.lineStyle(1.5, 0x183c18, 1);
  g.strokeEllipse(23, 13, 32, 20);
  // Линии между щитками
  g.lineStyle(1, 0x1e4e1e, 1);
  g.beginPath(); g.moveTo(23, 3);  g.lineTo(23, 22); g.strokePath();
  g.beginPath(); g.moveTo(8, 12);  g.lineTo(38, 18); g.strokePath();
  g.beginPath(); g.moveTo(8, 18);  g.lineTo(38, 12); g.strokePath();

  // === Шея ===
  g.fillStyle(0x58aa38);
  g.fillEllipse(8, 18, 10, 9);

  // === Голова — сбоку, смотрит влево ===
  g.fillStyle(0x58aa38);
  g.fillCircle(5, 14, 7);

  // Большой мультяшный глаз
  g.fillStyle(0x080808);
  g.fillCircle(4, 11, 3.5);
  g.fillStyle(0xffffff);
  g.fillCircle(5, 10, 1.8);
  g.fillStyle(0xffffff);
  g.fillCircle(3, 13, 0.8);

  // Ноздря
  g.fillStyle(0x2a6a18);
  g.fillCircle(1, 14, 1.2);

  // Улыбка
  g.fillStyle(0x3a8828);
  g.fillEllipse(4, 17, 7, 3);
  g.fillStyle(0xffffff);
  g.fillEllipse(4, 16, 5, 1.8);

  g.generateTexture('turtle', 44, 30);
  g.destroy();
}

function drawClouds(scene) {
  // Три размера облаков
  const sizes = [
    { key: 'cloud_sm', w: 80,  h: 40  },
    { key: 'cloud_md', w: 120, h: 55  },
    { key: 'cloud_lg', w: 170, h: 70  },
  ];
  sizes.forEach(({ key, w, h }) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 0.92);
    g.fillEllipse(w * 0.5,  h * 0.65, w * 0.9, h * 0.7);
    g.fillEllipse(w * 0.35, h * 0.45, w * 0.55, h * 0.6);
    g.fillEllipse(w * 0.65, h * 0.38, w * 0.48, h * 0.55);
    g.fillEllipse(w * 0.5,  h * 0.35, w * 0.6,  h * 0.55);
    g.generateTexture(key, w, h);
    g.destroy();
  });
}

// Создаёт летящие облака в сцене и возвращает массив для update()
function spawnClouds(scene) {
  const configs = [
    { key: 'cloud_lg', x:  60,  y:  55, speed: 18, alpha: 0.95 },
    { key: 'cloud_md', x: 220,  y:  80, speed: 28, alpha: 0.85 },
    { key: 'cloud_sm', x: 410,  y:  45, speed: 40, alpha: 0.75 },
    { key: 'cloud_lg', x: 560,  y:  90, speed: 22, alpha: 0.90 },
    { key: 'cloud_sm', x: 700,  y:  60, speed: 35, alpha: 0.80 },
    { key: 'cloud_md', x: 900,  y:  35, speed: 25, alpha: 0.88 },
    { key: 'cloud_sm', x:1050,  y:  75, speed: 45, alpha: 0.70 },
  ];
  return configs.map(c => {
    const img = scene.add.image(c.x, c.y, c.key)
      .setAlpha(c.alpha)
      .setDepth(-1)
      .setScrollFactor(0.15); // медленный параллакс
    img._cloudSpeed = c.speed;
    img._cloudW = scene.textures.get(c.key).getSourceImage().width;
    return img;
  });
}

function drawApple(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Яблоко
  g.fillStyle(0xFF2222);
  g.fillCircle(10, 12, 9);
  // Блик
  g.fillStyle(0xFF8888);
  g.fillCircle(7, 9, 3);
  // Листик
  g.fillStyle(0x228B22);
  g.fillEllipse(12, 4, 8, 5);
  // Черенок
  g.lineStyle(2, 0x5C3A1E);
  g.beginPath();
  g.moveTo(10, 4);
  g.lineTo(10, 1);
  g.strokePath();
  g.generateTexture('apple', 20, 22);
  g.destroy();
}

function drawHedgehog(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // === Основа тела — тёмно-коричневый горб ===
  g.fillStyle(0x3a1e06);
  g.fillEllipse(25, 21, 28, 20);

  // === Иголки — тонкие острые треугольники дугой по спине ===
  g.fillStyle(0x110901);
  [
    [11,  5,  9, 15, 14, 15],
    [15,  2, 13, 13, 18, 13],
    [19,  1, 17, 11, 22, 11],
    [23,  0, 21, 11, 26, 11],
    [27,  1, 25, 11, 30, 11],
    [31,  3, 29, 13, 34, 13],
    [35,  7, 33, 16, 37, 16],
    [37, 13, 35, 20, 38, 20],
  ].forEach(([tx, ty, bx1, by1, bx2, by2]) =>
    g.fillTriangle(tx, ty, bx1, by1, bx2, by2)
  );

  // === Объём тела — чуть светлее полоска посередине ===
  g.fillStyle(0x5c300e);
  g.fillEllipse(26, 23, 21, 12);

  // === Кремовый живот ===
  g.fillStyle(0xf0dda0);
  g.fillEllipse(20, 27, 16, 9);

  // === Голова — тёплый коричневый круг ===
  g.fillStyle(0xbb7030);
  g.fillCircle(9, 21, 10);

  // === Мордочка — вытянутая вперёд ===
  g.fillStyle(0xcc8840);
  g.fillEllipse(3, 24, 10, 8);

  // === Нос — тёмный овал + розовый блик ===
  g.fillStyle(0x0e0503);
  g.fillEllipse(1, 23, 6, 5);
  g.fillStyle(0xff7080);
  g.fillCircle(1, 22, 2);

  // === Большой мультяшный глаз ===
  g.fillStyle(0x060302);
  g.fillCircle(11, 18, 5.5);
  g.fillStyle(0xffffff);
  g.fillCircle(13, 16, 2.5);   // главный блик
  g.fillStyle(0xffffff);
  g.fillCircle(9,  21, 1);     // нижний блик

  // === Ушко ===
  g.fillStyle(0x8c4a1c);
  g.fillEllipse(13,  9, 9, 7);
  g.fillStyle(0xffaaaa);
  g.fillEllipse(13,  9, 5, 4);

  // === Румянец ===
  g.fillStyle(0xff9999);
  g.fillCircle(5, 25, 3);

  // === Лапки — три округлых ===
  g.fillStyle(0x7a4820);
  g.fillRoundedRect( 8, 28, 6, 7, 2);
  g.fillRoundedRect(17, 28, 6, 7, 2);
  g.fillRoundedRect(25, 28, 6, 7, 2);

  g.generateTexture('hedgehog', 38, 36);
  g.destroy();
}

function drawBalloon(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Шар — большой красочный купол
  const colors = [0xff4444, 0xff8800, 0xffdd00, 0x44cc44, 0x4488ff, 0xcc44ff];
  // Сегменты (6 вертикальных долек)
  for (let i = 0; i < 6; i++) {
    g.fillStyle(colors[i]);
    g.fillTriangle(
      30, 58,
      30 + Math.cos(((i - 0.5) / 6) * Math.PI * 2) * 28,
      30 + Math.sin(((i - 0.5) / 6) * Math.PI * 2) * 28,
      30 + Math.cos(((i + 0.5) / 6) * Math.PI * 2) * 28,
      30 + Math.sin(((i + 0.5) / 6) * Math.PI * 2) * 28
    );
  }
  // Основной круг поверх
  g.fillStyle(0xff4444);
  g.fillCircle(30, 28, 28);
  // Сегменты-дольки поверх круга
  for (let i = 0; i < 6; i++) {
    const a1 = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2;
    const mx = 30 + Math.cos((a1 + a2) / 2) * 14;
    const my = 28 + Math.sin((a1 + a2) / 2) * 14;
    g.fillStyle(colors[i]);
    // Дольки — полосы по кругу
    g.fillPoints([
      { x: 30, y: 28 },
      { x: 30 + Math.cos(a1) * 28, y: 28 + Math.sin(a1) * 28 },
      { x: 30 + Math.cos(a1) * 14, y: 28 + Math.sin(a1) * 14 },
    ].concat(
      Array.from({ length: 5 }, (_, k) => {
        const a = a1 + (a2 - a1) * (k + 1) / 6;
        return { x: 30 + Math.cos(a) * 28, y: 28 + Math.sin(a) * 28 };
      })
    ).concat([
      { x: 30 + Math.cos(a2) * 14, y: 28 + Math.sin(a2) * 14 },
      { x: 30 + Math.cos(a2) * 28, y: 28 + Math.sin(a2) * 28 },
    ]), true);
  }

  // Блик
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(22, 16, 14, 10);

  // Нижний конус (горелка)
  g.fillStyle(0xeecc88);
  g.fillTriangle(22, 56, 38, 56, 30, 66);
  g.fillStyle(0xff6600);
  g.fillTriangle(27, 60, 33, 60, 30, 53); // огонь горелки

  // Корзина
  g.fillStyle(0xaa7733);
  g.fillRoundedRect(20, 66, 20, 14, 3);
  g.lineStyle(1.5, 0x7a5520);
  g.strokeRoundedRect(20, 66, 20, 14, 3);
  // Верёвки
  g.lineStyle(1, 0x8b6914);
  g.beginPath(); g.moveTo(22, 56); g.lineTo(22, 66); g.strokePath();
  g.beginPath(); g.moveTo(38, 56); g.lineTo(38, 66); g.strokePath();

  // Люди в корзине (маленькие головы)
  g.fillStyle(0xffcc99);
  g.fillCircle(26, 68, 3);
  g.fillCircle(34, 68, 3);

  g.generateTexture('balloon', 60, 82);
  g.destroy();
}

function drawPlane(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Крыло (рисуем первым — под фюзеляжем)
  g.fillStyle(0xdde0ee);
  g.fillPoints([
    {x:36,y:19},{x:54,y:19},{x:66,y:40},{x:16,y:40}
  ], true);

  // Горизонтальное оперение (хвост)
  g.fillStyle(0xdde0ee);
  g.fillPoints([
    {x:4,y:20},{x:19,y:20},{x:21,y:29},{x:3,y:29}
  ], true);

  // Фюзеляж
  g.fillStyle(0xf5f6ff);
  g.fillEllipse(47, 20, 86, 24);

  // Нос (острый, вправо)
  g.fillStyle(0xeceef8);
  g.fillTriangle(86, 13, 96, 20, 86, 27);

  // Вертикальный киль
  g.fillStyle(0xdde0ee);
  g.fillPoints([
    {x:5,y:19},{x:17,y:19},{x:15,y:5},{x:7,y:5}
  ], true);

  // Цветная полоса по борту
  g.fillStyle(0x3399ff);
  g.fillRect(14, 16, 72, 6);

  // Иллюминаторы
  g.fillStyle(0xbbddff);
  [28, 42, 56, 70].forEach(x => {
    g.fillRoundedRect(x, 10, 10, 9, 3);
    g.fillStyle(0x88ccff);
    g.fillRoundedRect(x + 2, 11, 5, 5, 2);
    g.fillStyle(0xbbddff);
  });

  // Двигатель под крылом
  g.fillStyle(0xcccedc);
  g.fillRoundedRect(36, 36, 22, 9, 3);
  g.fillStyle(0xaaaacc);
  g.fillCircle(36, 40, 4);

  // Контур фюзеляжа
  g.lineStyle(1, 0xbbbecc, 0.7);
  g.strokeEllipse(47, 20, 86, 24);

  g.generateTexture('plane', 98, 46);
  g.destroy();
}

function drawCapybara(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Туловище — большой округлый коричневый овал
  g.fillStyle(0x8B6914);
  g.fillEllipse(21, 20, 34, 20);

  // Голова — квадратноватая
  g.fillStyle(0x9B7520);
  g.fillRoundedRect(1, 10, 17, 14, 4);

  // Большая квадратная морда (характерно для капибары)
  g.fillStyle(0x7A5410);
  g.fillRoundedRect(0, 14, 11, 10, 3);

  // Ноздри
  g.fillStyle(0x2e1a00);
  g.fillCircle(3,  19, 1.5);
  g.fillCircle(8,  19, 1.5);

  // Глаз
  g.fillStyle(0x111111);
  g.fillCircle(13, 13, 2.5);
  g.fillStyle(0xffffff);
  g.fillCircle(14, 12, 1);

  // Ухо
  g.fillStyle(0x7A5410);
  g.fillEllipse(11, 6, 8, 5);
  g.fillStyle(0xC89040);
  g.fillEllipse(11, 6, 4, 3);

  // Шерстяные пятна
  g.fillStyle(0x6B5010);
  g.fillCircle(24, 14, 2);
  g.fillCircle(30, 17, 2.5);
  g.fillCircle(26, 22, 2);

  // Лапы
  g.fillStyle(0x6B4E10);
  g.fillRoundedRect(7,  28, 7, 6, 2);
  g.fillRoundedRect(17, 28, 7, 6, 2);
  g.fillRoundedRect(27, 28, 7, 6, 2);

  g.generateTexture('capybara', 38, 36);
  g.destroy();
}

function drawPotion(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Пробка
  g.fillStyle(0xcc8833);
  g.fillRect(7, 0, 10, 4);

  // Горлышко
  g.fillStyle(0x88aacc);
  g.fillRect(8, 3, 8, 6);

  // Бутылка (стекло)
  g.fillStyle(0xaaccee);
  g.fillRoundedRect(3, 8, 18, 20, 5);

  // Жидкость (зелёная, магическая)
  g.fillStyle(0x44ff88);
  g.fillRoundedRect(5, 14, 14, 12, 4);

  // Блик
  g.fillStyle(0xffffff);
  g.fillRoundedRect(5, 9, 4, 8, 2);

  // Пузырьки
  g.fillStyle(0xaaffcc);
  g.fillCircle(10, 18, 2);
  g.fillCircle(15, 21, 1);

  // Звёздочки (вместо fillStar — три маленьких крестика)
  g.fillStyle(0xffff00);
  g.fillRect(10, -4, 4, 2);
  g.fillRect(11, -5, 2, 4);
  g.fillRect(17, -2, 3, 2);
  g.fillRect(17, -3, 2, 3);
  g.fillRect(5, -2, 3, 2);
  g.fillRect(6, -3, 2, 3);

  g.generateTexture('potion', 24, 32);
  g.destroy();
}

function drawGrassBlades(scene) {
  // 3 варианта кустиков травы разной высоты
  [['grass_sm', 14, 20], ['grass_md', 18, 26], ['grass_lg', 22, 32]].forEach(([key, w, h]) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const blades = Math.floor(w / 5);
    for (let i = 0; i < blades; i++) {
      const bx = 3 + i * 5;
      const lean = (i % 2 === 0) ? -1 : 1;
      // Основание лезвия травы
      g.fillStyle(0x3a8c1e);
      g.fillTriangle(bx, h, bx + 2, h, bx + 1 + lean * 3, h - h * 0.85);
      // Светлый блик
      g.fillStyle(0x5ec93a);
      g.fillTriangle(bx, h, bx + 1, h, bx + lean * 2, h - h * 0.6);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  });
}

function drawFlowers(scene) {
  // Несколько цветов разных окрасок
  const variants = [
    { key: 'flower_pink',   petal: 0xFF69B4, center: 0xFFFF88 },
    { key: 'flower_white',  petal: 0xFFFFFF, center: 0xFFDD00 },
    { key: 'flower_purple', petal: 0xCC66FF, center: 0xFFFF88 },
    { key: 'flower_red',    petal: 0xFF3333, center: 0xFFFF00 },
  ];
  variants.forEach(({ key, petal, center }) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Стебель
    g.fillStyle(0x2e7d0e);
    g.fillRect(7, 10, 2, 14);
    // Лепестки (4 по диагонали)
    g.fillStyle(petal);
    g.fillEllipse(7, 5, 6, 9);
    g.fillEllipse(9, 7, 9, 6);
    g.fillEllipse(7, 9, 6, 9);
    g.fillEllipse(5, 7, 9, 6);
    // Серединка
    g.fillStyle(center);
    g.fillCircle(7, 7, 4);
    // Листочек на стебле
    g.fillStyle(0x3a9a1e);
    g.fillEllipse(10, 16, 7, 4);
    g.generateTexture(key, 16, 24);
    g.destroy();
  });
}

// Размещает траву и цветы вдоль земли (только декор, без физики)
function spawnGroundDecor(scene) {
  const groundY = GAME_H - 32; // чуть выше поверхности земли
  const grassKeys = ['grass_sm', 'grass_md', 'grass_lg'];
  const flowerKeys = ['flower_pink', 'flower_white', 'flower_purple', 'flower_red'];
  const decorItems = [];

  // Трава — каждые ~30px вдоль земли
  for (let x = 10; x < GAME_W; x += Phaser.Math.Between(20, 45)) {
    const key = Phaser.Utils.Array.GetRandom(grassKeys);
    const item = scene.add.image(x, groundY, key)
      .setOrigin(0.5, 1)
      .setDepth(-2)
      .setAlpha(0.9);
    decorItems.push({ img: item, speed: Phaser.Math.FloatBetween(0.6, 1.4), phase: Math.random() * Math.PI * 2 });
  }

  // Цветы — реже, группами
  for (let x = 25; x < GAME_W; x += Phaser.Math.Between(55, 130)) {
    const key = Phaser.Utils.Array.GetRandom(flowerKeys);
    const item = scene.add.image(x, groundY - 2, key)
      .setOrigin(0.5, 1)
      .setDepth(-2)
      .setAlpha(0.95);
    // Иногда ставим рядом второй цветок
    if (Math.random() > 0.5) {
      const key2 = Phaser.Utils.Array.GetRandom(flowerKeys);
      const item2 = scene.add.image(x + Phaser.Math.Between(14, 22), groundY - 2, key2)
        .setOrigin(0.5, 1)
        .setDepth(-2);
      decorItems.push({ img: item2, speed: Phaser.Math.FloatBetween(0.7, 1.3), phase: Math.random() * Math.PI * 2 });
    }
    decorItems.push({ img: item, speed: Phaser.Math.FloatBetween(0.7, 1.3), phase: Math.random() * Math.PI * 2 });
  }

  return decorItems;
}

// ============================
//  ПЛЯЖНЫЕ ТЕКСТУРЫ И ДЕКОРАЦИИ
// ============================

function drawShell(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Основная раковина
  g.fillStyle(0xFFB6A3);
  g.fillEllipse(12, 11, 22, 18);
  // Спираль
  g.fillStyle(0xFF8C7A);
  g.fillEllipse(12, 12, 14, 11);
  g.fillStyle(0xFFCFBF);
  g.fillEllipse(12, 13, 7, 6);
  // Рёбра раковины
  g.lineStyle(1, 0xFF8C7A, 0.7);
  g.beginPath(); g.moveTo(12, 3); g.lineTo(3, 17); g.strokePath();
  g.beginPath(); g.moveTo(12, 3); g.lineTo(12, 19); g.strokePath();
  g.beginPath(); g.moveTo(12, 3); g.lineTo(21, 17); g.strokePath();
  // Основание
  g.fillStyle(0xFFD0C0); g.fillEllipse(12, 19, 18, 5);
  g.generateTexture('shell', 24, 22);
  g.destroy();
}

function drawBeachBackground(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Небо — полосы для имитации градиента (без альфы — работает стабильно)
  const skyBands = [
    [0, 70,  0x5EC8F5],
    [70, 70, 0x70CCF0],
    [140, 70,0x87CEEB],
    [210, 70,0xA8D8D8],
    [280, 20,0xC4DFCC],
  ];
  skyBands.forEach(([y, h, c]) => { g.fillStyle(c); g.fillRect(0, y, GAME_W, h); });

  // Солнце (сплошные круги без альфы)
  g.fillStyle(0xFFEE66); g.fillCircle(820, 68, 62); // ореол
  g.fillStyle(0xFFD700); g.fillCircle(820, 68, 48); // основной
  g.fillStyle(0xFFF5A0); g.fillCircle(820, 68, 28); // яркий центр

  // Море — три сплошных слоя
  g.fillStyle(0x5BB8E8); g.fillRect(0, 300, GAME_W, 130);
  g.fillStyle(0x3FA0D8); g.fillRect(0, 325, GAME_W, 105);
  g.fillStyle(0x2A8CC0); g.fillRect(0, 355, GAME_W, 70);

  // Волны — светло-голубые эллипсы (сплошные)
  g.fillStyle(0xAADFF8);
  for (let wx = 0; wx < GAME_W; wx += 88) g.fillEllipse(wx + 44, 353, 72, 8);
  g.fillStyle(0xCCEEFF);
  for (let wx = 44; wx < GAME_W; wx += 88) g.fillEllipse(wx + 40, 372, 58, 6);

  // Песок — тёплый жёлтый
  g.fillStyle(0xF5D06A); g.fillRect(0, 410, GAME_W, GAME_H - 410);
  // Полоска влажного песка у кромки воды
  g.fillStyle(0xD8A840); g.fillRect(0, 410, GAME_W, 18);

  g.generateTexture('beach_bg', GAME_W, GAME_H);
  g.destroy();
}

function drawBeachGround(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xE8C060); g.fillRect(0, 0, 64, 32);
  g.fillStyle(0xD4A840); g.fillRect(0, 0, 64, 10);
  // Волнистый верхний край
  for (let i = 0; i < 64; i += 8) {
    g.fillStyle(0xF0D070); g.fillEllipse(i + 4, 5, 10, 6);
  }
  // Пятнышки — мелкие камушки
  g.fillStyle(0xC8943A);
  [8, 20, 36, 50].forEach(x => g.fillCircle(x, 18, 2));
  g.generateTexture('beach_ground', 64, 32);
  g.destroy();
}

function drawBeachPlatform(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Доски причала
  g.fillStyle(0x9B6B30); g.fillRoundedRect(0, 2, 64, 24, 4);
  // Горизонтальные доски
  g.fillStyle(0xAD7A3A);
  [2, 9, 16, 23].forEach(y => g.fillRect(2, y, 60, 5));
  g.fillStyle(0x7A4E20);
  [8, 15, 22].forEach(y => g.fillRect(0, y, 64, 1));
  // Гвозди / стыки
  g.fillStyle(0x555555);
  [10, 32, 54].forEach(x => { g.fillCircle(x, 6, 2); g.fillCircle(x, 20, 2); });
  // Водоросль
  g.fillStyle(0x50C878, 0.6); g.fillEllipse(6, 3, 8, 4); g.fillEllipse(58, 3, 8, 4);
  g.generateTexture('beach_platform', 64, 28);
  g.destroy();
}

function drawCrab(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // === НОГИ (3 пары, выходят вниз-в стороны) ===
  g.fillStyle(0xCC4411);
  // Левые ноги
  g.fillPoints([{x:13,y:32},{x:10,y:30},{x:2,y:30},{x:4,y:34}],  true); // передняя
  g.fillPoints([{x:12,y:36},{x:9,y:34},{x:1,y:38},{x:3,y:42}],   true); // средняя
  g.fillPoints([{x:13,y:40},{x:10,y:40},{x:4,y:47},{x:7,y:47}],  true); // задняя
  // Правые ноги
  g.fillPoints([{x:45,y:32},{x:48,y:30},{x:56,y:30},{x:54,y:34}], true);
  g.fillPoints([{x:46,y:36},{x:49,y:34},{x:57,y:38},{x:55,y:42}], true);
  g.fillPoints([{x:45,y:40},{x:48,y:40},{x:54,y:47},{x:51,y:47}], true);

  // Коготки на концах ног
  g.fillStyle(0xAA2200);
  [[2,30],[1,38],[4,47]].forEach(([x,y]) => g.fillCircle(x,y,2));
  [[56,30],[57,38],[54,47]].forEach(([x,y]) => g.fillCircle(x,y,2));

  // === РУКИ КЛЕШНЕЙ — поднятые вверх ===
  g.fillStyle(0xDD4400);
  // Левая рука: от тела вверх-влево
  g.fillPoints([{x:14,y:30},{x:10,y:28},{x:5,y:14},{x:9,y:14}], true);
  // Правая рука: от тела вверх-вправо
  g.fillPoints([{x:44,y:30},{x:48,y:28},{x:53,y:14},{x:49,y:14}], true);

  // === КЛЕШНИ (острые зубцы смотрят вверх) ===
  // Шары клешней
  g.fillStyle(0xFF5522); g.fillCircle(7,  14, 8);
  g.fillStyle(0xFF5522); g.fillCircle(51, 14, 8);
  // Блик на шарах
  g.fillStyle(0xFF8866); g.fillCircle(6,  12, 4);
  g.fillStyle(0xFF8866); g.fillCircle(50, 12, 4);

  // Острые зубцы — два прона на каждой клешне, торчат ВВЕРХ
  g.fillStyle(0xFF3300);
  // Левая клешня: внутренний зубец
  g.fillTriangle(3, 10, 6, 10, 3,  1);
  // Левая клешня: внешний зубец
  g.fillTriangle(6, 10, 10, 10, 10, 2);
  // Правая клешня: внутренний зубец
  g.fillTriangle(55, 10, 52, 10, 55, 1);
  // Правая клешня: внешний зубец
  g.fillTriangle(52, 10, 48, 10, 48, 2);

  // Тёмный контур зубцов (острее выглядят)
  g.fillStyle(0xBB2200);
  g.fillTriangle(3, 10, 5, 10, 3,  2);
  g.fillTriangle(7, 10, 10, 10, 9, 3);
  g.fillTriangle(55, 10, 53, 10, 55, 2);
  g.fillTriangle(51, 10, 48, 10, 49, 3);

  // === ТЕЛО ===
  g.fillStyle(0xFF6633); g.fillEllipse(29, 36, 36, 24);
  // Панцирь (светлее)
  g.fillStyle(0xFF8850); g.fillEllipse(29, 34, 28, 16);
  // Узор панциря
  g.fillStyle(0xDD5522, 0.6);
  g.fillEllipse(22, 34, 8, 10); g.fillEllipse(29, 32, 8, 10); g.fillEllipse(36, 34, 8, 10);
  // Брюшко
  g.fillStyle(0xFFAA77); g.fillEllipse(29, 42, 22, 10);

  // === ГЛАЗА НА СТЕБЕЛЬКАХ ===
  g.fillStyle(0xCC4411);
  g.fillRect(21, 23, 3, 9); g.fillRect(34, 23, 3, 9); // стебельки
  g.fillStyle(0x111111); g.fillCircle(22, 21, 5); g.fillCircle(36, 21, 5);
  g.fillStyle(0xffffff); g.fillCircle(23, 19, 2); g.fillCircle(37, 19, 2);
  // Зрачки
  g.fillStyle(0x000000); g.fillCircle(23, 20, 1); g.fillCircle(37, 20, 1);

  // === РОТ (довольный) ===
  g.fillStyle(0xCC4411); g.fillEllipse(29, 45, 14, 5);
  g.fillStyle(0xffffff); g.fillEllipse(29, 44, 9, 2.5);

  g.generateTexture('crab', 58, 50);
  g.destroy();
}

// Второй кадр краба — лапки в противофазе (передние и задние подняты)
function drawCrabB(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Левые ноги: лапки 0 и 2 ПОДНЯТЫ (+7), лапка 1 ОПУЩЕНА (+3)
  g.fillStyle(0xCC4411);
  g.fillPoints([{x:13,y:32},{x:10,y:30},{x:2,y:23},{x:4,y:27}],  true); // перед ↑
  g.fillPoints([{x:12,y:36},{x:9,y:34},{x:1,y:41},{x:3,y:45}],   true); // средняя ↓
  g.fillPoints([{x:13,y:40},{x:10,y:40},{x:4,y:40},{x:7,y:40}],  true); // зад ↑
  // Правые ноги (зеркально)
  g.fillPoints([{x:45,y:32},{x:48,y:30},{x:56,y:23},{x:54,y:27}], true);
  g.fillPoints([{x:46,y:36},{x:49,y:34},{x:57,y:41},{x:55,y:45}], true);
  g.fillPoints([{x:45,y:40},{x:48,y:40},{x:54,y:40},{x:51,y:40}], true);

  // Коготки (смещены вместе с лапками)
  g.fillStyle(0xAA2200);
  [[2,23],[1,41],[4,40]].forEach(([x,y]) => g.fillCircle(x,y,2));
  [[56,23],[57,41],[54,40]].forEach(([x,y]) => g.fillCircle(x,y,2));

  // Руки клешней
  g.fillStyle(0xDD4400);
  g.fillPoints([{x:14,y:30},{x:10,y:28},{x:5,y:14},{x:9,y:14}], true);
  g.fillPoints([{x:44,y:30},{x:48,y:28},{x:53,y:14},{x:49,y:14}], true);
  // Шары клешней
  g.fillStyle(0xFF5522); g.fillCircle(7,  14, 8); g.fillCircle(51, 14, 8);
  g.fillStyle(0xFF8866); g.fillCircle(6,  12, 4); g.fillCircle(50, 12, 4);
  // Зубцы
  g.fillStyle(0xFF3300);
  g.fillTriangle(3,10,6,10,3,1); g.fillTriangle(6,10,10,10,10,2);
  g.fillTriangle(55,10,52,10,55,1); g.fillTriangle(52,10,48,10,48,2);
  g.fillStyle(0xBB2200);
  g.fillTriangle(3,10,5,10,3,2); g.fillTriangle(7,10,10,10,9,3);
  g.fillTriangle(55,10,53,10,55,2); g.fillTriangle(51,10,48,10,49,3);

  // Тело (идентично frame A)
  g.fillStyle(0xFF6633); g.fillEllipse(29, 36, 36, 24);
  g.fillStyle(0xFF8850); g.fillEllipse(29, 34, 28, 16);
  g.fillStyle(0xDD5522); g.fillEllipse(22,34,8,10); g.fillEllipse(29,32,8,10); g.fillEllipse(36,34,8,10);
  g.fillStyle(0xFFAA77); g.fillEllipse(29, 42, 22, 10);
  // Глаза
  g.fillStyle(0xCC4411); g.fillRect(21,23,3,9); g.fillRect(34,23,3,9);
  g.fillStyle(0x111111); g.fillCircle(22,21,5); g.fillCircle(36,21,5);
  g.fillStyle(0xffffff); g.fillCircle(23,19,2); g.fillCircle(37,19,2);
  g.fillStyle(0x000000); g.fillCircle(23,20,1); g.fillCircle(37,20,1);
  // Рот
  g.fillStyle(0xCC4411); g.fillEllipse(29,45,14,5);
  g.fillStyle(0xffffff); g.fillEllipse(29,44,9,2.5);

  g.generateTexture('crab_b', 58, 50);
  g.destroy();
}

function drawOctopus(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Щупальца (8 штук — по 4 с каждой стороны, видны снизу)
  g.fillStyle(0x7744AA);
  // Левые
  g.fillEllipse(8,  46, 10, 24);
  g.fillEllipse(15, 50, 10, 20);
  g.fillEllipse(22, 53, 9,  18);
  g.fillEllipse(4,  52, 8,  16);
  // Правые
  g.fillEllipse(50, 46, 10, 24);
  g.fillEllipse(43, 50, 10, 20);
  g.fillEllipse(36, 53, 9,  18);
  g.fillEllipse(54, 52, 8,  16);

  // Кончики щупалец (чуть светлее)
  g.fillStyle(0x9966CC);
  [8, 15, 22, 4].forEach(x  => g.fillCircle(x,  57, 5));
  [50, 43, 36, 54].forEach(x => g.fillCircle(x, 57, 5));

  // Тело — большой круглый blob
  g.fillStyle(0x9966CC);
  g.fillEllipse(29, 28, 48, 42);

  // Голова (верхняя полусфера — чуть светлее)
  g.fillStyle(0xAA77DD);
  g.fillEllipse(29, 20, 40, 28);

  // Блик
  g.fillStyle(0xCC99FF);
  g.fillEllipse(22, 13, 20, 13);

  // Щёчки (румянец — сплошной, без alpha)
  g.fillStyle(0xFF99CC);
  g.fillCircle(14, 31, 7);
  g.fillCircle(44, 31, 7);

  // Белки глаз
  g.fillStyle(0xFFFFFF);
  g.fillCircle(20, 25, 10);
  g.fillCircle(38, 25, 10);

  // Зрачки
  g.fillStyle(0x222244);
  g.fillCircle(21, 26, 7);
  g.fillCircle(39, 26, 7);

  // Блики в глазах
  g.fillStyle(0xFFFFFF);
  g.fillCircle(24, 23, 3);
  g.fillCircle(42, 23, 3);

  // Рот — улыбка
  g.fillStyle(0x553366);
  g.fillEllipse(29, 36, 18, 9);
  g.fillStyle(0xFF88BB);
  g.fillEllipse(29, 35, 14, 6);
  // Зубки
  g.fillStyle(0xFFFFFF);
  g.fillRect(23, 34, 5, 4);
  g.fillRect(30, 34, 5, 4);

  g.generateTexture('octopus', 58, 62);
  g.destroy();
}

function drawStarfishBonus(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xFF7F00);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.fillTriangle(
      15 + Math.cos(a) * 13, 15 + Math.sin(a) * 13,
      15 + Math.cos(a - 0.45) * 5, 15 + Math.sin(a - 0.45) * 5,
      15 + Math.cos(a + 0.45) * 5, 15 + Math.sin(a + 0.45) * 5
    );
  }
  g.fillStyle(0xFF9933); g.fillCircle(15, 15, 5);
  g.fillStyle(0xFFBB55);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.fillCircle(15 + Math.cos(a) * 9, 15 + Math.sin(a) * 9, 1.5);
  }
  g.generateTexture('starfish_bonus', 30, 30);
  g.destroy();
}

function drawPalmTree(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Ствол
  g.fillStyle(0x8B6914);
  g.fillPoints([{x:18,y:130},{x:22,y:130},{x:24,y:60},{x:20,y:30},{x:16,y:60}], true);
  // Текстура ствола
  g.fillStyle(0x7A5C10);
  [110,90,70,55].forEach(y => g.fillEllipse(20, y, 8, 4));
  // Листья
  const leafColor = [[0x228B22,0],[0x2EA82E,0.4],[0x1A7A1A,0.8],[0x20A020,1.2],[0x25B025,1.6],[0x1A8A1A,2.0]];
  leafColor.forEach(([c, angle]) => {
    g.fillStyle(c);
    const ax = 20 + Math.cos(angle - 0.5) * 6;
    const ay = 28 + Math.sin(angle - 0.5) * 3;
    const bx = 20 + Math.cos(angle) * 38;
    const by = 28 + Math.sin(angle) * 16;
    const cx = 20 + Math.cos(angle + 0.5) * 6;
    const cy = 28 + Math.sin(angle + 0.5) * 3;
    g.fillTriangle(ax, ay, bx, by, cx, cy);
  });
  // Кокосы
  g.fillStyle(0x8B6914); g.fillCircle(18, 32, 4); g.fillCircle(24, 30, 4);
  g.generateTexture('palm_tree', 50, 132);
  g.destroy();
}

function drawBeachUmbrella(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Шест
  g.fillStyle(0xAA8844); g.fillRect(38, 10, 4, 80);
  // Сегменты зонтика (6 цветов)
  const cols = [0xFF4444, 0xFFFF44, 0x44FF44, 0x4444FF, 0xFF44FF, 0xFF8844];
  for (let i = 0; i < 6; i++) {
    const a1 = (i / 6) * Math.PI - 0.05;
    const a2 = ((i + 1) / 6) * Math.PI + 0.05;
    g.fillStyle(cols[i]);
    g.fillTriangle(
      40, 12,
      40 + Math.cos(a1) * 38, 12 - Math.sin(a1) * 24,
      40 + Math.cos(a2) * 38, 12 - Math.sin(a2) * 24
    );
  }
  g.fillStyle(0xffffff, 0.2); g.fillEllipse(40, 12, 76, 20);
  g.fillStyle(0xAA8844); g.fillCircle(40, 12, 4);
  // Коврик под зонтиком
  g.fillStyle(0xFF9966, 0.6); g.fillEllipse(40, 88, 64, 12);
  g.generateTexture('beach_umbrella', 80, 92);
  g.destroy();
}

function drawSupBoard(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Доска
  g.fillStyle(0xFF6633); g.fillEllipse(35, 22, 68, 12);
  g.fillStyle(0xFF8855); g.fillEllipse(35, 20, 60, 7);
  // Человек (схематично)
  g.fillStyle(0xFFCC99); g.fillCircle(35, 6, 5);   // голова
  g.fillStyle(0x4488FF); g.fillRect(31, 10, 8, 9); // тело
  // Весло
  g.fillStyle(0x8B5E3C);
  g.fillRect(48, 4, 2, 20);
  g.fillStyle(0xAA7744); g.fillEllipse(49, 24, 6, 10);
  g.generateTexture('sup_board', 70, 32);
  g.destroy();
}

function drawJumpingFish(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x4488FF);
  g.fillEllipse(12, 8, 20, 10);
  // Хвост
  g.fillTriangle(22, 6, 28, 1, 28, 14);
  // Плавник
  g.fillTriangle(10, 3, 8, -2, 16, 3);
  g.fillStyle(0x88BBFF); g.fillEllipse(10, 8, 10, 6);
  g.fillStyle(0x111111); g.fillCircle(5, 7, 2);
  g.fillStyle(0xffffff); g.fillCircle(5, 6, 1);
  g.generateTexture('jumping_fish', 30, 16);
  g.destroy();
}

function spawnBeachDecor(scene) {
  const groundY = GAME_H - 32;
  const decorItems = [];

  // Пальмы на фоне
  const palmPositions = [60, 200, 420, 650, 850];
  palmPositions.forEach(x => {
    const sc = Phaser.Math.FloatBetween(0.7, 1.1);
    scene.add.image(x, groundY - 10, 'palm_tree')
      .setOrigin(0.5, 1).setScale(sc).setDepth(-2).setAlpha(0.9);
  });

  // Зонтик (правая часть карты)
  scene.add.image(GAME_W - 130, groundY - 5, 'beach_umbrella')
    .setOrigin(0.5, 1).setScale(1.1).setDepth(-1);

  // Ракушки и морские звёзды вдоль земли
  for (let x = 30; x < GAME_W - 30; x += Phaser.Math.Between(60, 140)) {
    const img = scene.add.image(x, groundY - 2, 'shell')
      .setOrigin(0.5, 1).setDepth(-2).setScale(Phaser.Math.FloatBetween(0.7, 1.2))
      .setAngle(Phaser.Math.Between(-30, 30));
    decorItems.push({ img, speed: 0, phase: 0 }); // ракушки не качаются
  }
  for (let x = 80; x < GAME_W - 80; x += Phaser.Math.Between(120, 200)) {
    scene.add.image(x, groundY - 3, 'starfish_bonus')
      .setOrigin(0.5, 1).setDepth(-2).setScale(0.6).setAlpha(0.8);
  }

  return decorItems;
}

// ============================
//  ЗВУКОВЫЕ ЭФФЕКТЫ (Web Audio API)
// ============================
const SoundFX = (() => {
  let _ctx = null, _master = null;
  let _ambientSrc = null, _ambientLfo = null;
  let _musicId    = null;
  let _seagullId  = null;

  function ac() {
    if (!_ctx) {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _master = _ctx.createGain();
      _master.gain.value = 0.6;
      _master.connect(_ctx.destination);
    }
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  }

  function tone(freq, type, dur, vol, when = 0, freqTo) {
    const c = ac(), now = c.currentTime + when;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqTo) osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 10), now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g); g.connect(_master);
    osc.start(now); osc.stop(now + dur + 0.05);
  }

  function noise(dur, bandFreq, Q, vol, when = 0) {
    const c = ac(), now = c.currentTime + when;
    const sz = Math.ceil(c.sampleRate * (dur + 0.1));
    const buf = c.createBuffer(1, sz, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = bandFreq; f.Q.value = Q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f); f.connect(g); g.connect(_master);
    src.start(now); src.stop(now + dur + 0.1);
  }

  const sfx = {
    // --- Прыжок ---
    jump() {
      tone(190, 'sine', 0.16, 0.28, 0, 510);
      noise(0.06, 650, 2, 0.07, 0.01);
    },

    // --- Сбор бонуса (морская звезда / капибара) ---
    bonus() {
      tone(523,  'sine', 0.28, 0.26, 0.00);
      tone(659,  'sine', 0.28, 0.26, 0.09);
      tone(784,  'sine', 0.32, 0.28, 0.18);
      tone(1047, 'sine', 0.28, 0.16, 0.29);
    },

    // --- Бросок яблока ---
    throwFX() {
      noise(0.16, 1900, 3, 0.30, 0);
      tone(380, 'sawtooth', 0.14, 0.08, 0, 95);
    },

    // --- Попадание яблоком во врага ---
    hitFX() {
      noise(0.11, 520, 1.5, 0.38, 0);
      tone(72, 'sine', 0.18, 0.42, 0, 38);
    },

    // --- Фоновый шум волн ---
    startBeachAmbient() {
      if (_ambientSrc) return;
      const c = ac();
      const sec = 12, sz = Math.ceil(c.sampleRate * sec);
      const buf = c.createBuffer(1, sz, c.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
      _ambientSrc = c.createBufferSource();
      _ambientSrc.buffer = buf; _ambientSrc.loop = true;

      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
      _ambientLfo = c.createOscillator();
      const lg = c.createGain(); _ambientLfo.frequency.value = 0.09; lg.gain.value = 240;
      _ambientLfo.connect(lg); lg.connect(lp.frequency);

      const wg = c.createGain(); wg.gain.value = 0.13;
      _ambientSrc.connect(lp); lp.connect(wg); wg.connect(_master);
      _ambientLfo.start(); _ambientSrc.start();
    },

    stopBeachAmbient() {
      try { if (_ambientSrc) _ambientSrc.stop(); } catch (e) {}
      try { if (_ambientLfo) _ambientLfo.stop(); } catch (e) {}
      _ambientSrc = _ambientLfo = null;
    },

    // --- Чайка ---
    seagull() {
      const c = ac();
      const calls = Math.random() > 0.45 ? 2 : 1;
      for (let k = 0; k < calls; k++) {
        const now = c.currentTime + k * 0.52;
        const osc = c.createOscillator(), mod = c.createOscillator();
        const mg = c.createGain(), g = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(670, now + 0.30);
        mod.frequency.value = 6; mg.gain.value = 65;
        mod.connect(mg); mg.connect(osc.frequency);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.11, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        osc.connect(g); g.connect(_master);
        mod.start(now); osc.start(now);
        mod.stop(now + 0.36); osc.stop(now + 0.36);
      }
    },

    startSeagulls() {
      const sched = () => {
        sfx.seagull();
        _seagullId = setTimeout(sched, 9000 + Math.random() * 17000);
      };
      _seagullId = setTimeout(sched, 5000 + Math.random() * 7000);
    },

    stopSeagulls() {
      if (_seagullId !== null) { clearTimeout(_seagullId); _seagullId = null; }
    },

    // --- Тропическая фоновая музыка ---
    startBeachMusic() {
      if (_musicId !== null) return;
      // C мажорная пентатоника: C4 E4 G4 A4 C5 E5 G5
      const N = [262, 330, 392, 440, 523, 659, 784];
      // Жизнерадостный тропический арпеджио
      const P = [0,2,4,2, 5,4,2,0, 1,3,4,3, 6,4,3,1,
                 0,4,2,4, 5,2,4,5, 1,3,5,3, 4,2,0,2];
      let step = 0;
      const MS = (60 / 114) * 500; // 114 BPM, восьмые ноты ~263ms

      const tick = () => {
        const freq = N[P[step % P.length]];
        tone(freq, 'triangle', 0.38, 0.09);
        // Бас на каждую долю (каждые 2 шага)
        if (step % 2 === 0) tone(N[step % 16 < 8 ? 0 : 1] * 0.5, 'sine', 0.55, 0.06);
        // Гармония каждые 4 шага
        if (step % 4 === 2) tone(freq * 1.498, 'sine', 0.30, 0.035);
        step++;
      };
      tick();
      _musicId = setInterval(tick, MS);
    },

    stopBeachMusic() {
      if (_musicId !== null) { clearInterval(_musicId); _musicId = null; }
    },

    stopAll() {
      sfx.stopBeachAmbient();
      sfx.stopBeachMusic();
      sfx.stopSeagulls();
    }
  };

  return sfx;
})();

// ============================
//  Запуск игры
// ============================
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 600 }, debug: false }
  },
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene, LevelCompleteScene, VictoryScene, NameInputScene, LeaderboardScene]
};

const game = new Phaser.Game(config);
