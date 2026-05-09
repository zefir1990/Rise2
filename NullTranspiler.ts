import { AbstractTranspiler } from './AbstractTranspiler';

export class NullTranspiler implements AbstractTranspiler {
    transpile(line: string): string {
        console.log(line)
        return line;
    }
}
