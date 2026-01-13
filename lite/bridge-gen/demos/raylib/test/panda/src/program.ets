import * as raylib from 'raylib'

const white: raylib.Color = {
    r: (255).toByte(),
    g: (255).toByte(),
    b: (255).toByte(),
    a: (255).toByte(),
}
const pink: raylib.Color = {
    r: (255).toByte(),
    g: (0).toByte(),
    b: (255).toByte(),
    a: (255).toByte(),
}

function main() {
    raylib.InitWindow(800, 450, "TestWindow")

    let text = "HELLO!"
    while (!raylib.WindowShouldClose()) {
        if (raylib.IsKeyDown(32)) {
            text = "You pressed SPACE!"
        } else {
            text = "HELLO"
        }
        raylib.BeginDrawing()
            raylib.ClearBackground(white)
            raylib.DrawText(text, 190, 200, 20, pink)
        raylib.EndDrawing()
    }
    raylib.CloseWindow()
}
