
import { useEffect, useRef, useState } from "react";
import "./GameCanvas.css";
import backgroundImage from "../assets/Background.jpg";
import gokuImage from "../assets/goku-nimbus.png";
import groundImage from "../assets/groundTexture.png";
import mountainImage from "../assets/MountainObstacle.png";

const WIDTH = 900;
const HEIGHT = 420;
const GROUND = 380;
const PLAYER_START_Y = 340;
const PLAYER_X = 130;
const SPRITE_WIDTH = 76;
const SPRITE_HEIGHT = 100;

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const imagesRef = useRef({});

  const [status, setStatus] = useState("ready");
  const [score, setScore] = useState(0);

  const [best, setBest] = useState(
    () => Number(localStorage.getItem("nimbus-best")) || 0
  );

  useEffect(() => {
    const images = {
      background: new Image(),
      goku: new Image(),
      ground: new Image(),
      mountain: new Image(),
    };

    images.background.src = backgroundImage;
    images.goku.src = gokuImage;
    images.ground.src = groundImage;
    images.mountain.src = mountainImage;

    imagesRef.current = images;
  }, []);

  // Start or restart game
  function startGame() {
    engineRef.current = {
      playerY: PLAYER_START_Y,
      velocity: 0,
      obstacles: [],
      frame: 0,
      score: 0,
      speed: 5,
      lastObstacle: 0,
      gameOver: false,
    };

    setScore(0);
    setStatus("playing");
  }

  function jump() {
    const game = engineRef.current;

    if (!game || game.gameOver || status !== "playing") return;

    if (game.playerY >= PLAYER_START_Y - 2) {
      game.velocity = -13;
    }
  }


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let animationId;

    const images = imagesRef.current;

    ctx.imageSmoothingEnabled = false;

    // Draw background sky
    function drawSky() {
      if (
        images.background?.complete &&
        images.background.naturalWidth > 0
      ) {
        ctx.drawImage(
          images.background,
          0,
          0,
          WIDTH,
          HEIGHT
        );
      } else {
        ctx.fillStyle = "#65C7F7";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
    }

    // Draw ground texture (tiles seamlessly across the width with optional scrolling)
    function drawGround(scrollX = 0) {
      if (
        images.ground?.complete &&
        images.ground.naturalWidth > 0
      ) {
        const patternOffset = Math.floor(scrollX % 44);
        ctx.drawImage(
          images.ground,
          -patternOffset,
          GROUND,
          WIDTH + 44,
          HEIGHT - GROUND
        );
      } else {
        ctx.fillStyle = "#7CB342";
        ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
      }
    }

    function drawNimbus(x, y) {
      if (
        images.goku?.complete &&
        images.goku.naturalWidth > 0
      ) {
        ctx.drawImage(
          images.goku,
          x - SPRITE_WIDTH / 2,
          y - 65,
          SPRITE_WIDTH,
          SPRITE_HEIGHT
        );
      }
    }

    // Align the mountain's bottom edge with the ground line.
    function drawMountain(x, height) {
      if (
        images.mountain?.complete &&
        images.mountain.naturalWidth > 0
      ) {
        ctx.drawImage(
          images.mountain,
          x,
          GROUND - height,
          92,
          height
        );
      }
    }

    function checkCollision(game, obstacle) {
      const player = {
        left: PLAYER_X - SPRITE_WIDTH / 2 + 10,
        right: PLAYER_X + SPRITE_WIDTH / 2 - 10,
        top: game.playerY - 45,
        bottom: game.playerY + 28,
      };

      const mountain = {
        left: obstacle.x + 12,
        right: obstacle.x + 80,
        top: GROUND - obstacle.height + 12,
        bottom: GROUND,
      };

      return (
        player.right > mountain.left &&
        player.left < mountain.right &&
        player.bottom > mountain.top &&
        player.top < mountain.bottom
      );
    }

    function endGame(game) {
      if (game.gameOver) return;
      game.gameOver = true;
      const finalScore = Math.floor(game.score);

      setScore(finalScore);
      setStatus("over");

      setBest((previous) => {
        const newBest = Math.max(previous, finalScore);

        localStorage.setItem("nimbus-best", newBest);

        return newBest;
      });
    }

    // Animation loop
    function update() {
      const game = engineRef.current;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const groundScroll = game && !game.gameOver ? (game.frame * game.speed) : 0;

      // 1. Draw sky
      drawSky();

      // 2. Move and draw mountain obstacles (rooted into the ground)
      if (game && !game.gameOver) {
        game.frame++;

        // Gravity and jumping
        game.playerY += game.velocity;
        game.velocity += 0.65;

        // Return to starting position
        if (game.playerY > PLAYER_START_Y) {
          game.playerY = PLAYER_START_Y;
          game.velocity = 0;
        }

        // Create mountain obstacles
        if (game.frame - game.lastObstacle > 95) {
          game.obstacles.push({
            x: WIDTH,
            height: 60 + Math.random() * 40,
          });

          game.lastObstacle = game.frame;
        }

        // Increase game speed
        game.speed = 5 + Math.min(game.score / 300, 5);

        // Move and draw obstacles
        for (const obstacle of game.obstacles) {
          obstacle.x -= game.speed;

          drawMountain(obstacle.x, obstacle.height);

          if (checkCollision(game, obstacle)) {
            endGame(game);
            break;
          }
        }

        // Remove obstacles outside screen
        game.obstacles = game.obstacles.filter(
          (obstacle) => obstacle.x > -120
        );

        // Update score
        if (!game.gameOver) {
          game.score += 0.15;

          if (game.frame % 10 === 0) {
            setScore(Math.floor(game.score));
          }
        }
      } else if (game?.obstacles) {
        // Draw existing obstacles when game over so they remain visible
        for (const obstacle of game.obstacles) {
          drawMountain(obstacle.x, obstacle.height);
        }
      }

      // 3. Draw ground (drawn over the base of the mountains so they naturally rise out of the soil)
      drawGround(groundScroll);

      // 4. Draw Goku and Nimbus
      drawNimbus(PLAYER_X, game?.playerY ?? PLAYER_START_Y);

      animationId = requestAnimationFrame(update);
    }

    update();

    return () => cancelAnimationFrame(animationId);
  }, [status]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();

        if (status === "ready" || status === "over") {
          if (!event.repeat) startGame();
        } else if (!event.repeat) {
          jump();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [status]);

  // Mobile controls
  function handleTouchJump() {
    if (status === "playing") {
      jump();
    }
  }

  return (
    <section className="game-container">

      <div className="game-heading">
        <div>
          <h1>🐉 Nimbus Run</h1>
          <p>Ride the clouds. Conquer the mountains.</p>
        </div>

        <div className="score-panel">
          <div>
            SCORE
            <strong>{score}</strong>
          </div>

          <div>
            BEST
            <strong>{best}</strong>
          </div>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onPointerDown={handleTouchJump}
        />

        {status !== "playing" && (
          <div className="game-overlay">

            <h2>
              {status === "ready"
                ? "Ready, Warrior?"
                : "Game Over!"}
            </h2>

            <p>
              {status === "ready"
                ? "Help Goku fly through the mountains!"
                : `Your score: ${score}`}
            </p>

            <button onClick={startGame}>
              {status === "ready"
                ? "Start Adventure"
                : "Play Again"}
            </button>

          </div>
        )}
      </div>

      <div className="game-controls">
        <button
          className="jump-button"
          onClick={handleTouchJump}
          disabled={status !== "playing"}
        >
          ⬆ JUMP
        </button>
      </div>

      <p className="instructions">
        SPACE / ↑ to jump · Tap the screen on mobile
      </p>

    </section>
  );
}
