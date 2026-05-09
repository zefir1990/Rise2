export interface AbstractTranspiler {
    transpile(line: string): string;
}
