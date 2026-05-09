import { NullTranspiler } from './NullTranspiler';

import { AbstractTranspiler } from './AbstractTranspiler';
import { SwiftTranspiler } from './SwiftTranspiler';
import { RustTranspiler } from './RustTranspiler';


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
    } else if (targetLanguage.toLowerCase() === 'rust') {
        transpiler = new RustTranspiler();
    } else {
        transpiler = new NullTranspiler();
    }


    try {
        transpiler.transpileFile(inputPath, outputPath);
        console.log(`Successfully processed ${inputPath} -> ${outputPath} [${targetLanguage}]`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}


main();
