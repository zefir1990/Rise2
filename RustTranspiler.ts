import * as fs from 'fs';
import { AbstractTranspiler } from './AbstractTranspiler';

export class RustTranspiler implements AbstractTranspiler {
    private skipNext: boolean = false;

    transpile(line: string): string {
        if (this.skipNext) {
            this.skipNext = false;
            return '__SKIP_LINE__';
        }

        if (line.trim() === '// Rise2: ignore-next-line') {
            this.skipNext = true;
            return '__SKIP_LINE__';
        }


        let result = line;

        // Type Aliases
        result = result.replace(/type\s+(\w+)\s*=\s*float/g, 'type $1 = f64');
        result = result.replace(/type\s+(\w+)\s*=\s*int/g, 'type $1 = i64');



        // Remove export keyword (Rust uses pub, but we'll handle it below)
        result = result.replace(/\bexport\s+/g, 'pub ');

        // Interface to trait
        result = result.replace(/\binterface\b/g, 'trait');

        // Class to struct
        result = result.replace(/\bclass\b/g, 'struct');

        // Return types: ): Type -> ) -> Type
        // Handle void first
        result = result.replace(/\)\s*:\s*void/g, ')');
        // General return type
        result = result.replace(/\)\s*:\s*(\w+)/g, ') -> $1');

        // Constructor to fn new
        result = result.replace(/constructor\s*\((.*)\)/g, 'fn new($1) -> Self');

        // Static methods
        result = result.replace(/static\s+(\w+)\s*\((.*)\)/g, 'pub fn $1($2)');

        // Instance methods (rough match)
        // For Rust, we'll assume &mut self for now, or just fn. 
        // SwiftTranspiler adds 'func', we'll add 'pub fn'.
        const methodRegex = /^(\s*)(?!(if|for|while|switch|return|fn|pub|static|struct|trait|type|import|let|const|var)\b)(\w+)\s*\((.*)\)/g;
        result = result.replace(methodRegex, '$1pub fn $3(&mut self, $4)');

        // Properties and Variables (TypeScript property: name: type; -> Rust: pub name: type,)
        // This is tricky in structs. Let's just do type conversion for now.
        result = result.replace(/(\w+):\s*float/g, '$1: f64');
        result = result.replace(/(\w+):\s*int/g, '$1: i64');

        // Parameter/Property Type Conversions
        result = result.replace(/:\s*string\b/g, ': String');
        result = result.replace(/:\s*boolean\b/g, ': bool');
        result = result.replace(/\(\)\s*=>\s*void/g, 'Box<dyn Fn()>');

        // Return type conversions
        result = result.replace(/->\s*float/g, '-> f64');
        result = result.replace(/->\s*int/g, '-> i64');
        result = result.replace(/->\s*string/g, '-> String');
        result = result.replace(/->\s*boolean/g, '-> bool');
        result = result.replace(/->\s*void\b/g, '');


        // Array Types: Type[] -> Vec<Type>
        result = result.replace(/\b([a-zA-Z0-9_]+)\[\]/g, 'Vec<$1>');

        // this -> self
        result = result.replace(/\bthis\b/g, 'self');

        // const/let -> let/let mut
        result = result.replace(/\blet\b/g, 'let mut');
        result = result.replace(/\bconst\b/g, 'let');

        // Swift has no 'new' keyword, Rust uses ::new()
        result = result.replace(/\bnew\s+(\w+)\((.*)\)/g, '$1::new($2)');

        // Comparison operators: === -> ==
        result = result.replace(/===/g, '==');

        // Math.sqrt(x) -> (x as f64).sqrt()
        result = result.replace(/Math\.sqrt\((.*)\)/g, '($1 as f64).sqrt()');

        // String interpolation: `... ${x} ...` -> format!("... {} ...", x)
        // Replace ${...} with {}
        result = result.replace(/\$\{(.*?)\}/g, '{}');
        // Replace backticks with double quotes (rough)
        result = result.replace(/`(.*?)`/g, 'format!("$1")');

        // Remove curly braces from inside parentheses
        result = result.replace(/\(\s*\{/g, '(');
        result = result.replace(/\}\s*\)/g, ')');

        return result;
    }

    transpileFile(inputPath: string, outputPath: string): void {
        const data = fs.readFileSync(inputPath, 'utf8');
        const lines = data.split('\n');
        const transpiledLines = lines.map(line => this.transpile(line)).filter(line => line !== '__SKIP_LINE__');
        const transpiledData = transpiledLines.join('\n');
        fs.writeFileSync(outputPath, transpiledData, 'utf8');
    }
}
