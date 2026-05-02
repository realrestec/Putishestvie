// ============================
//  ПУТЕШЕСТВИЕ
// ============================

const GAME_W = 960;
const GAME_H = 560;
const MAX_LEVEL = 2;
const SPRITES = 'assets/sprites/cutout/resized/';

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

    // Рамка
    const frame = this.add.graphics();
    frame.lineStyle(4, 0xFFD700, 1);
    frame.strokeRoundedRect(GAME_W / 2 - 260, GAME_H / 2 - 160, 520, 320, 20);
    frame.fillStyle(0x1a0a2e, 0.75);
    frame.fillRoundedRect(GAME_W / 2 - 260, GAME_H / 2 - 160, 520, 320, 20);

    // Звёздочки вокруг названия
    const stars = ['✨', '⭐', '🌟', '✨', '⭐'];
    stars.forEach((s, i) => {
      this.add.text(GAME_W / 2 - 200 + i * 100, GAME_H / 2 - 130, s, {
        fontSize: '22px'
      }).setOrigin(0.5);
    });

    // Название игры
    this.add.text(GAME_W / 2, GAME_H / 2 - 80, 'Путешествие', {
      fontSize: '62px',
      fill: '#FFD700',
      stroke: '#8B0000',
      strokeThickness: 6,
      fontStyle: 'bold',
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5);

    // Подзаголовок
    this.add.text(GAME_W / 2, GAME_H / 2 - 10, '— сказочное приключение —', {
      fontSize: '20px',
      fill: '#ffccff',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Персонаж на экране меню
    const girl = this.add.image(GAME_W / 2 + 170, GAME_H / 2 + 20, 'girl_menu');
    girl.setScale(0.9);
    this.tweens.add({
      targets: girl,
      y: GAME_H / 2 + 48,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Кнопка старта (мигающая)
    const startText = this.add.text(GAME_W / 2, GAME_H / 2 + 120, '▶  Нажми любую клавишу  ◀', {
      fontSize: '22px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    // Управление
    this.add.text(GAME_W / 2, GAME_H / 2 + 160, '⬅ ➡ — идти   ⬆ Пробел — прыжок   F — яблоко', {
      fontSize: '14px',
      fill: '#aaaaff'
    }).setOrigin(0.5);

    // Старт по любой клавише или клику
    const startGame = () => this.scene.start('Game', { level: 1, score: 0, lives: 3, apples: 5 });
    this.input.keyboard.once('keydown', startGame);
    this.input.once('pointerdown', startGame);
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

  // Moving platform
  const mpY      = rInt(125, 170);
  const mpRange  = rInt(160, 260);
  const mpCenter = rInt(200, GAME_W - 200);
  const mpMinX   = Math.max(60, mpCenter - Math.floor(mpRange / 2));
  const mpMaxX   = Math.min(GAME_W - 60, mpCenter + Math.floor(mpRange / 2));

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
      x: Math.round((mpMinX + mpMaxX) / 2),
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

    const restart = () => this.scene.start('Game', { level: 1, score: 0, lives: 3, apples: 5 });
    this.input.keyboard.once('keydown', restart);
    this.input.once('pointerdown', restart);
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
    // Следующий порог для получения жизни
    const prevMilestone = Math.floor(this.score / 50) * 50;
    this.nextLifeMilestone = prevMilestone + 50;
  }

  create() {
    const levelData = generateLevelData(this.currentLevel);

    // Фон
    this.add.image(GAME_W / 2, GAME_H / 2, 'background');

    // === Ночная тема (активируется в середине уровня) ===
    // Тёмный оверлей
    this.nightOverlay = this.add.graphics().setScrollFactor(0).setDepth(5).setAlpha(0);
    this.nightOverlay.fillStyle(0x05021a, 1);
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
      this.ground.create(x + 32, GAME_H - 16, 'ground').refreshBody();
    }

    // Платформы
    this.platforms = this.physics.add.staticGroup();
    levelData.platforms.forEach(p => {
      this.platforms.create(p.x, p.y, 'platform').refreshBody();
    });

    // Движущаяся платформа — статическое тело, позиция обновляется вручную
    const mpd = levelData.movingPlatform;
    this.movingPlatform = this.physics.add.staticImage(mpd.x, mpd.y, 'platform');
    this.movingPlatform.setTint(0xffdd88);
    this.movingPlatform._minX  = mpd.minX;
    this.movingPlatform._maxX  = mpd.maxX;
    this.movingPlatform._speed = mpd.speed;
    this.movingPlatform._dir   = 1;   // 1 = вправо, -1 = влево

    // Девочка
    this.girl = this.physics.add.sprite(100, GAME_H - 100, 'girl_idle');
    this.girl.setBounce(0.1);
    this.girl.setCollideWorldBounds(true);
    this.girl.body.setSize(28, 90);   // физическое тело чуть меньше картинки 80×100

    this.turtleSpeed   = levelData.turtleSpeed;
    this.hedgehogSpeed = levelData.hedgehogSpeed;

    // Черепашки
    this.turtles = this.physics.add.group();
    levelData.turtles.forEach(pos => {
      const t = this.turtles.create(pos.x, pos.y, 'turtle');
      t.setVelocityX(Phaser.Math.RND.pick([-this.turtleSpeed, this.turtleSpeed]));
      t.setBounceX(1);
      t.setCollideWorldBounds(true);
    });

    // Ёжики
    this.hedgehogs = this.physics.add.group();
    (levelData.hedgehogs || []).forEach(pos => {
      const h = this.hedgehogs.create(pos.x, pos.y, 'hedgehog');
      h.setVelocityX(Phaser.Math.RND.pick([-this.hedgehogSpeed, this.hedgehogSpeed]));
      h.setBounceX(1);
      h.setCollideWorldBounds(true);
    });

    // Капибары — бонусные существа, падают сверху
    this.capybaras = this.physics.add.group();

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

    this.physics.add.collider(this.girl,      this.movingPlatform);
    this.physics.add.collider(this.turtles,   this.movingPlatform);
    this.physics.add.collider(this.hedgehogs, this.movingPlatform);
    this.physics.add.collider(this.capybaras, this.movingPlatform);
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
    this.decorList = spawnGroundDecor(this);
    this._windTime = 0;

    // Первая капибара через 5 сек, потом каждые 8-14 сек
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
    const msg = this.add.text(GAME_W / 2, GAME_H / 2 - 70, '🌙 Наступает ночь...', {
      fontSize: '36px', fill: '#c8c8ff',
      stroke: '#00001a', strokeThickness: 6, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(12).setAlpha(0);
    this.tweens.add({
      targets: msg, alpha: 1, duration: 1000,
      yoyo: true, hold: 2000,
      onComplete: () => msg.destroy()
    });

    // Плавное затемнение за 10 секунд
    this.tweens.add({
      targets: this.nightOverlay,
      alpha: 0.58,
      duration: 10000,
      ease: 'Sine.easeInOut'
    });
    // Звёзды и луна появляются вместе с тьмой
    this.tweens.add({
      targets: [this.nightStars, this.nightMoon],
      alpha: 1,
      duration: 10000,
      ease: 'Sine.easeInOut'
    });
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

    const kind = type || (Phaser.Math.RND.frac() < 0.55 ? 'turtle' : 'hedgehog');
    const x = Phaser.Math.Between(60, GAME_W - 60);

    if (kind === 'turtle') {
      const t = this.turtles.create(x, -20, 'turtle');
      const spd = this.turtleSpeed;
      t.setVelocityX(Phaser.Math.RND.pick([-spd, spd]));
      t.setBounceX(1);
      t.setCollideWorldBounds(true);
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
    const capy = this.capybaras.create(x, -20, 'capybara');
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

  collectCapybara(capy) {
    if (capy._walkTimer) capy._walkTimer.remove();
    capy.destroy();

    this.score += 20;
    this.scoreText.setText('Очки: ' + this.score);

    const pop = this.add.text(capy.x, capy.y - 20, '🦫 +20', {
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
    this.score += 10;
    this.scoreText.setText('Очки: ' + this.score);

    const boom = this.add.text(enemy.x, enemy.y - 20, '✨+10', {
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

    const overlay = this.add.graphics().setScrollFactor(0);
    overlay.fillStyle(0x000000, 0.55);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    this.add.text(GAME_W / 2, GAME_H / 2 - 50, '💔 Игра окончена', {
      fontSize: '40px', fill: '#ff4466', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_W / 2, GAME_H / 2 + 10, `Очки: ${this.score}`, {
      fontSize: '26px', fill: '#fff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    const btn = this.add.text(GAME_W / 2, GAME_H / 2 + 65, '▶  ENTER — начать заново  ◀', {
      fontSize: '20px', fill: '#fff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);
    this.tweens.add({ targets: btn, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown', () => {
      this.scene.start('Game', { level: 1, score: 0, lives: 3, apples: 5 });
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

    // Движущаяся платформа — двигаем вручную, refreshBody() обновляет коллайдер
    const mp = this.movingPlatform;
    const mpVel = mp._speed * mp._dir;
    mp.x += mpVel * dt;
    if (mp.x >= mp._maxX) { mp.x = mp._maxX; mp._dir = -1; }
    if (mp.x <= mp._minX) { mp.x = mp._minX; mp._dir =  1; }
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

    // Двигаем облака
    this.cloudList.forEach(cloud => {
      cloud.x += cloud._cloudSpeed * dt;
      if (cloud.x > GAME_W + cloud._cloudW) {
        cloud.x = -cloud._cloudW;
        cloud.y = Phaser.Math.Between(30, 110);
      }
    });

    // Покачивание травы и цветов от ветра
    this._windTime += dt;
    // Порыв ветра — плавно меняет силу
    const windStrength = 5 + 3 * Math.sin(this._windTime * 0.4);
    this.decorList.forEach(d => {
      d.img.angle = windStrength * Math.sin(this._windTime * d.speed + d.phase);
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
  scene: [BootScene, MenuScene, GameScene, LevelCompleteScene, VictoryScene]
};

const game = new Phaser.Game(config);
