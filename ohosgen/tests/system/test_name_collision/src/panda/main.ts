import { init, resize, image, window } from "./compat";

function mainBody() {
    console.log('Starting demo: test_name_collision');
    resize({ height: 8, width: 4 });
    image.resize({ height: 64.8.toFloat(), width: 48.3.toFloat() });
    window.resize({ height: 480, width: 320 });
}

export function main() {
    init();
    mainBody();
}
