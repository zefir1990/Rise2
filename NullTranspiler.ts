import * as fs from 'fs';
import { AbstractTranspiler } from './AbstractTranspiler';


export class NullTranspiler implements AbstractTranspiler {
    transpile(line: string): string {
        console.log(line)
        return line;
    }

    transpileFile(inputPath: string, outputPath: string): void {
        const data = fs.readFileSync(inputPath, 'utf8');
        const lines = data.split('\n');
        const transpiledLines = lines.map(line => this.transpile(line)).filter(line => line !== '__SKIP_LINE__');
        const transpiledData = transpiledLines.join('\n');
        fs.writeFileSync(outputPath, transpiledData, 'utf8');
    }
}

