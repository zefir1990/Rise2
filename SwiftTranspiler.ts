import { AbstractTranspiler } from './AbstractTranspiler';

export class SwiftTranspiler implements AbstractTranspiler {
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
        result = result.replace(/type\s+(\w+)\s*=\s*float/g, 'typealias $1 = Float');
        result = result.replace(/type\s+(\w+)\s*=\s*int/g, 'typealias $1 = Int');

        // Remove export keyword
        result = result.replace(/\bexport\s+/g, '');

        // Interface to protocol
        result = result.replace(/\binterface\b/g, 'protocol');

        // Constructor to init
        result = result.replace(/constructor\s*\((.*)\)/g, 'init($1)');

        // Static methods
        result = result.replace(/static\s+(\w+)\s*\((.*)\)/g, 'static func $1($2)');

        // Instance methods (rough match for word followed by parentheses and space/bracket)
        // We exclude keywords like if, for, while, switch, constructor (already handled), return
        const methodRegex = /^(\s*)(?!(if|for|while|switch|return|init|constructor|static|class|export|const|let|var|type|import)\b)(\w+)\s*\((.*)\)/g;
        result = result.replace(methodRegex, '$1func $3($4)');

        // Return types: ): Type -> ) -> Type
        // Handle void first
        result = result.replace(/\)\s*:\s*void/g, ')');
        // General return type
        result = result.replace(/\)\s*:\s*(\w+)/g, ') -> $1');

        // Properties and Variables
        // TypeScript property: name: type; -> Swift: var name: type
        // This is tricky. Let's handle common patterns.
        result = result.replace(/(\w+):\s*float/g, 'var $1: Float');
        result = result.replace(/(\w+):\s*int/g, 'var $1: Int');

        // Parameter/Property Type Conversions
        result = result.replace(/:\s*string\b/g, ': String');
        result = result.replace(/:\s*boolean\b/g, ': Bool');
        result = result.replace(/\(\)\s*=>\s*void/g, '(() -> Void)');

        // Return type conversions
        result = result.replace(/->\s*float/g, '-> Float');
        result = result.replace(/->\s*int/g, '-> Int');
        result = result.replace(/->\s*string/g, '-> String');
        result = result.replace(/->\s*boolean/g, '-> Bool');
        result = result.replace(/->\s*void\b/g, '-> Void');

        // Array Types: Type[] -> [Type]
        result = result.replace(/\b([a-zA-Z0-9_]+)\[\]/g, '[$1]');

        // this -> self
        result = result.replace(/\bthis\b/g, 'self');

        // const/let -> let/var
        result = result.replace(/\blet\b/g, 'var');
        result = result.replace(/\bconst\b/g, 'let');

        // Swift has no 'new' keyword
        result = result.replace(/\bnew\s+/g, '');

        // Comparison operators: === -> ==
        result = result.replace(/===/g, '==');

        // Math.sqrt(x) -> (x).squareRoot()
        result = result.replace(/Math\.sqrt\((.*)\)/g, '($1).squareRoot()');

        // String interpolation: `... ${x} ...` -> "... \(x) ..."
        // Replace ${...} with \(...)
        result = result.replace(/\$\{(.*?)\}/g, '\\($1)');
        // Replace backticks with double quotes
        result = result.replace(/`(.*?)`/g, '"$1"');

        // Remove curly braces from inside parentheses (object literals/destructuring to named arguments)
        result = result.replace(/\(\s*\{/g, '(');
        result = result.replace(/\}\s*\)/g, ')');

        // Clean up 'var' from parameters (Swift doesn't allow 'var' in function signatures)
        result = result.replace(/(\(|\,)\s*var\s+/g, '$1 ');

        // Remove semicolons at end of lines
        result = result.replace(/;$/g, '');

        return result;
    }
}
