/**
 * ANTIGRAVITY MCP INSPECTOR
 * Queries the Remote VPS MCP to check its state.
 */

// const fetch = require('node-fetch'); // Removed: using native fetch in Node 24+

const MCP_URL = 'http://103.199.187.145:3000';

async function checkMCP() {
    console.log(`🔍 Inspecting MCP at ${MCP_URL}...`);

    try {
        // 1. Check Status
        console.log("👉 Checking /status...");
        const statusRes = await fetch(`${MCP_URL}/status`);
        const rawText = await statusRes.text();
        console.log("📥 RAW RESPONSE:", rawText.substring(0, 500)); // Log first 500 chars

        if (statusRes.ok) {
            try {
                const status = JSON.parse(rawText);
                console.log("✅ STATUS:", JSON.stringify(status, null, 2));
            } catch (e) {
                console.log("⚠️ Response is not JSON.");
            }
        } else {
            console.log(`❌ /status failed: ${statusRes.status}`);
        }

        // 2. Check Agents/Skills (Hypothetical Endpoint)
        console.log("👉 Checking /agents (Hypothetical)...");
        const agentsRes = await fetch(`${MCP_URL}/agents`);
        if (agentsRes.ok) {
            const agents = await agentsRes.json();
            console.log("✅ AGENTS:", JSON.stringify(agents, null, 2));
        } else {
            console.log(`⚠️ /agents endpoint not found or error: ${agentsRes.status}`);
        }

    } catch (error) {
        console.log("🔥 CRIICAL ERROR: Could not connect to MCP.");
        console.log("Error details:", error.message);
    }
}

// N8N Config
const N8N_URL = 'http://103.199.187.145:5678/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YjhjOWI5OS05ZjgzLTRlM2QtOGRjMy00ZDY4ZGRmMzk4ODkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcxNTA5NzU3fQ.HH3iNuun2x3C689KuHfJvblXwiXBjrJqD9F_UHBCwVQ';

async function checkN8N() {
    console.log(`\n🔍 Inspecting N8N at ${N8N_URL}...`);
    try {
        const res = await fetch(`${N8N_URL}/workflows`, {
            headers: { 'X-N8N-API-KEY': N8N_KEY }
        });
        
        if (res.ok) {
            const data = await res.json();
            const workflows = data.data;
            console.log(`✅ N8N Online. Found ${workflows.length} workflows.`);
            
            // Check for V6
            const v6 = workflows.find(w => w.name.includes('V6') || w.name.includes('SPECIAL_OPS'));
            if (v6) {
                console.log("🚀 FOUND V6 WORKFLOW:", v6.name, "(Active: " + v6.active + ")");
            } else {
                console.log("⚠️ V6 Workflow NOT found. Latest might be older versions.");
                workflows.forEach(w => console.log(`   - ${w.name} (Active: ${w.active})`));
            }
        } else {
            console.log(`❌ N8N API failed: ${res.status} ${res.statusText}`);
        }
    } catch (e) {
        console.log(`🔥 N8N Connection Error: ${e.message}`);
    }
}

// Node 18+ has native fetch, but if environment is older we handle it
if (!global.fetch) {
    console.log("⚠️ Native fetch not found. This environment might be too old.");
} else {
    // checkMCP(); // Skip MCP for now as we know it's returning HTML
    checkN8N();
}
