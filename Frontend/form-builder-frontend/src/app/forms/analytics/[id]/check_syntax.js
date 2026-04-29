const fs = require('fs');
const content = fs.readFileSync('d:\\projects\\Form Builder Full App\\Frontend\\form-builder-frontend\\src\\app\\forms\\analytics\\[id]\\page.js', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') braces++;
  if (char === '}') braces--;
  if (char === '(') parens++;
  if (char === ')') parens--;
  if (char === '[') brackets++;
  if (char === ']') brackets--;
  
  if (braces < 0) console.log(`Extra brace at index ${i}`);
  if (parens < 0) console.log(`Extra paren at index ${i}`);
  if (brackets < 0) console.log(`Extra bracket at index ${i}`);
}

console.log(`Final counts - Braces: ${braces}, Parens: ${parens}, Brackets: ${brackets}`);
