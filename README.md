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
