#!/usr/bin/env node
/**
 * OriginKit MCP Bridge Utility
 * Connects directly to https://mcp.originkit.dev/mcp with Bearer Token auth.
 */

const API_KEY = process.env.ORIGINKIT_API_KEY || 'cmp_live_93rR75CyawDJQjfhSWsRQP5RnjwP4hkq';
const ENDPOINT = 'https://mcp.originkit.dev/mcp';

async function mcpCall(method, params = {}) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MCP request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`MCP Error: ${JSON.stringify(data.error)}`);
  }
  return data.result;
}

export async function listComponents(category) {
  const res = await mcpCall('tools/call', {
    name: 'list_components',
    arguments: category ? { category } : {},
  });
  return JSON.parse(res.content[0].text);
}

export async function searchComponents(query) {
  const res = await mcpCall('tools/call', {
    name: 'search',
    arguments: { query },
  });
  return JSON.parse(res.content[0].text);
}

export async function getComponent(name, options = {}) {
  const res = await mcpCall('tools/call', {
    name: 'get_component',
    arguments: {
      name,
      stack: options.stack || 'vite',
      styling: options.styling || 'css',
      typescript: options.typescript ?? false,
      ...(options.preset ? { preset: options.preset } : {}),
    },
  });
  return res.content[0].text;
}

export async function fetchComponent(id) {
  const res = await mcpCall('tools/call', {
    name: 'fetch',
    arguments: { id },
  });
  return JSON.parse(res.content[0].text);
}

// CLI Interface
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  (async () => {
    try {
      if (command === 'list') {
        const category = args[1];
        const data = await listComponents(category);
        console.log(`Found ${data.count} components:`);
        data.components.slice(0, 20).forEach((c) => {
          console.log(`- ${c.name} (${c.displayName}): ${c.description?.slice(0, 80)}...`);
        });
        if (data.count > 20) {
          console.log(`... and ${data.count - 20} more.`);
        }
      } else if (command === 'search') {
        const query = args.slice(1).join(' ');
        if (!query) {
          console.error('Please specify a search query.');
          process.exit(1);
        }
        const data = await searchComponents(query);
        console.log(JSON.stringify(data, null, 2));
      } else if (command === 'get') {
        const name = args[1];
        if (!name) {
          console.error('Please specify a component name.');
          process.exit(1);
        }
        const code = await getComponent(name, { stack: 'vite', styling: 'css', typescript: false });
        console.log(code);
      } else {
        console.log(`
OriginKit MCP Utility:
  node scripts/originkit.mjs list [category]
  node scripts/originkit.mjs search <query>
  node scripts/originkit.mjs get <component-name>
        `);
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  })();
}
