# Rise2 Transpiler

Rise2 is a transpiler project for converting code between languages.

## Installation

Ensure you have [Node.js](https://nodejs.org/) installed, then install the dependencies:

```bash
npm install
```

## Usage

Run the transpiler using `ts-node` through `npx`:

```bash
npx ts-node rise2.ts --input-file <input_path> --output-file <output_path> --target-language <language>
```

### Arguments

- `--input-file`: Path to the source file to be transpiled.
- `--output-file`: Path where the transpiled code will be saved.
- `--target-language`: The language to transpile to (e.g., `haxe`).

### Example

```bash
npx ts-node rise2.ts --input-file input.ts --output-file output.hx --target-language haxe
```

## Project Architecture

- **rise2.ts**: The main CLI entry point that handles argument parsing and file I/O.
- **AbstractTranspiler.ts**: The interface that all transpiler implementations must follow.
- **NullTranspiler.ts**: A basic implementation of `AbstractTranspiler` that returns the input as-is.
- **SwiftTranspiler.ts**: An implementation of `AbstractTranspiler` that converts TypeScript code to Swift.

## TypeScript to Swift Transpilation (`SwiftTranspiler.ts`)

The `SwiftTranspiler` performs a line-by-line conversion of TypeScript code into Swift. It uses a series of regular expressions to handle the following transformations:

- **Type Mappings**: Converts TS types to Swift types (e.g., `number` -> `Double`, `float` -> `Float`, `int` -> `Int`, `boolean` -> `Bool`, `string` -> `String`).
- **Class Declarations**: Converts `export class` to `class`.
- **Constructors**: Converts `constructor(...)` to `init(...)`.
- **Methods**: Converts `static method(...)` to `static func method(...)` and instance methods to `func method(...)`. It also converts TS return type syntax (`: Type`) to Swift arrow syntax (`-> Type`) and removes `void` return types.
- **Properties & Variables**: Replaces `const` with `let`, and `let` with `var`. Maps property type definitions.
- **Keywords**: Replaces the `this` keyword with `self`. Removes the `new` keyword, as Swift does not use it for instantiation.
- **Operators & Methods**: Converts strict equality `===` to `==`. Replaces `Math.sqrt(...)` with `(...).squareRoot()`.
- **String Interpolation**: Converts TypeScript template literals (e.g., \`x: ${val}\`) into Swift string interpolation (`"x: \(val)"`).
- **Object Destructuring**: Simplifies object literals/destructuring passed as arguments by removing curly braces (e.g., `({ x: 0 })` becomes `( x: 0 )`), mapping TS object arguments to Swift named parameters.
- **Directives**: Supports the `// Rise2: ignore-next-line` directive to completely skip transpiling the following line.
