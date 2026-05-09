import { AbstractTranspiler } from './AbstractTranspiler';

export class NullTranspiler implements AbstractTranspiler {
    transpile(line: string): string {
        return line;
    }
}
