import * as fs from 'fs';
import { NullTranspiler } from './NullTranspiler';
import { AbstractTranspiler } from './AbstractTranspiler';
import { SwiftTranspiler } from './SwiftTranspiler';

function main() {
    const args = process.argv.slice(2);

    const getArgValue = (flag: string): string | undefined => {
        const index = args.indexOf(flag);
        if (index !== -1 && index + 1 < args.length) {
            return args[index + 1];
        }
        return undefined;
    };

    const inputPath = getArgValue('--input-file');
    const outputPath = getArgValue('--output-file');
    const targetLanguage = getArgValue('--target-language');

    if (!inputPath || !outputPath || !targetLanguage) {
        console.error('Usage: ts-node rise2.ts --input-file <path> --output-file <path> --target-language <lang>');
        process.exit(1);
    }

    let transpiler: AbstractTranspiler;

    if (targetLanguage.toLowerCase() === 'swift') {
        transpiler = new SwiftTranspiler();
    } else {
        transpiler = new NullTranspiler();
    }

    try {
        const data = fs.readFileSync(inputPath, 'utf8');
        const lines = data.split('\n');
        const transpiledLines = lines.map(line => transpiler.transpile(line)).filter(line => line !== '__SKIP_LINE__');
        const transpiledData = transpiledLines.join('\n');
        fs.writeFileSync(outputPath, transpiledData, 'utf8');
        console.log(`Successfully processed ${inputPath} -> ${outputPath} [${targetLanguage}]`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
