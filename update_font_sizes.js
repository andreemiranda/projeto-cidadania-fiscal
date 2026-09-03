const fs = require('fs');

let content = fs.readFileSync('lib/generatePdfReport.ts', 'utf8');

const scale = 1.6;

// Function to scale a number
const scaleNum = (match, num) => {
    return (parseFloat(num) * scale).toFixed(1).replace(/\.0$/, '');
};

// Scale doc.setFontSize(X)
content = content.replace(/setFontSize\(([\d.]+)\)/g, (match, num) => {
    return `setFontSize(${scaleNum(match, num)})`;
});

// Scale fontSize: X
content = content.replace(/fontSize:\s*([\d.]+)/g, (match, num) => {
    return `fontSize: ${scaleNum(match, num)}`;
});

// Scale currentY += X
content = content.replace(/currentY\s*\+=\s*([\d.]+)/g, (match, num) => {
    return `currentY += ${scaleNum(match, num)}`;
});

// Scale checkPageBreak(X)
content = content.replace(/checkPageBreak\(([\d.]+)\)/g, (match, num) => {
    return `checkPageBreak(${scaleNum(match, num)})`;
});

// Scale currentY + X in doc.text(..., margin, currentY + X)
// Actually just look for currentY \+ ([\d.]+)
content = content.replace(/currentY \+ ([\d.]+)/g, (match, num) => {
    return `currentY + ${scaleNum(match, num)}`;
});

// Scale splitMetodologia.length * 3.6
content = content.replace(/length \* ([\d.]+)/g, (match, num) => {
    return `length * ${scaleNum(match, num)}`;
});

// Scale cardH = 15;
content = content.replace(/cardH = ([\d.]+);/g, (match, num) => {
    return `cardH = ${scaleNum(match, num)};`;
});

fs.writeFileSync('lib/generatePdfReport.ts', content);
