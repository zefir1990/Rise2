import * as fs from 'fs';

function main() {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.error('Usage: ts-node rise2.ts <input_file_path> <output_file_path> <target_language>');
        process.exit(1);
    }

    const inputPath = args[0];
    const outputPath = args[1];
    const targetLanguage = args[2];

    try {
        const data = fs.readFileSync(inputPath, 'utf8');
        fs.writeFileSync(outputPath, data, 'utf8');
        console.log(`Successfully copied ${inputPath} to ${outputPath} (Target Language: ${targetLanguage})`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
