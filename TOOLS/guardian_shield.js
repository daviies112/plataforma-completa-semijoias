/**
 * THE GUARDIAN SHIELD (v1.0)
 * Static Analysis & Robustness Scanner.
 * 
 * Usage: node guardian_shield.js "path/to/file.js"
 */

const fs = require('fs');
const path = require('path');

function scanFile(filePath) {
    if (!fs.existsSync(filePath)) return `ERROR: File ${filePath} not found.`;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const report = [];

    console.log(`🛡️ Guardian: Scanning ${filePath}...`);

    // 1. SQL Injection Check
    if (content.match(/SELECT .* FROM .* WHERE .* \+ /i) || content.match(/INSERT INTO .* VALUES .* \+ /i)) {
        report.push("🚨 CRITICAL: Possible SQL Injection detected (String concatenation in SQL). Use parameterized queries.");
    }

    // 2. Exception Swallowing
    if (content.match(/catch\s*\(\w+\)\s*{\s*}/)) {
        report.push("⚠️ WARNING: Empty catch block detected. Always log or handle errors.");
    }

    // 3. Hardcoded Secrets
    if (content.match(/sk_live_[0-9a-zA-Z]+/)) {
        report.push("🚨 CRITICAL: Hardcoded Stripe Key detected.");
    }

    // 4. Console.log in Production
    if (content.match(/console\.log/)) {
        report.push("ℹ️ INFO: generic console.log found. Consider using a structured logger.");
    }

    if (report.length === 0) {
        return "✅ ROBUSTNESS CHECK PASSED: No critical issues found.";
    } else {
        return report.join('\n');
    }
}

const targetFile = process.argv[2];
if (!targetFile) {
    console.log("Usage: node guardian_shield.js <file_path>");
} else {
    console.log(scanFile(targetFile));
}
