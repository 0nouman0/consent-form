const fs = require("fs");
const readline = require("readline");

const fileStream = fs.createReadStream("C:\\Users\\moham\\.gemini\\antigravity-ide\\brain\\c1fcf2d2-cc9d-4240-a2ed-406767db4420\\.system_generated\\logs\\transcript.jsonl");
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let lineNum = 0;
rl.on("line", (line) => {
  lineNum++;
  if (line.toLowerCase().includes("amit") || line.toLowerCase().includes("fortis") || line.toLowerCase().includes("appolo")) {
    console.log(`Found on line ${lineNum}:`);
    const data = JSON.parse(line);
    console.log(`Step: ${data.step_index}, Source: ${data.source}, Type: ${data.type}`);
    // print snippet of content
    if (data.content) {
      console.log(`Content Snippet: ${data.content.slice(0, 300)}...`);
    }
    if (data.tool_calls) {
      console.log(`Tool Calls:`, JSON.stringify(data.tool_calls).slice(0, 300));
    }
  }
});
