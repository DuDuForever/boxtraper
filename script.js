const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200; 
canvas.height = 700;

const grid = 20;
let count = 0;
let snake = { x: 160, y: 160 };
let direction = { x: grid, y: 0 };
let food = { x: 320, y: 320 };
let score = 0;
let highScore = 0;
let particles = [];
let gameOver = false;
let enemies = [];
let foodEaten = 0;
const MAX_ENEMIES = 22;
let shooting = false;
let explosionRadius = 0;
let powers = 0;
let powerDuration = 5000;  // 5 seconds duration
let explosionActive = false;
let powerActivated = false;  // Flag to indicate if power is activated
let lastPowerActivationTime = 0;  // Track when power was activated
let lastFoodTime = Date.now(); // Time when food was last eaten

const POWER_MAX = 6; // Max power-ups

// Sound effects
const foodArrivalSound = document.getElementById('foodArrivalSound');
const foodEatenSound = document.getElementById('foodEatenSound');
const enemyKilledSound = document.getElementById('enemyKilledSound');
const vibrationSound = document.getElementById('vibrationSound');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function resetFood() {
    food.x = getRandomInt(0, canvas.width / grid) * grid;
    food.y = getRandomInt(0, canvas.height / grid) * grid;
    lastFoodTime = Date.now(); // Reset food timer
    foodArrivalSound.play(); // Play food arrival sound
}

function createParticles(x, y, color) {
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            color: color,
            life: 30
        });
    }
}

function updateParticles() {
    particles.forEach((particle, index) => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life--;

        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, 4, 4);
    });
}

function updateScore(points) {
    score += points;
    if (score > highScore) {
        highScore = score;
        document.getElementById('highScoreValue').innerText = highScore;
    }
    foodEaten += points;  // Increment food eaten by the points (which is 1 in this case)

    if (foodEaten % 2 === 0) {
        let enemiesToSpawn = Math.min(Math.floor(foodEaten / 2), 22) - enemies.length;

        if (enemiesToSpawn > 0) {
            spawnEnemies(enemiesToSpawn);
        }
    }
}

function spawnEnemies(count) {
    if (enemies.length >= MAX_ENEMIES) return;  // Prevent spawning if already at max

    for (let i = 0; i < count; i++) {
        if (enemies.length >= MAX_ENEMIES) break;  // Stop spawning if limit reached
        
        const side = getRandomInt(0, 4);
        let x, y;
        if (side === 0) {
            x = getRandomInt(0, canvas.width / grid) * grid;
            y = -grid;
        } else if (side === 1) {
            x = canvas.width;
            y = getRandomInt(0, canvas.height / grid) * grid;
        } else if (side === 2) {
            x = getRandomInt(0, canvas.width / grid) * grid;
            y = canvas.height;
        } else {
            x = -grid;
            y = getRandomInt(0, canvas.height / grid) * grid;
        }
        enemies.push({ x, y, direction: { x: 0, y: 0 }, speed: 2 });  // Increased speed
    }
}

function drawPowers() {
    for (let i = 0; i < Math.min(powers, POWER_MAX); i++) {
        ctx.fillStyle = 'yellow'; // Change color as desired
        ctx.beginPath();
        ctx.arc(canvas.width - (i + 1) * 25, 25, 10, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawTimers() {
    const now = Date.now();
    
    // Power timer
    const powerElapsed = now - lastPowerActivationTime;
    const powerRemaining = powerDuration - powerElapsed;
    const powerSeconds = Math.max(0, Math.floor(powerRemaining / 1000));
    
    // Draw power timer line
    const powerRatio = powerRemaining / powerDuration;
    ctx.fillStyle = powerRatio > 0.2 ? 'lime' : 'red';
    ctx.fillRect(0, 0, canvas.width * powerRatio, 5); // Top of the canvas

    document.getElementById('powerTime').innerText = powerSeconds;
    
    // Food timer
    const foodElapsed = now - lastFoodTime;
    const foodRemaining = 10000 - foodElapsed;
    const foodSeconds = Math.max(0, Math.floor(foodRemaining / 1000));

    // Draw food timer line
    const foodRatio = foodRemaining / 10000;
    ctx.fillStyle = foodRatio > 0.2 ? 'lime' : 'red';
    ctx.fillRect(0, canvas.height - 5, canvas.width * foodRatio, 5); // Bottom of the canvas

    document.getElementById('foodTime').innerText = foodSeconds;
}

function createVibrationEffect(dx, dy) {
    const vibrationDuration = 300; // milliseconds
    const vibrationIntensity = 10; // pixels

    const startTime = Date.now();
    const originalLeft = parseFloat(canvas.style.left) || 0;
    const originalTop = parseFloat(canvas.style.top) || 0;

    function applyVibration() {
        const elapsed = Date.now() - startTime;
        if (elapsed < vibrationDuration) {
            // Calculate the amplitude of the vibration
            const progress = elapsed / vibrationDuration;
            const offsetX = Math.sin(progress * Math.PI * 10) * vibrationIntensity;
            const offsetY = Math.sin(progress * Math.PI * 10) * vibrationIntensity;

            // Apply the offset to create a vibration effect
            canvas.style.left = `${originalLeft + offsetX - dx}px`;
            canvas.style.top = `${originalTop + offsetY - dy}px`;

            requestAnimationFrame(applyVibration);
        } else {
            // Reset the canvas position after vibration is done
            canvas.style.left = `${originalLeft}px`;
            canvas.style.top = `${originalTop}px`;
        }
    }

    applyVibration();
    vibrationSound.play(); // Play vibration sound
}



function gameLoop() {
    if (gameOver) return;

    requestAnimationFrame(gameLoop);

    if (++count < 4) return;
    count = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snake.x += direction.x;
    snake.y += direction.y;

    if (snake.x === food.x && snake.y === food.y) {
        createParticles(food.x, food.y, 'lime');
        resetFood();
        updateScore(1);
        foodEatenSound.play(); // Play food eaten sound
    }

    if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
        createParticles(snake.x, snake.y, 'red');
        gameOver = true;
        document.getElementById('menu').style.display = 'block';
        return;
    }

    ctx.fillStyle = 'lime';
    ctx.fillRect(snake.x, snake.y, grid - 1, grid - 1);

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, grid - 1, grid - 1);

    if (explosionActive) {
        ctx.beginPath();
        ctx.arc(snake.x + grid / 2, snake.y + grid / 2, explosionRadius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fill();

        if (Date.now() - lastPowerActivationTime > powerDuration) {
            explosionActive = false;
            explosionRadius = 0;
        }
    }

    enemies.forEach((enemy, index) => {
        const dx = snake.x - enemy.x;
        const dy = snake.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < explosionRadius) {
            createParticles(enemy.x, enemy.y, 'orange'); // Orange particles for explosion
            createVibrationEffect(dx / distance, dy / distance); // Vibrate screen
            enemyKilledSound.play(); // Play enemy killed sound
            enemies.splice(index, 1);
            updateScore(2);
            powers = Math.min(powers + 1, POWER_MAX); // Limit power-ups to 6
        } else {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
            ctx.fillStyle = 'blue';
            ctx.fillRect(enemy.x, enemy.y, grid - 1, grid - 1);

            if (Math.abs(snake.x - enemy.x) < grid && Math.abs(snake.y - enemy.y) < grid) {
                createParticles(snake.x, snake.y, 'red');
                gameOver = true;
                document.getElementById('menu').style.display = 'block';
                return;
            }
        }
    });

    drawPowers();
    updateParticles();
    drawParticles();
    drawTimers();

    // Add a power every 10 seconds
    if (Date.now() - lastPowerActivationTime > 10000 && !explosionActive) {
        powers = Math.min(powers + 1, POWER_MAX); // Limit power-ups to 6
        // Do not reset the power timer here
    }

    // End game if food is not eaten within 10 seconds
    if (Date.now() - lastFoodTime > 10000) {
        createParticles(snake.x, snake.y, 'red');
        gameOver = true;
        document.getElementById('menu').style.display = 'block';
        document.getElementById('menu').innerHTML += '<p>You died of hunger, Motherfucker! No restart for you,are dead!</p>';
        return;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const playMusicButton = document.getElementById('playMusicButton');
    const backgroundMusic = document.getElementById('backgroundMusic');

    playMusicButton.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            playMusicButton.innerText = 'Music On';
            playMusicButton.style.backgroundColor = 'green';
        } else {
            backgroundMusic.pause();
            playMusicButton.innerText = 'Music Off';
            playMusicButton.style.backgroundColor = 'red';
        }
    });

    // Initialize the button state based on whether music is already playing
    if (!backgroundMusic.paused) {
        playMusicButton.innerText = 'Music On';
        playMusicButton.style.backgroundColor = 'green';
    } else {
        playMusicButton.innerText = 'Music Off';
        playMusicButton.style.backgroundColor = 'red';
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const leaveButton = document.getElementById('leaveButton');
    const menu = document.getElementById('menu');

    function startGame() {
        // Reset game variables to their initial states
        snake = { x: 160, y: 160 };
        direction = { x: grid, y: 0 };
        food = { x: 320, y: 320 };
        score = 0;
        highScore = 0;
        particles = [];
        gameOver = false;
        enemies = [];
        foodEaten = 0;
        shooting = false;
        explosionRadius = 0;
        powers = 0;
        powerActivated = false;
        lastPowerActivationTime = 0;
        lastFoodTime = Date.now();

        // Hide the menu and restart game loop
        menu.style.display = 'none';
        gameLoop();
    }

    function leaveGame() {
        // Stop game loop
        gameOver = true;

        // Optionally, you might want to perform other actions, like saving the score or showing a message
        alert('Thank you for playing!');

        // Hide the game and show a leave message or redirect to another page
        menu.style.display = 'none';
        document.body.innerHTML = '<h1>You have left the game.</h1>';
    }

    startButton.addEventListener('click', startGame);
    leaveButton.addEventListener('click', leaveGame);
});


// Event listeners
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && direction.y === 0) {
        direction = { x: 0, y: -grid };
    } else if (event.key === 'ArrowDown' && direction.y === 0) {
        direction = { x: 0, y: grid };
    } else if (event.key === 'ArrowLeft' && direction.x === 0) {
        direction = { x: -grid, y: 0 };
    } else if (event.key === 'ArrowRight' && direction.x === 0) {
        direction = { x: grid, y: 0 };
    } else if (event.key === ' ' && powers > 0) {
        explosionActive = true;
        explosionRadius = 50; // Adjust as needed
        powers--;
        lastPowerActivationTime = Date.now();
    }
});



// Start the game
gameLoop();
