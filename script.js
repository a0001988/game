// script.js

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game variables
let player1, player2, enemies, bullets, rockets, score, gameOver;
let keysPressed = {}; // Tracks which keys are currently pressed
let shootCooldown = {}; // Tracks cooldown for shooting bullets
let rocketCharges = { player1: 3, player2: 3 }; // Rocket charges for each player
let rocketCooldown = {}; // Tracks cooldown for firing rockets
let boss = null; // Boss object
let bossHealth = 100; // Boss health
let enemiesKilled = 0; // Track number of enemies killed to spawn the boss
let powerUps = []; // Array to store power-ups
let drone = null; // Drone object
let invincible = false; // Temporary invincibility flag
let swordCooldown = { player1: false, player2: false }; // Sword cooldown

// Initialize game
function init() {
  player1 = { x: 100, y: canvas.height - 50, width: 40, height: 20, color: 'blue', speed: 7 };
  player2 = { x: canvas.width - 140, y: canvas.height - 50, width: 40, height: 20, color: 'green', speed: 7 };
  enemies = [];
  bullets = [];
  rockets = [];
  score = 0;
  gameOver = false;
  keysPressed = {};
  shootCooldown = { w: false, ArrowUp: false };
  rocketCharges = { player1: 3, player2: 3 };
  rocketCooldown = { s: false, ArrowDown: false };
  boss = null; // Reset boss
  bossHealth = 100; // Reset boss health
  enemiesKilled = 0; // Reset enemy kill count
  powerUps = []; // Reset power-ups
  drone = null; // Reset drone
  invincible = false; // Reset invincibility
  swordCooldown = { player1: false, player2: false }; // Reset sword cooldown

  // Spawn enemies every second
  setInterval(() => {
    if (!gameOver && !boss) {
      spawnEnemy();
    }
  }, 1000);

  // Spawn power-ups every 15 seconds
  setInterval(() => {
    if (!gameOver) {
      spawnPowerUp();
    }
  }, 15000);
}

// Spawn enemy
function spawnEnemy() {
  const x = Math.random() * (canvas.width - 40);
  enemies.push({ x, y: 0, width: 40, height: 40, color: 'red', speed: 2 });
}

// Spawn boss
function spawnBoss() {
  boss = {
    x: canvas.width / 2 - 50,
    y: 50,
    width: 100,
    height: 50,
    color: 'purple',
    speed: 2,
    direction: 1, // 1 = right, -1 = left
    health: bossHealth,
    projectiles: [],
  };

  // Boss shoots projectiles every 2 seconds
  setInterval(() => {
    if (boss) {
      const projectileSpeed = 4;
      boss.projectiles.push({
        x: boss.x + boss.width / 2 - 5,
        y: boss.y + boss.height,
        width: 10,
        height: 10,
        speed: projectileSpeed,
      });
    }
  }, 2000);
}

// Spawn power-up
function spawnPowerUp() {
  const types = ['drone', 'rocket-refill', 'health-boost'];
  const type = types[Math.floor(Math.random() * types.length)];
  const x = Math.random() * (canvas.width - 40);
  const y = Math.random() * (canvas.height - 200); // Avoid spawning near the top
  powerUps.push({ x, y, width: 40, height: 40, type, color: getPowerUpColor(type), lifetime: 10000 }); // 10-second lifetime
}

// Get power-up color based on type
function getPowerUpColor(type) {
  switch (type) {
    case 'drone':
      return 'cyan';
    case 'rocket-refill':
      return 'yellow';
    case 'health-boost':
      return 'green';
    default:
      return 'white';
  }
}

// Track key presses
document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  keysPressed[e.key] = true;

  // Handle shooting bullets with cooldown
  if (e.key === 'w' && !shootCooldown['w']) {
    bullets.push({ x: player1.x + player1.width / 2 - 5, y: player1.y, width: 10, height: 10, speed: 7 });
    shootCooldown['w'] = true;
    setTimeout(() => (shootCooldown['w'] = false), 200);
  }

  if (e.key === 'ArrowUp' && !shootCooldown['ArrowUp']) {
    bullets.push({ x: player2.x + player2.width / 2 - 5, y: player2.y, width: 10, height: 10, speed: 7 });
    shootCooldown['ArrowUp'] = true;
    setTimeout(() => (shootCooldown['ArrowUp'] = false), 200);
  }

  // Handle firing rockets with cooldown and charges
  if (e.key === 's' && !rocketCooldown['s'] && rocketCharges.player1 > 0) {
    rockets.push({ x: player1.x + player1.width / 2 - 10, y: player1.y, width: 20, height: 20, speed: 5, owner: 'player1' });
    rocketCharges.player1--;
    rocketCooldown['s'] = true;
    setTimeout(() => (rocketCooldown['s'] = false), 500);
  }

  if (e.key === 'ArrowDown' && !rocketCooldown['ArrowDown'] && rocketCharges.player2 > 0) {
    rockets.push({ x: player2.x + player2.width / 2 - 10, y: player2.y, width: 20, height: 20, speed: 5, owner: 'player2' });
    rocketCharges.player2--;
    rocketCooldown['ArrowDown'] = true;
    setTimeout(() => (rocketCooldown['ArrowDown'] = false), 500);
  }

  // Handle sword activation
  if (e.key === 'q' && !swordCooldown.player1) {
    useSword(player1);
    swordCooldown.player1 = true;
    setTimeout(() => (swordCooldown.player1 = false), 1000); // Cooldown for 1 second
  }

  if (keysPressed['ArrowLeft'] && keysPressed['ArrowDown'] && !swordCooldown.player2) {
    useSword(player2);
    swordCooldown.player2 = true;
    setTimeout(() => (swordCooldown.player2 = false), 1000); // Cooldown for 1 second
  }
});

// Track key releases
document.addEventListener('keyup', (e) => {
  if (gameOver) return;
  keysPressed[e.key] = false;
});

// Restart game
document.getElementById('restart-button').addEventListener('click', () => {
  // Clear all intervals to prevent memory leaks
  for (let i = 1; i < 9999; i++) window.clearInterval(i);

  // Reinitialize the game
  init();
});

// Update player positions based on keys pressed
function updatePlayers() {
  if (keysPressed['a']) player1.x -= player1.speed;
  if (keysPressed['d']) player1.x += player1.speed;
  if (keysPressed['ArrowLeft']) player2.x -= player2.speed;
  if (keysPressed['ArrowRight']) player2.x += player2.speed;

  player1.x = Math.max(0, Math.min(canvas.width - player1.width, player1.x));
  player2.x = Math.max(0, Math.min(canvas.width - player2.width, player2.x));
}

// Use sword
function useSword(player) {
  const swordHitbox = {
    x: player.x + (player === player1 ? player.width : -40), // Offset based on player
    y: player.y,
    width: 40,
    height: 20,
    color: 'gold',
  };

  // Check collisions with enemies
  enemies.forEach((enemy, enemyIndex) => {
    if (
      swordHitbox.x < enemy.x + enemy.width &&
      swordHitbox.x + swordHitbox.width > enemy.x &&
      swordHitbox.y < enemy.y + enemy.height &&
      swordHitbox.y + swordHitbox.height > enemy.y
    ) {
      enemies.splice(enemyIndex, 1);
      score += 10;
      enemiesKilled++;
    }
  });

  // Check collisions with boss
  if (boss) {
    if (
      swordHitbox.x < boss.x + boss.width &&
      swordHitbox.x + swordHitbox.width > boss.x &&
      swordHitbox.y < boss.y + boss.height &&
      swordHitbox.y + swordHitbox.height > boss.y
    ) {
      boss.health -= 20; // Deal significant damage to the boss
    }
  }

  // Draw the sword hitbox briefly
  drawRect(swordHitbox);
}

// Game loop
function gameLoop() {
  if (gameOver) resetGame();

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update players
  updatePlayers();

  // Draw players
  drawRect(player1);
  drawRect(player2);

  // Update and draw bullets
  updateBullets();
  drawBullets();

  // Update and draw rockets
  updateRockets();
  drawRockets();

  // Update and draw enemies
  updateEnemies();
  drawEnemies();

  // Update and draw boss
  if (boss) {
    updateBoss();
    drawBoss();
  }

  // Update and draw drone
  if (drone) {
    updateDrone();
    drawDrone();
  }

  // Update and draw power-ups
  updatePowerUps();
  drawPowerUps();

  // Check collisions
  checkCollisions();

  // Draw score, rocket charges, and boss health
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Player 1 Rockets: ${rocketCharges.player1}`, 10, 50);
  ctx.fillText(`Player 2 Rockets: ${rocketCharges.player2}`, canvas.width - 200, 50);
  if (boss) {
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 70, boss.health * 2, 20); // Health bar
    ctx.fillStyle = '#fff';
    ctx.strokeRect(10, 70, 200, 20);
    ctx.fillText(`Boss Health: ${boss.health}`, 10, 65);
  }

  requestAnimationFrame(gameLoop);
}

// Draw rectangle
function drawRect(obj) {
  ctx.fillStyle = obj.color || 'white';
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
}

// Update bullets
function updateBullets() {
  bullets = bullets.filter((bullet) => bullet.y > 0);
  bullets.forEach((bullet) => (bullet.y -= bullet.speed));
}

// Draw bullets
function drawBullets() {
  bullets.forEach((bullet) => drawRect(bullet));
}

// Update rockets
function updateRockets() {
  rockets = rockets.filter((rocket) => rocket.y > 0);
  rockets.forEach((rocket) => (rocket.y -= rocket.speed));
}

// Draw rockets
function drawRockets() {
  rockets.forEach((rocket) => drawRect({ ...rocket, color: 'orange' }));
}

// Update enemies
function updateEnemies() {
  enemies.forEach((enemy) => (enemy.y += enemy.speed));
  enemies = enemies.filter((enemy) => enemy.y < canvas.height);
}

// Draw enemies
function drawEnemies() {
  enemies.forEach((enemy) => drawRect(enemy));
}

// Update boss
function updateBoss() {
  // Move boss horizontally
  boss.x += boss.speed * boss.direction;
  if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
    boss.direction *= -1; // Reverse direction
  }

  // Update boss projectiles
  boss.projectiles.forEach((projectile) => (projectile.y += projectile.speed));
  boss.projectiles = boss.projectiles.filter((projectile) => projectile.y < canvas.height);
}

// Draw boss
function drawBoss() {
  drawRect(boss);
  boss.projectiles.forEach((projectile) => drawRect({ ...projectile, color: 'yellow' }));
}

// Update drone
function updateDrone() {
  // Follow Player 1
  drone.x = player1.x;
  drone.y = player1.y - 50;

  // Shoot bullets automatically every 1 second
  if (drone.lastShot === undefined || Date.now() - drone.lastShot > 1000) {
    bullets.push({ x: drone.x + drone.width / 2 - 5, y: drone.y, width: 10, height: 10, speed: 7 });
    drone.lastShot = Date.now();
  }
}

// Draw drone
function drawDrone() {
  drawRect({ ...drone, color: 'cyan' });
}

// Update power-ups
function updatePowerUps() {
  powerUps.forEach((powerUp) => {
    powerUp.lifetime -= 16; // Reduce lifetime (16ms per frame)
  });

  // Remove expired power-ups
  powerUps = powerUps.filter((powerUp) => powerUp.lifetime > 0);
}

// Draw power-ups
function drawPowerUps() {
  powerUps.forEach((powerUp) => drawRect(powerUp));
}

// Check collisions
function checkCollisions() {
  // Bullet collisions with enemies
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        bullets.splice(bulletIndex, 1);
        enemies.splice(enemyIndex, 1);
        score += 10;
        enemiesKilled++;

        // Refresh rocket charges
        if (rocketCharges.player1 < 3) rocketCharges.player1++;
        if (rocketCharges.player2 < 3) rocketCharges.player2++;

        // Spawn boss after 10 enemies are killed
        if (enemiesKilled >= 10 && !boss) {
          spawnBoss();
        }
      }
    });
  });

  // Rocket collisions with enemies
  rockets.forEach((rocket, rocketIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (
        rocket.x < enemy.x + enemy.width &&
        rocket.x + rocket.width > enemy.x &&
        rocket.y < enemy.y + enemy.height &&
        rocket.y + rocket.height > enemy.y
      ) {
        rockets.splice(rocketIndex, 1);
        enemies = enemies.filter((e) => {
          const dx = e.x - rocket.x;
          const dy = e.y - rocket.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance > 100;
        });
        score += 50;
      }
    });
  });

  // Bullet/rocket collisions with boss
  if (boss) {
    bullets.forEach((bullet, bulletIndex) => {
      if (
        bullet.x < boss.x + boss.width &&
        bullet.x + bullet.width > boss.x &&
        bullet.y < boss.y + boss.height &&
        bullet.y + bullet.height > boss.y
      ) {
        bullets.splice(bulletIndex, 1);
        boss.health -= 5;
      }
    });

    rockets.forEach((rocket, rocketIndex) => {
      if (
        rocket.x < boss.x + boss.width &&
        rocket.x + rocket.width > boss.x &&
        rocket.y < boss.y + boss.height &&
        rocket.y + rocket.height > boss.y
      ) {
        rockets.splice(rocketIndex, 1);
        boss.health -= 20;
      }
    });

    // Check if boss is defeated
    if (boss.health <= 0) {
      boss = null;
      bossHealth = 100;
      enemiesKilled = 0;
      score += 500;
    }
  }

  // Check if any enemy or boss projectile hits a player
  const allProjectiles = boss ? boss.projectiles : [];
  allProjectiles.forEach((projectile) => {
    if (!invincible && (
      (projectile.x < player1.x + player1.width &&
        projectile.x + projectile.width > player1.x &&
        projectile.y < player1.y + player1.height &&
        projectile.y + projectile.height > player1.y) ||
      (projectile.x < player2.x + player2.width &&
        projectile.x + projectile.width > player2.x &&
        projectile.y < player2.y + player2.height &&
        projectile.y + projectile.height > player2.y)
    )) {
      gameOver = true;
      ctx.fillStyle = 'red';
      ctx.font = '40px Arial';
      ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
    }
  });

  // Check if any enemy hits a player
  enemies.forEach((enemy) => {
    if (!invincible && (
      (enemy.x < player1.x + player1.width &&
        enemy.x + enemy.width > player1.x &&
        enemy.y < player1.y + player1.height &&
        enemy.y + enemy.height > player1.y) ||
      (enemy.x < player2.x + player2.width &&
        enemy.x + enemy.width > player2.x &&
        enemy.y < player2.y + player2.height &&
        enemy.y + enemy.height > player2.y)
    )) {
      gameOver = true;
      ctx.fillStyle = 'red';
      ctx.font = '40px Arial';
      ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
    }
  });

  // Check if player collects power-up
  powerUps.forEach((powerUp, powerUpIndex) => {
    if (
      (powerUp.x < player1.x + player1.width &&
        powerUp.x + powerUp.width > player1.x &&
        powerUp.y < player1.y + player1.height &&
        powerUp.y + powerUp.height > player1.y) ||
      (powerUp.x < player2.x + player2.width &&
        powerUp.x + powerUp.width > player2.x &&
        powerUp.y < player2.y + player2.height &&
        powerUp.y + powerUp.height > player2.y)
    ) {
      // Apply power-up effect
      switch (powerUp.type) {
        case 'drone':
          drone = { x: player1.x, y: player1.y - 50, width: 40, height: 20, color: 'cyan', lastShot: 0 };
          break;
        case 'rocket-refill':
          if (rocketCharges.player1 < 3) rocketCharges.player1++;
          if (rocketCharges.player2 < 3) rocketCharges.player2++;
          break;
        case 'health-boost':
          invincible = true;
          setTimeout(() => (invincible = false), 5000); // 5 seconds of invincibility
          break;
      }

      // Remove power-up
      powerUps.splice(powerUpIndex, 1);
    }
  });
}

// Select the restart button
const restartButton = document.getElementById('restart-button');

// Add an event listener to the restart button
restartButton.addEventListener('click', () => {
  // Clear all intervals to prevent memory leaks
  for (let i = 1; i < 9999; i++) window.clearInterval(i);

  // Reset the game
  resetGame();
});

// Function to reset the game
function resetGame() {
  // Reset game variables
  player1 = { x: 100, y: canvas.height - 50, width: 40, height: 20, color: 'blue', speed: 7 };
  player2 = { x: canvas.width - 140, y: canvas.height - 50, width: 40, height: 20, color: 'green', speed: 7 };
  enemies = [];
  bullets = [];
  rockets = [];
  score = 0;
  gameOver = false;
  keysPressed = {};
  shootCooldown = { w: false, ArrowUp: false };
  rocketCharges = { player1: 3, player2: 3 };
  rocketCooldown = { s: false, ArrowDown: false };
  boss = null; // Reset boss
  bossHealth = 100; // Reset boss health
  enemiesKilled = 0; // Reset enemy kill count
  powerUps = []; // Reset power-ups
  drone = null; // Reset drone
  invincible = false; // Reset invincibility
  swordCooldown = { player1: false, player2: false }; // Reset sword cooldown

  // Reinitialize the game
  init();
}

// Start game
init();
gameLoop();
