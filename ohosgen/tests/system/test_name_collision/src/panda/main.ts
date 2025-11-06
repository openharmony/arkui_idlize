import { init, resize, integer, floating } from "./compat";

function mainBody() {
    console.log('Starting demo: test_name_collision');
    resize({ height: 8, width: 4.4 });
    integer.resize({ height: 8, width: 4 });
    floating.resize({ height: 8.8.toFloat(), width: 4.4.toFloat() });
}

export function main() {
    init();
    mainBody();
}
