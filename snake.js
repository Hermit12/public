const gameContainer = document.getElementById('game-container');

// Canvas erstellen
const canvas = document.createElement('canvas');
canvas.width = Math.min(600, window.innerWidth - 40);
canvas.height = Math.min(600, window.innerHeight - 40);
canvas.style.border = '1px solid rgba(255, 215, 0, 0.3)';
canvas.style.borderRadius = '15px';
canvas.style.background = 'rgba(26, 26, 26, 0.95)';
gameContainer.appendChild(canvas);

// Spiel-Kontext
const ctx = canvas.getContext('2d');
const gridSize = 20;
let snake = [{x: 5, y: 5}];
let food = {x: 15, y: 15};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameLoop = null;
let gameStarted = false;

// Score-Anzeige erstellen
const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '20px';
scoreDisplay.style.left = '50%';
scoreDisplay.style.transform = 'translateX(-50%)';
scoreDisplay.style.color = '#FFD700';
scoreDisplay.style.fontFamily = "'Space Grotesk', sans-serif";
scoreDisplay.style.fontSize = '24px';
scoreDisplay.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
gameContainer.appendChild(scoreDisplay);

// Close Button erstellen
const closeButton = document.createElement('button');
closeButton.innerHTML = '×';
closeButton.style.position = 'absolute';
closeButton.style.top = '20px';
closeButton.style.right = '20px';
closeButton.style.background = 'none';
closeButton.style.border = 'none';
closeButton.style.color = '#FFD700';
closeButton.style.fontSize = '36px';
closeButton.style.cursor = 'pointer';
closeButton.style.padding = '10px';
closeButton.style.lineHeight = '1';
closeButton.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
gameContainer.appendChild(closeButton);

closeButton.addEventListener('click', () => {
    endGame();
    gameContainer.style.display = 'none';
    gameContainer.innerHTML = '';
});

// Tastatur-Event-Listener
document.addEventListener('keydown', (e) => {
    if (!gameStarted) {
        startGame();
        gameStarted = true;
    }
    
    switch(e.key) {
        case 'ArrowUp':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case 'Escape':
            endGame();
            gameContainer.style.display = 'none';
            gameContainer.innerHTML = '';
            break;
    }
});

function startGame() {
    if (gameLoop) return;
    gameLoop = setInterval(gameStep, 100);
}

function endGame() {
    clearInterval(gameLoop);
    gameLoop = null;
    snake = [{x: 5, y: 5}];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    gameStarted = false;
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
    // Überprüfen, ob das Essen nicht auf der Schlange liegt
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)),
            y: Math.floor(Math.random() * (canvas.height / gridSize))
        };
    }
}

function gameStep() {
    direction = nextDirection;
    const head = {...snake[0]};
    
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Kollisionserkennung mit Wänden
    if (head.x < 0 || head.x >= canvas.width / gridSize ||
        head.y < 0 || head.y >= canvas.height / gridSize) {
        endGame();
        return;
    }
    
    // Kollisionserkennung mit sich selbst
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }
    
    snake.unshift(head);
    
    // Essen aufsammeln
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        generateFood();
    } else {
        snake.pop();
    }
    
    // Canvas leeren
    ctx.fillStyle = 'rgba(26, 26, 26, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Schlange zeichnen
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#FFD700' : 'rgba(255, 215, 0, 0.5)';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
    
    // Essen zeichnen
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    
    // Score aktualisieren
    scoreDisplay.textContent = `Score: ${score}`;
}

// Initiales Essen generieren
generateFood();
