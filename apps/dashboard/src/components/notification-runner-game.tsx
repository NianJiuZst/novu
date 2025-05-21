import { useCallback, useEffect, useRef, useState } from 'react';

interface NotificationRunnerGameProps {
  className?: string;
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
}

interface GameState {
  player: GameObject;
  obstacles: GameObject[];
  ground: number;
  isJumping: boolean;
  jumpVelocity: number;
  gravity: number;
  gameSpeed: number;
  score: number;
  highScore: number;
  isGameOver: boolean;
}

export function NotificationRunnerGame({ className }: NotificationRunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameRef = useRef<GameState>({
    player: {
      x: 50,
      y: 0,
      width: 30,
      height: 30,
    },
    obstacles: [],
    ground: 0,
    isJumping: false,
    jumpVelocity: 15,
    gravity: 0.8,
    gameSpeed: 5,
    score: 0,
    highScore: 0,
    isGameOver: false,
  });
  
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_HEIGHT = 40;
  const OBSTACLE_TYPES = ['locked', 'error'];
  const GAME_COLORS = {
    background: '#F9FAFB',  // Light background matching dashboard
    player: 'hsl(var(--primary-base))',  // Using Novu primary color
    obstacle: 'hsl(var(--neutral-600))',
    text: 'hsl(var(--text-strong))',
    ground: 'hsl(var(--neutral-300))',
  };
  
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const game = gameRef.current;
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    game.ground = canvas.height - 50;
    
    game.player.y = game.ground - game.player.height;
    
    game.obstacles = [];
    game.isGameOver = false;
    game.score = 0;
    game.gameSpeed = 5;
    
    setIsPlaying(true);
  }, []);
  
  const handleInput = useCallback((e: KeyboardEvent) => {
    const game = gameRef.current;
    
    if ((e.code === 'Space' || e.key === 'ArrowUp') && !game.isJumping && !game.isGameOver) {
      game.isJumping = true;
    }
    
    if ((e.code === 'Space' || e.key === 'ArrowUp') && game.isGameOver) {
      initGame();
    }
  }, [initGame]);
  
  const handleCanvasClick = useCallback(() => {
    const game = gameRef.current;
    
    if (game.isGameOver) {
      initGame();
    } else if (!game.isJumping) {
      game.isJumping = true;
    }
  }, [initGame]);
  
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    ctx.save();
    ctx.fillStyle = GAME_COLORS.player;
    
    ctx.beginPath();
    const centerX = game.player.x + game.player.width / 2;
    const topY = game.player.y;
    const bottomY = game.player.y + game.player.height;
    
    ctx.arc(centerX, topY + 10, 8, Math.PI, 2 * Math.PI);
    ctx.lineTo(centerX + 10, bottomY - 5);
    ctx.lineTo(centerX - 10, bottomY - 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, bottomY - 3, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
  }, []);
  
  const drawObstacles = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    game.obstacles.forEach((obstacle) => {
      ctx.save();
      ctx.fillStyle = GAME_COLORS.obstacle;
      
      if (obstacle.speed === 1) { // "locked" obstacle
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        ctx.fillStyle = GAME_COLORS.background;
        ctx.beginPath();
        ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 3, 5, 0, 2 * Math.PI);
        ctx.fill();
      } else { // "error" obstacle
        const padding = 5;
        ctx.lineWidth = 3;
        ctx.strokeStyle = GAME_COLORS.obstacle;
        
        ctx.beginPath();
        ctx.moveTo(obstacle.x + padding, obstacle.y + padding);
        ctx.lineTo(obstacle.x + obstacle.width - padding, obstacle.y + obstacle.height - padding);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width - padding, obstacle.y + padding);
        ctx.lineTo(obstacle.x + padding, obstacle.y + obstacle.height - padding);
        ctx.stroke();
      }
      
      ctx.restore();
    });
  }, []);
  
  const drawGround = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    ctx.save();
    ctx.fillStyle = GAME_COLORS.ground;
    ctx.fillRect(0, game.ground, ctx.canvas.width, 2);
    ctx.restore();
  }, []);
  
  const drawScore = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    ctx.save();
    ctx.fillStyle = GAME_COLORS.text;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${Math.floor(game.score)}`, ctx.canvas.width - 20, 30);
    
    if (game.highScore > 0) {
      ctx.fillText(`High Score: ${Math.floor(game.highScore)}`, ctx.canvas.width - 20, 55);
    }
    
    if (game.isGameOver) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Game Over', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
      ctx.font = '16px sans-serif';
      ctx.fillText('Press Space or tap to restart', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
    }
    
    ctx.restore();
  }, []);
  
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const game = gameRef.current;
    if (game.isGameOver) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (game.isJumping) {
      game.player.y -= game.jumpVelocity;
      game.jumpVelocity -= game.gravity;
      
      if (game.player.y >= game.ground - game.player.height) {
        game.player.y = game.ground - game.player.height;
        game.isJumping = false;
        game.jumpVelocity = 15;
      }
    }
    
    if (Math.random() < 0.01 + game.gameSpeed * 0.001) {
      const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      game.obstacles.push({
        x: canvas.width,
        y: game.ground - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        speed: type === 'locked' ? 1 : 2, // Use speed as a type indicator
      });
    }
    
    game.obstacles = game.obstacles.filter((obstacle) => {
      obstacle.x -= game.gameSpeed + (obstacle.speed || 0);
      
      if (
        game.player.x < obstacle.x + obstacle.width &&
        game.player.x + game.player.width > obstacle.x &&
        game.player.y < obstacle.y + obstacle.height &&
        game.player.y + game.player.height > obstacle.y
      ) {
        game.isGameOver = true;
        game.highScore = Math.max(game.highScore, game.score);
        setIsPlaying(false);
      }
      
      return obstacle.x + obstacle.width > 0;
    });
    
    game.score += 0.1;
    
    if (game.score > 0 && game.score % 100 < 0.1) {
      game.gameSpeed += 0.5;
    }
    
    drawGround(ctx);
    drawPlayer(ctx);
    drawObstacles(ctx);
    drawScore(ctx);
    
    if (!game.isGameOver) {
      requestAnimationFrame(gameLoop);
    }
  }, [drawGround, drawPlayer, drawObstacles, drawScore]);
  
  useEffect(() => {
    initGame();
    
    window.addEventListener('keydown', handleInput);
    
    return () => {
      window.removeEventListener('keydown', handleInput);
    };
  }, [initGame, handleInput]);
  
  useEffect(() => {
    if (isPlaying) {
      requestAnimationFrame(gameLoop);
    }
  }, [isPlaying, gameLoop]);
  
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      
      gameRef.current.ground = canvas.height - 50;
      
      if (!isPlaying) {
        gameRef.current.player.y = gameRef.current.ground - gameRef.current.player.height;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying]);
  
  return (
    <canvas
      ref={canvasRef}
      className={className}
      onClick={handleCanvasClick}
      aria-label="Notification Runner Game"
    />
  );
}
