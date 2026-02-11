// Tetris Game - 俄罗斯方块
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Game constants
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 30;
        
        // Game state
        this.board = [];
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.highScore = parseInt(localStorage.getItem('tetrisHighScore')) || 0;
        this.gameOver = false;
        this.isPaused = false;
        this.isPlaying = false;
        
        // Current piece
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        
        // Next piece
        this.nextPiece = null;
        
        // Game loop
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        // Colors for pieces
        this.colors = {
            'I': '#00f0f0',
            'O': '#f0f000',
            'T': '#a000f0',
            'S': '#00f000',
            'Z': '#f00000',
            'J': '#0000f0',
            'L': '#f0a000'
        };
        
        // Tetromino shapes
        this.shapes = {
            'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
            'O': [[1,1], [1,1]],
            'T': [[0,1,0], [1,1,1], [0,0,0]],
            'S': [[0,1,1], [1,1,0], [0,0,0]],
            'Z': [[1,1,0], [0,1,1], [0,0,0]],
            'J': [[1,0,0], [1,1,1], [0,0,0]],
            'L': [[0,0,1], [1,1,1], [0,0,0]]
        };
        
        this.init();
    }
    
    init() {
        // Initialize board
        this.createBoard();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update displays
        this.updateDisplay();
        
        // Show start overlay
        this.showOverlay('俄罗斯方块', '按 SPACE 开始游戏');
    }
    
    createBoard() {
        this.board = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Mobile controls
        document.getElementById('btn-left').addEventListener('click', () => this.moveLeft());
        document.getElementById('btn-right').addEventListener('click', () => this.moveRight());
        document.getElementById('btn-rotate').addEventListener('click', () => this.rotate());
        document.getElementById('btn-down').addEventListener('click', () => this.moveDown());
        
        // Prevent default touch behavior on mobile controls
        document.querySelectorAll('.mobile-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => e.preventDefault());
        });
    }
    
    handleKeyPress(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!this.isPlaying) {
                this.startGame();
            } else {
                this.togglePause();
            }
            return;
        }
        
        if (!this.isPlaying || this.isPaused || this.gameOver) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                this.moveLeft();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveRight();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.moveDown();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotate();
                break;
        }
    }
    
    startGame() {
        this.isPlaying = true;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        
        this.createBoard();
        this.spawnPiece();
        this.hideOverlay();
        this.updateDisplay();
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    spawnPiece() {
        const types = Object.keys(this.shapes);
        const type = this.nextPiece || types[Math.floor(Math.random() * types.length)];
        
        this.currentPiece = {
            type: type,
            shape: this.shapes[type].map(row => [...row]),
            color: this.colors[type]
        };
        
        // Generate next piece
        const nextType = types[Math.floor(Math.random() * types.length)];
        this.nextPiece = nextType;
        
        // Position current piece
        this.currentX = Math.floor(this.COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentY = 0;
        
        // Check game over
        if (this.checkCollision(this.currentX, this.currentY, this.currentPiece.shape)) {
            this.endGame();
        }
        
        // Draw next piece
        this.drawNextPiece();
    }
    
    gameLoop(time = 0) {
        if (this.gameOver || !this.isPlaying) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        if (!this.isPaused) {
            this.dropCounter += deltaTime;
            
            if (this.dropCounter > this.dropInterval) {
                this.moveDown();
                this.dropCounter = 0;
            }
        }
        
        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        this.drawBoard();
        
        // Draw current piece
        if (this.currentPiece && !this.gameOver) {
            this.drawPiece(this.currentPiece, this.currentX, this.currentY);
        }
        
        // Draw grid lines
        this.drawGrid();
    }
    
    drawBoard() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col]) {
                    this.ctx.fillStyle = this.board[row][col];
                    this.ctx.fillRect(
                        col * this.BLOCK_SIZE,
                        row * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            }
        }
    }
    
    drawPiece(piece, x, y) {
        piece.shape.forEach((row, rowIndex) => {
            row.forEach((value, colIndex) => {
                if (value) {
                    this.ctx.fillStyle = piece.color;
                    this.ctx.fillRect(
                        (x + colIndex) * this.BLOCK_SIZE,
                        (y + rowIndex) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            });
        });
    }
    
    drawNextPiece() {
        // Clear next canvas
        this.nextCtx.fillStyle = '#f5f5f5';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const shape = this.shapes[this.nextPiece];
        const blockSize = 25;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
        
        shape.forEach((row, rowIndex) => {
            row.forEach((value, colIndex) => {
                if (value) {
                    this.nextCtx.fillStyle = this.colors[this.nextPiece];
                    this.nextCtx.fillRect(
                        offsetX + colIndex * blockSize,
                        offsetY + rowIndex * blockSize,
                        blockSize - 2,
                        blockSize - 2
                    );
                }
            });
        });
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.COLS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(i * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= this.ROWS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, i * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    moveLeft() {
        if (!this.checkCollision(this.currentX - 1, this.currentY, this.currentPiece.shape)) {
            this.currentX--;
            this.draw();
        }
    }
    
    moveRight() {
        if (!this.checkCollision(this.currentX + 1, this.currentY, this.currentPiece.shape)) {
            this.currentX++;
            this.draw();
        }
    }
    
    moveDown() {
        if (!this.checkCollision(this.currentX, this.currentY + 1, this.currentPiece.shape)) {
            this.currentY++;
            this.dropCounter = 0;
            this.draw();
        } else {
            this.lockPiece();
        }
    }
    
    rotate() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        
        // Check for wall kicks
        let newX = this.currentX;
        
        // Adjust position if rotation would cause collision
        if (this.checkCollision(newX, this.currentY, rotated)) {
            if (newX > 0 && !this.checkCollision(newX - 1, this.currentY, rotated)) {
                newX--;
            } else if (newX < this.COLS - rotated[0].length && 
                       !this.checkCollision(newX + 1, this.currentY, rotated)) {
                newX++;
            } else {
                return; // Can't rotate
            }
        }
        
        this.currentPiece.shape = rotated;
        this.currentX = newX;
        this.draw();
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        // Add piece to board
        this.currentPiece.shape.forEach((row, rowIndex) => {
            row.forEach((value, colIndex) => {
                if (value) {
                    const boardY = this.currentY + rowIndex;
                    const boardX = this.currentX + colIndex;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            });
        });
        
        // Check for line clears
        this.clearLines();
        
        // Spawn new piece
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                // Remove line
                this.board.splice(row, 1);
                // Add new empty line at top
                this.board.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                row++; // Check same row again
            }
        }
        
        if (linesCleared > 0) {
            this.addScore(linesCleared);
        }
    }
    
    addScore(linesCleared) {
        const scores = [0, 100, 300, 500, 800];
        this.score += scores[linesCleared] * this.level;
        this.lines += linesCleared;
        
        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('high-score').textContent = this.highScore;
        
        // Update high score if needed
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetrisHighScore', this.highScore);
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showOverlay('游戏暂停', '按 SPACE 继续');
        } else {
            this.hideOverlay();
        }
    }
    
    showOverlay(title, message) {
        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('overlay-title').textContent = title;
        document.getElementById('overlay-message').textContent = message;
    }
    
    hideOverlay() {
        document.getElementById('overlay').classList.add('hidden');
    }
    
    endGame() {
        this.gameOver = true;
        this.isPlaying = false;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetrisHighScore', this.highScore);
        }
        
        this.updateDisplay();
        this.showOverlay('游戏结束!', `得分: ${this.score} | 按 SPACE 重新开始`);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tetris = new TetrisGame();
});
