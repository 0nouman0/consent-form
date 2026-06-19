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
  if (lineNum === 553) {
    const data = JSON.parse(line);
    const args = JSON.parse(data.tool_calls[0].args.Arguments);
    const query = args.query;
    console.log(query.slice(query.indexOf("TEST 2")));
  }
});
