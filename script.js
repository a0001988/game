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
let player = { x: 400, y: 500, width: 50, height: 50, speed: 5 };
let keys = {};
let enemies = [];
let bullets = [];
let drones = []; // Array to store active drones

// Event listeners for player movement
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Update game state
function update() {
  // Move player
  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += player.speed;

  // Spawn enemies
  if (Math.random() < 0.02) {
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

  // Move enemies
  enemies.forEach((enemy, index) => {
    enemy.y += enemy.speed;
    if (enemy.y > canvas.height) {
      enemies.splice(index, 1); // Remove off-screen enemies
    }
  });

  // Move bullets
  bullets.forEach((bullet, index) => {
    bullet.y -= 7;
    if (bullet.y < 0) {
      bullets.splice(index, 1); // Remove off-screen bullets
    }
  });

  // Move drones
  drones.forEach((drone, index) => {
    drone.y += drone.speed; // Drones move down until they reach the player
    if (drone.y > player.y - 50) {
      drone.y = player.y - 50; // Stop moving once they reach the player's level
    }

    // Drone shooting logic
    if (Math.random() < 0.02) { // Low chance for drones to shoot
      bullets.push({ x: drone.x + drone.width / 2 - 2.5, y: drone.y });
    }

    // Remove drones with no health
    if (drone.health <= 0) {
      drones.splice(index, 1);
    }
  });

  // Check for collisions
  bullets.forEach((bullet, bIndex) => {
    // Bullet-enemy collision
    enemies.forEach((enemy, eIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + 5 > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + 10 > enemy.y
      ) {
        bullets.splice(bIndex, 1);
        enemies.splice(eIndex, 1);
        score++;
        scoreElement.textContent = score;
      }
    });
    drones.forEach((drone, dIndex) => {
      if (
        bullet.x < drone.x + drone.width &&
        bullet.x + 5 > drone.x &&
        bullet.y < drone.y + drone.height &&
        bullet.y + 10 > drone.y
      ) {
        bullets.splice(bIndex, 1);
        drone.health--;
      }
    // Bullet-drone collision (enemies can damage drones)

    });
  });
}

// Draw everything on the canvas
function draw() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.fillStyle = 'blue';
  ctx.fillRect(player.x, player.y, player.width, player.height);

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

  // Draw drones
  ctx.fillStyle = 'green';
  drones.forEach((drone) => {
    ctx.fillRect(drone.x, drone.y, drone.width, drone.height);
  });
}

// Handle shooting
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y });
  }
});

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
