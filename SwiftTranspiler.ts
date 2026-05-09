import { AbstractTranspiler } from './AbstractTranspiler';

export class SwiftTranspiler implements AbstractTranspiler {
    transpile(line: string): string {
        let result = line;

        // Type Aliases
        result = result.replace(/type\s+(\w+)\s*=\s*float/g, 'typealias $1 = Float');
        result = result.replace(/type\s+(\w+)\s*=\s*int/g, 'typealias $1 = Int');

        // Classes
        result = result.replace(/export\s+class\s+(\w+)/g, 'class $1');

        // Constructor to init
        result = result.replace(/constructor\s*\((.*)\)/g, 'init($1)');

        // Static methods
        result = result.replace(/static\s+(\w+)\s*\((.*)\)/g, 'static func $1($2)');

        // Instance methods (rough match for word followed by parentheses and space/bracket)
        // We exclude keywords like if, for, while, switch, constructor (already handled), return
        const methodRegex = /^(\s*)(?!(if|for|while|switch|return|init|constructor|static|class|export|const|let|var|type|import))(\w+)\s*\((.*)\)/g;
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

        // Return type conversions
        result = result.replace(/->\s*float/g, '-> Float');
        result = result.replace(/->\s*int/g, '-> Int');
        result = result.replace(/->\s*string/g, '-> String');
        result = result.replace(/->\s*boolean/g, '-> Bool');

        // this -> self
        result = result.replace(/this\./g, 'self.');

        // const/let -> let/var
        result = result.replace(/\bconst\b/g, 'let');
        result = result.replace(/\blet\b/g, 'var');

        // Swift has no 'new' keyword
        result = result.replace(/\bnew\s+/g, '');

        // Remove curly braces from inside parentheses (object literals/destructuring to named arguments)
        result = result.replace(/\(\s*\{(.*)\}\s*\)/g, '($1)');

        // Clean up 'var' from parameters (Swift doesn't allow 'var' in function signatures)
        result = result.replace(/(\(|\,)\s*var\s+/g, '$1 ');

        // Remove semicolons at end of lines
        result = result.replace(/;$/g, '');

        return result;
    }
}
