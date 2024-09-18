import { readFileSync, writeFileSync } from 'fs';

const filePath = './package.json';
const args = process.argv.slice(2);

try {
    if (args.length !== 1 || (args[0] !== '--add' && args[0] !== '--remove')) {
        console.error('Usage: node manage-call-log.mjs --add | --remove');
        process.exit(1);
    } else {
        const action = args[0]
        let data = readFileSync(filePath, 'utf8');
        let updatedData = null;
        if (action === '--add') {
            updatedData = data.replace(/--dts2peer/g, '--dts2peer --call-log');
        } else if (action === '--remove') {
            updatedData = data.replace(/--dts2peer --call-log/g, '--dts2peer');
        }
        writeFileSync(filePath, updatedData, 'utf8');
        console.log("Successfully updated the package.json file.");
    }        
} catch (error) {
    console.error("Error reading or writing to package.json:", error);
}
