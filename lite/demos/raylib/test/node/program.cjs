const raylib = require('../../bundled/npm')

const KEYS = {
    SPACE: 32,
    RIGHT: 262,
    LEFT: 263,
}

const BLOCK_SIZE = 100
const WINDOW_WIDTH = 800
const WINDOW_HEIGHT = 450

const BALL_RADIUS = 10

const BLOCK_SPEED = 0.2
const BALL_SPEED = 0.02

let ballState = { x: WINDOW_WIDTH / 2, y: WINDOW_HEIGHT / 2, v: { x: 0, y: BALL_SPEED } }
let blockPosition = { x: WINDOW_WIDTH / 2, y: WINDOW_HEIGHT - 60 }

const WHITE = { r: 255, g: 255, b: 255, a: 255 }
const BLACK = { r: 0, g: 0, b: 0, a: 255 }
const READ = { r: 255, g: 0, b: 0, a: 255 }

function isBallCollide(rect) {
    const distX = Math.abs(ballState.x - rect.x - rect.w / 2)
    const distY = Math.abs(ballState.y - rect.y - 10)

    if (distX > rect.w / 2 + BALL_RADIUS) {
        return false
    }
    if (distY > rect.h / 2 + BALL_RADIUS) {
        return false
    }

    if (distX <= rect.w / 2) {
        return true
    }
    if (distY <= rect.h / 2) {
        return true
    }

    const dx = distX - rect.w / 2
    const dy = distY - rect.h / 2
    return dx * dx + dy * dy <= BALL_RADIUS * BALL_RADIUS
}

function reflectBall(n) {}

function main() {
    raylib.InitWindow(WINDOW_WIDTH, WINDOW_HEIGHT, "Game")

    while (!raylib.WindowShouldClose()) {
        // update
        if (raylib.IsKeyDown(KEYS.RIGHT) && blockPosition.x <= WINDOW_WIDTH - 60) {
            blockPosition.x += BLOCK_SPEED
        }
        if (raylib.IsKeyDown(KEYS.LEFT) && blockPosition.x >= 60) {
            blockPosition.x -= BLOCK_SPEED
        }

        if (isBallCollide({ x: blockPosition.x, y: blockPosition.y, w: BLOCK_SIZE, h: 10 })) {
            ballState.v.y = -ballState.v.y
        }

        ballState.x += ballState.v.x
        ballState.y += ballState.v.y

        // render
        raylib.BeginDrawing()
            raylib.ClearBackground(WHITE)
            raylib.DrawRectangle(blockPosition.x - (BLOCK_SIZE / 2), blockPosition.y - 10, BLOCK_SIZE, 20, BLACK)
            raylib.DrawCircle(ballState.x, ballState.y, BALL_RADIUS, READ)
        raylib.EndDrawing()
    }
    raylib.CloseWindow()
}
main()
