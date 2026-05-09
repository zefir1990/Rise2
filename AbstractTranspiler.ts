export interface AbstractTranspiler {
    transpile(line: string): string;
    transpileFile(inputPath: string, outputPath: string): void;
}

