import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import {
  searchNotionPages,
  NotionBlock,
  createHeading1,
  createHeading2,
  createHeading3,
  createParagraph,
  createBulletedList,
  createDivider,
  createCallout,
  NOTION_API_BASE,
} from '../_shared/notion.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.0';

// Creates a worksheet as a Notion page
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Get request body
    const { toolName, worldName, worksheetTitle, data, parentPageId } = await req.json();

    if (!toolName || !data) {
      throw new Error('Missing required fields: toolName and data');
    }

    // Get user's Notion connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from('notion_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      throw new Error('Notion not connected. Please connect your Notion workspace first.');
    }

    // Build page title
    const pageTitle = worksheetTitle || `${toolName} - ${worldName || 'Unnamed World'}`;

    // Convert worksheet data to Notion blocks
    const blocks = convertDataToBlocks(toolName, worldName, data);

    // Create the page in Notion
    // If no parentPageId provided, create at workspace root (search for a page to use as parent)
    let parent;
    if (parentPageId) {
      parent = { page_id: parentPageId };
    } else {
      // Try to find or create a "Cosmos Builders Toolkit" page
      const searchResult = await searchNotionPages(connection.access_token, 'Cosmos Builders Toolkit');

      if (searchResult.results && searchResult.results.length > 0) {
        parent = { page_id: searchResult.results[0].id };
      } else {
        // Create at workspace level - requires database_id, but we'll use page creation differently
        // For simplicity, we'll create it in the first accessible page
        const anyPages = await searchNotionPages(connection.access_token, '');
        if (anyPages.results && anyPages.results.length > 0) {
          parent = { page_id: anyPages.results[0].id };
        } else {
          throw new Error('No accessible pages found in your Notion workspace. Please share at least one page with the integration.');
        }
      }
    }

    // Create the page
    const response = await fetch(`${NOTION_API_BASE}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent,
        icon: { type: 'emoji', emoji: '🌌' },
        properties: {
          title: {
            title: [{ text: { content: pageTitle } }],
          },
        },
        children: blocks.slice(0, 100), // Notion limits to 100 blocks per request
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Notion API error:', error);
      throw new Error('Failed to create page in Notion');
    }

    const page = await response.json();

    // If there are more than 100 blocks, append them
    if (blocks.length > 100) {
      const remainingBlocks = blocks.slice(100);
      for (let i = 0; i < remainingBlocks.length; i += 100) {
        const batch = remainingBlocks.slice(i, i + 100);
        await fetch(`${NOTION_API_BASE}/blocks/${page.id}/children`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({ children: batch }),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        pageId: page.id,
        pageUrl: page.url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notion export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Convert worksheet data to Notion blocks
function convertDataToBlocks(
  toolName: string,
  worldName: string | undefined,
  data: Record<string, unknown>
): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  // Add header
  blocks.push(createCallout(`Generated from ${toolName} worksheet`, '🌌'));

  if (worldName) {
    blocks.push(createParagraph(`World: ${worldName}`));
  }

  blocks.push(createParagraph(`Exported: ${new Date().toLocaleDateString()}`));
  blocks.push(createDivider());

  // Process data recursively
  processDataObject(data, blocks, 1);

  return blocks;
}

function processDataObject(
  obj: Record<string, unknown>,
  blocks: NotionBlock[],
  depth: number
): void {
  for (const [key, value] of Object.entries(obj)) {
    // Skip internal fields
    if (key.startsWith('_') || key === 'id') continue;

    const label = formatLabel(key);

    if (value === null || value === undefined || value === '') {
      continue; // Skip empty values
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Nested object - create section header
      if (depth === 1) {
        blocks.push(createHeading2(label));
      } else {
        blocks.push(createHeading3(label));
      }
      processDataObject(value as Record<string, unknown>, blocks, depth + 1);
      blocks.push(createDivider());
    } else if (Array.isArray(value)) {
      // Array - create list
      if (value.length > 0) {
        blocks.push(createHeading3(label));
        if (typeof value[0] === 'object') {
          // Array of objects
          value.forEach((item, index) => {
            blocks.push(createParagraph(`${index + 1}.`));
            if (typeof item === 'object' && item !== null) {
              processDataObject(item as Record<string, unknown>, blocks, depth + 1);
            } else {
              blocks.push(createParagraph(String(item)));
            }
          });
        } else {
          // Array of primitives
          blocks.push(...createBulletedList(value.map(String)));
        }
      }
    } else {
      // Primitive value
      const valueStr = String(value);
      if (valueStr.length > 200) {
        // Long text - use separate paragraph
        blocks.push(createHeading3(label));
        blocks.push(createParagraph(valueStr));
      } else {
        // Short value - inline
        blocks.push(createParagraph(`**${label}:** ${valueStr}`));
      }
    }
  }
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1') // camelCase to spaces
    .replace(/[_-]/g, ' ')      // snake_case/kebab-case to spaces
    .replace(/^\w/, (c) => c.toUpperCase()) // capitalize first letter
    .trim();
}
