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





        // Remove default values from parameters (Rust doesn't support them)
        result = result.replace(/:\s*([A-Za-z0-9_]+)\s*=\s*[^,)]+/g, ': $1');



        // Array Types: Type[] -> Vec<Type>
        result = result.replace(/\b([a-zA-Z0-9_]+)\[\]/g, 'Vec<$1>');

        // this -> self
        result = result.replace(/\bthis\b/g, 'self');

        // const/let -> let mut
        result = result.replace(/\blet\b/g, 'let mut');
        result = result.replace(/\bconst\b/g, 'let mut');


        // Swift has no 'new' keyword, Rust uses ::new()
        result = result.replace(/\bnew\s+(\w+)\((.*)\)/g, '$1::new($2)');

        // Comparison operators: === -> ==
        result = result.replace(/===/g, '==');

        // Remove unnecessary parentheses from if statements
        result = result.replace(/if\s*\((.*)\)\s*\{/g, 'if $1 {');


        // Math.sqrt(x) -> (x as f64).sqrt()
        result = result.replace(/Math\.sqrt\((.*)\)/g, '($1 as f64).sqrt()');

        // String interpolation: `... ${x} ...` -> format!("... {} ...", x)
        result = result.replace(/`(.*?)`/g, (match, p1) => {
            const args: string[] = [];
            const formatStr = p1.replace(/\$\{(.*?)\}/g, (_: string, p: string) => {
                args.push(p.trim().replace(/^this\./, 'self.'));
                return '{}';
            });
            if (args.length > 0) {
                return 'format!("' + formatStr + '", ' + args.join(', ') + ')';
            }
            return '"' + p1 + '"';
        });




        // Remove curly braces from inside parentheses
        result = result.replace(/(\(|\,)\s*\{/g, '$1 ');
        result = result.replace(/\}\s*(\)|\,)/g, ' $1');


        return result;
    }

    transpileFile(inputPath: string, outputPath: string): void {
        const data = fs.readFileSync(inputPath, 'utf8');
        const lines = data.split('\n');
        
        let transpiledLines = lines.map(line => this.transpile(line)).filter(line => line !== '__SKIP_LINE__');
        
        let inStruct = false;
        let structName = "";
        let newLines: string[] = [];
        let implLines: string[] = [];
        
        for (let i = 0; i < transpiledLines.length; i++) {
            let line = transpiledLines[i];
            
            const structMatch = line.match(/pub struct (\w+) \{/);
            if (structMatch) {
                inStruct = true;
                structName = structMatch[1];
                newLines.push('#[derive(Default, Clone, Copy)]');
                newLines.push(line);
                continue;
            }
            
            if (inStruct) {
                if (line.trim() === '}') {
                    inStruct = false;
                    newLines.push(line);
                    
                    if (implLines.length > 0) {
                        newLines.push('');
                        newLines.push(`impl ${structName} {`);
                        newLines.push(...implLines);
                        newLines.push(`}`);
                        implLines = [];
                    }
                    continue;
                }
                
                if (line.includes(' fn ')) {
                    const isNew = line.includes('fn new');
                    
                    // Add `mut` to parameters in the signature
                    line = line.replace(/\((.*?)\)/, (match, params) => {
                        const newParams = params.split(',').map((p: string) => {
                            p = p.trim();
                            if (!p || p === '&mut self' || p === '&self' || p.startsWith('mut ')) return p;
                            if (p.includes(':')) {
                                return 'mut ' + p;
                            }
                            return p;
                        }).join(', ');
                        return `(${newParams})`;
                    });

                    implLines.push(line);
                    
                    if (isNew) {
                        implLines.push('        let mut _self = Self::default();');
                    }

                    
                    let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
                    
                    while (braceCount > 0 && i + 1 < transpiledLines.length) {
                        i++;
                        let nextLine = transpiledLines[i];
                        
                        if (isNew) {
                            nextLine = nextLine.replace(/\bself\./g, '_self.');
                        } else {
                            // Replace standalone `self` with `*self` in calls (only in non-constructor methods)
                            nextLine = nextLine.replace(/\bself\b(?!\.)/g, '*self');
                        }

                        if (!nextLine.includes(' fn ')) {
                            // Remove labels from function calls (e.g. `AppVector3::new( x: 0 )` -> `AppVector3::new( 0 )`)
                            nextLine = nextLine.replace(/(\(|\,\s*)\s*\w+:\s*/g, '$1');
                        } else {
                            // If it is a function signature (can happen with nested functions, though unlikely here), parse and add `mut` to parameters
                            nextLine = nextLine.replace(/\((.*?)\)/, (match, params) => {
                                const newParams = params.split(',').map((p: string) => {
                                    p = p.trim();
                                    if (!p || p === '&mut self' || p === '&self' || p.startsWith('mut ')) return p;
                                    if (p.includes(':')) {
                                        return 'mut ' + p;
                                    }
                                    return p;
                                }).join(', ');
                                return `(${newParams})`;
                            });
                        }
                        
                        if (isNew) {
                            // Check if this is the closing brace of `new`
                            const nextBraceCount = braceCount + (nextLine.match(/\{/g) || []).length - (nextLine.match(/\}/g) || []).length;
                            if (nextBraceCount === 0) {
                                implLines.push('        return _self;');
                            }
                            braceCount = nextBraceCount;
                        } else {
                            braceCount += (nextLine.match(/\{/g) || []).length - (nextLine.match(/\}/g) || []).length;
                        }
                        
                        implLines.push(nextLine);
                    }
                } else {

                    // Fields in Rust structs are separated by commas
                    line = line.replace(/;/g, ',');
                    newLines.push(line);
                }
            } else {
                newLines.push(line);
            }
        }

        
        fs.writeFileSync(outputPath, newLines.join('\n'), 'utf8');
    }
}
