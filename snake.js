class SnakeGame {
    constructor(container, width = 400, height = 400, cellSize = 20) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        this.canvas.style.borderRadius = '15px';
        this.canvas.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = cellSize;
        this.width = width;
        this.height = height;
        
        this.snake = [{x: 3, y: 3}];
        this.food = this.generateFood();
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameLoop = null;
        this.touchStartX = null;
        this.touchStartY = null;
        
        this.setupControls();
        this.start();
    }

    generateFood() {
        const maxX = (this.width / this.cellSize) - 1;
        const maxY = (this.height / this.cellSize) - 1;
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    break;
            }
        });

        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (!this.touchStartX || !this.touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0 && this.direction !== 'left') {
                    this.nextDirection = 'right';
                } else if (dx < 0 && this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
            } else {
                // Vertical swipe
                if (dy > 0 && this.direction !== 'up') {
                    this.nextDirection = 'down';
                } else if (dy < 0 && this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
            }

            this.touchStartX = null;
            this.touchStartY = null;
        });
    }

    move() {
        this.direction = this.nextDirection;
        const head = {...this.snake[0]};

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check for collisions
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check if snake ate food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    checkCollision(head) {
        // Wall collision
        if (head.x < 0 || head.x >= this.width / this.cellSize ||
            head.y < 0 || head.y >= this.height / this.cellSize) {
            return true;
        }

        // Self collision
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(26, 26, 26, 0.95)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#FFD700' : '#4CAF50';
            this.ctx.fillRect(
                segment.x * this.cellSize,
                segment.y * this.cellSize,
                this.cellSize - 1,
                this.cellSize - 1
            );
        });

        // Draw food
        this.ctx.fillStyle = '#FF4444';
        this.ctx.fillRect(
            this.food.x * this.cellSize,
            this.food.y * this.cellSize,
            this.cellSize - 1,
            this.cellSize - 1
        );

        // Draw score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Space Grotesk';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    }

    gameOver() {
        cancelAnimationFrame(this.gameLoop);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '30px Space Grotesk';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.width/2, this.height/2 - 30);
        this.ctx.font = '20px Space Grotesk';
        this.ctx.fillText(`Final Score: ${this.score}`, this.width/2, this.height/2 + 10);
        this.ctx.fillText('Tap or click to restart', this.width/2, this.height/2 + 50);

        const restart = (e) => {
            e.preventDefault();
            this.canvas.removeEventListener('click', restart);
            this.canvas.removeEventListener('touchstart', restart);
            this.snake = [{x: 3, y: 3}];
            this.direction = 'right';
            this.nextDirection = 'right';
            this.score = 0;
            this.food = this.generateFood();
            this.start();
        };

        this.canvas.addEventListener('click', restart);
        this.canvas.addEventListener('touchstart', restart);
    }

    start() {
        const gameStep = () => {
            this.move();
            this.draw();
            this.gameLoop = requestAnimationFrame(gameStep);
        };
        this.gameLoop = requestAnimationFrame(gameStep);
    }

    destroy() {
        cancelAnimationFrame(this.gameLoop);
        this.canvas.remove();
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SnakeGame;
}
