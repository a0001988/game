// script.js

// Select DOM elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game variables
let score = 0;
let maxScore = 50; // Maximum score before the boss spawns or game ends
let player1 = { 
  x: 300, y: 500, width: 50, height: 50, speed: 5, color: 'blue', health: 100,
  grenadeCooldown: 0 // Cooldown for grenades
};
let player2 = { 
  x: 500, y: 500, width: 50, height: 50, speed: 5, color: 'orange', health: 100,
  grenadeCooldown: 0 // Cooldown for grenades
};
let keys = {};
let enemies = [];
let bullets = [];
let grenades = []; // Array to store grenades
let drones = []; // Array to store active drones
let explosions = []; // Array to store explosion effects
let boss = null; // Boss object
const BOSS_SPAWN_SCORE = 10; // Score required to spawn the boss
const GRENADE_COOLDOWN = 60; // Frames between grenade throws
const EXPLOSION_RADIUS = 50; // Radius of grenade explosion

// Event listeners for player movement
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Update game state
function update() {
  // Move player 1 (WASD controls)
  if (keys['a'] && player1.x > 0) player1.x -= player1.speed;
  if (keys['d'] && player1.x + player1.width < canvas.width) player1.x += player1.speed;
  if (keys['w'] && player1.y > 0) player1.y -= player1.speed;
  if (keys['s'] && player1.y + player1.height < canvas.height) player1.y += player1.speed;

  // Move player 2 (Arrow keys)
  if (keys['ArrowLeft'] && player2.x > 0) player2.x -= player2.speed;
  if (keys['ArrowRight'] && player2.x + player2.width < canvas.width) player2.x += player2.speed;
  if (keys['ArrowUp'] && player2.y > 0) player2.y -= player2.speed;
  if (keys['ArrowDown'] && player2.y + player2.height < canvas.height) player2.y += player2.speed;

  // Spawn enemies
  if (Math.random() < 0.02 && !boss) { // Stop spawning enemies when boss appears
    enemies.push({
      x: Math.random() * (canvas.width - 50),
      y: 0,
      width: 50,
      height: 50,
      speed: 2 + Math.random() * 3,
    });
  }

  // Spawn drones (power-ups)
  if (Math.random() < 0.01) { // Low chance to spawn a drone
    drones.push({
      x: Math.random() * (canvas.width - 30),
      y: 0,
      width: 30,
      height: 30,
      speed: 2,
      health: 3, // Drones have limited health
    });
  }

  // Spawn boss when score threshold is reached
  if (!boss && score >= BOSS_SPAWN_SCORE) {
    boss = {
      x: canvas.width / 2 - 100,
      y: 50,
      width: 200,
      height: 100,
      speed: 2,
      health: 10, // Boss has more health
      direction: 1, // 1 for right, -1 for left
      shootTimer: 0, // Timer for shooting
      shootInterval: 60, // Shoot every 60 frames
    };
  }

  // Move enemies
  enemies.forEach((enemy, index) => {
    enemy.y += enemy.speed;
    if (enemy.y > canvas.height) {
      enemies.splice(index, 1); // Remove off-screen enemies
    }
  });

  // Move grenades
  grenades.forEach((grenade, gIndex) => {
    grenade.x += grenade.dx; // Horizontal movement
    grenade.y += grenade.dy; // Vertical movement
    grenade.dy += 0.5; // Simulate gravity

    // Remove grenade if it goes off-screen
    if (grenade.y > canvas.height || grenade.x < 0 || grenade.x > canvas.width) {
      grenades.splice(gIndex, 1);
    }
  });

  // Handle grenade explosions
  grenades.forEach((grenade, gIndex) => {
    // Check if grenade hits ground or enemy
    if (grenade.y + 10 >= canvas.height || checkGrenadeCollision(grenade)) {
      explosions.push({ x: grenade.x - EXPLOSION_RADIUS / 2, y: grenade.y - EXPLOSION_RADIUS / 2, timer: 20 });
      grenades.splice(gIndex, 1); // Remove grenade
    }
  });

  // Move explosions
  explosions.forEach((explosion, eIndex) => {
    explosion.timer--;
    if (explosion.timer <= 0) {
      explosions.splice(eIndex, 1); // Remove explosion after timer expires
    }
  });

  // Move drones
  drones.forEach((drone, index) => {
    drone.y += drone.speed; // Drones move down until they reach the player
    if (drone.y > player1.y - 50 || drone.y > player2.y - 50) {
      drone.y = Math.min(player1.y, player2.y) - 50; // Stop moving once they reach the players' level
    }

    // Drone shooting logic
    if (Math.random() < 0.02) { // Low chance for drones to shoot
      bullets.push({ 
        x: drone.x + drone.width / 2 - 2.5, 
        y: drone.y, 
        dy: -7, 
        source: 'drone' 
      });
    }

    // Remove drones with no health
    if (drone.health <= 0) {
      drones.splice(index, 1);
    }
  });

  // Boss behavior
  if (boss) {
    // Move boss horizontally
    boss.x += boss.speed * boss.direction;
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
      boss.direction *= -1; // Reverse direction
    }

    // Boss shooting logic
    boss.shootTimer++;
    if (boss.shootTimer >= boss.shootInterval) {
      boss.shootTimer = 0;
      // Shoot multiple bullets in a spread pattern
      for (let i = -2; i <= 2; i++) {
        bullets.push({ 
          x: boss.x + boss.width / 2 - 2.5, 
          y: boss.y + boss.height, 
          dx: i, 
          dy: 5, 
          source: 'boss' 
        });
      }
    }

    // Update bullet positions for boss bullets
    bullets.forEach((bullet) => {
      if (bullet.dx !== undefined && bullet.dy !== undefined) {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
      }
    });
  }

  // Check for collisions
  for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
    const bullet = bullets[bIndex];

    // Bullet-enemy collision
    for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
      const enemy = enemies[eIndex];
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + 5 > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + 10 > enemy.y
      ) {
        bullets.splice(bIndex, 1); // Remove the bullet
        enemies.splice(eIndex, 1); // Remove the enemy
        score++; // Increase the score
        scoreElement.textContent = score; // Update the score display
        break; // Exit the inner loop after a collision
      }
    }

    // Bullet-drone collision
    for (let dIndex = drones.length - 1; dIndex >= 0; dIndex--) {
      const drone = drones[dIndex];
      if (
        bullet.x < drone.x + drone.width &&
        bullet.x + 5 > drone.x &&
        bullet.y < drone.y + drone.height &&
        bullet.y + 10 > drone.y
      ) {
        bullets.splice(bIndex, 1); // Remove the bullet
        drone.health--; // Reduce drone health
        if (drone.health <= 0) {
          drones.splice(dIndex, 1); // Remove the drone
        }
        break; // Exit the inner loop after a collision
      }
    }

    // Bullet-boss collision
    if (boss) {
      if (
        bullet.x < boss.x + boss.width &&
        bullet.x + 5 > boss.x &&
        bullet.y < boss.y + boss.height &&
        bullet.y + 10 > boss.y
      ) {
        bullets.splice(bIndex, 1); // Remove the bullet
        boss.health--; // Reduce boss health
        if (boss.health <= 0) {
          boss = null; // Remove boss when defeated
          score += 10; // Bonus points for defeating the boss
          scoreElement.textContent = score; // Update the score display
        }
        break; // Exit the inner loop after a collision
      }
    }

    // Bullet-player collision
    if (bullet.source !== 'player1' && bullet.source !== 'player2') { // Only enemy bullets can damage players
      if (
        bullet.x < player1.x + player1.width &&
        bullet.x + 5 > player1.x &&
        bullet.y < player1.y + player1.height &&
        bullet.y + 10 > player1.y
      ) {
        bullets.splice(bIndex, 1); // Remove the bullet
        player1.health -= 10; // Reduce player1's health
        if (player1.health <= 0) {
          alert("Player 1 has been defeated!");
          player1.health = 0; // Ensure health doesn't go negative
        }
      }

      if (
        bullet.x < player2.x + player2.width &&
        bullet.x + 5 > player2.x &&
        bullet.y < player2.y + player2.height &&
        bullet.y + 10 > player2.y
      ) {
        bullets.splice(bIndex, 1); // Remove the bullet
        player2.health -= 10; // Reduce player2's health
        if (player2.health <= 0) {
          alert("Player 2 has been defeated!");
          player2.health = 0; // Ensure health doesn't go negative
        }
      }
    }
  }

  // Decrement grenade cooldowns
  if (player1.grenadeCooldown > 0) player1.grenadeCooldown--;
  if (player2.grenadeCooldown > 0) player2.grenadeCooldown--;
}

// Helper function to check grenade collisions
function checkGrenadeCollision(grenade) {
  // Check collision with enemies
  for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
    const enemy = enemies[eIndex];
    if (
      grenade.x < enemy.x + enemy.width &&
      grenade.x + 10 > enemy.x &&
      grenade.y < enemy.y + enemy.height &&
      grenade.y + 10 > enemy.y
    ) {
      enemies.splice(eIndex, 1); // Remove enemy
      score++; // Increase score
      scoreElement.textContent = score; // Update score display
      return true; // Collision detected
    }
  }
  return false; // No collision
}

// Draw everything on the canvas
function draw() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw score bar
  ctx.fillStyle = 'black';
  ctx.fillRect(10, 10, 200, 20); // Background of the score bar
  ctx.fillStyle = 'green';
  const scoreBarWidth = (score / maxScore) * 200; // Calculate progress based on score
  ctx.fillRect(10, 10, scoreBarWidth, 20); // Fill the score bar

  // Draw player 1
  ctx.fillStyle = player1.color;
  ctx.fillRect(player1.x, player1.y, player1.width, player1.height);

  // Draw player 1 health bar
  ctx.fillStyle = 'black';
  ctx.fillRect(player1.x, player1.y - 10, player1.width, 5); // Background of the health bar
  ctx.fillStyle = player1.health > 50 ? 'green' : player1.health > 20 ? 'yellow' : 'red';
  ctx.fillRect(player1.x, player1.y - 10, (player1.health / 100) * player1.width, 5); // Fill the health bar

  // Draw player 2
  ctx.fillStyle = player2.color;
  ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

  // Draw player 2 health bar
  ctx.fillStyle = 'black';
  ctx.fillRect(player2.x, player2.y - 10, player2.width, 5); // Background of the health bar
  ctx.fillStyle = player2.health > 50 ? 'green' : player2.health > 20 ? 'yellow' : 'red';
  ctx.fillRect(player2.x, player2.y - 10, (player2.health / 100) * player2.width, 5); // Fill the health bar

  // Draw enemies
  ctx.fillStyle = 'red';
  enemies.forEach((enemy) => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Draw bullets
  ctx.fillStyle = 'yellow';
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, 5, 10);
  });

  // Draw grenades
  ctx.fillStyle = 'gray';
  grenades.forEach((grenade) => {
    ctx.beginPath();
    ctx.arc(grenade.x, grenade.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw explosions
  ctx.fillStyle = 'orange';
  explosions.forEach((explosion) => {
    ctx.beginPath();
    ctx.arc(explosion.x + EXPLOSION_RADIUS / 2, explosion.y + EXPLOSION_RADIUS / 2, EXPLOSION_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw drones
  ctx.fillStyle = 'green';
  drones.forEach((drone) => {
    ctx.fillRect(drone.x, drone.y, drone.width, drone.height);
  });

  // Draw boss
  if (boss) {
    ctx.fillStyle = 'purple';
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

    // Draw boss health bar
    ctx.fillStyle = 'white';
    ctx.fillRect(boss.x, boss.y - 10, boss.width, 5);
    ctx.fillStyle = 'green';
    ctx.fillRect(boss.x, boss.y - 10, (boss.health / 10) * boss.width, 5);
  }
}

// Handle shooting
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && player1.grenadeCooldown
