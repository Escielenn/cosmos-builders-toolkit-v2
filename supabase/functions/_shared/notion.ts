// Notion OAuth configuration
export const NOTION_CLIENT_ID = Deno.env.get('NOTION_CLIENT_ID') || '';
export const NOTION_CLIENT_SECRET = Deno.env.get('NOTION_CLIENT_SECRET') || '';
export const NOTION_REDIRECT_URI = Deno.env.get('NOTION_REDIRECT_URI') || '';

// Notion API base URL
export const NOTION_API_BASE = 'https://api.notion.com/v1';
export const NOTION_OAUTH_BASE = 'https://api.notion.com/v1/oauth';

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string) {
  const credentials = btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`);

  const response = await fetch(`${NOTION_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: NOTION_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion token exchange failed: ${error}`);
  }

  return response.json();
}

// Create a page in Notion
export async function createNotionPage(
  accessToken: string,
  parentPageId: string,
  title: string,
  content: NotionBlock[]
) {
  const response = await fetch(`${NOTION_API_BASE}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ text: { content: title } }],
        },
      },
      children: content,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Notion page: ${error}`);
  }

  return response.json();
}

// Search for pages in workspace
export async function searchNotionPages(accessToken: string, query?: string) {
  const response = await fetch(`${NOTION_API_BASE}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      query: query || '',
      filter: { property: 'object', value: 'page' },
      page_size: 20,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to search Notion: ${error}`);
  }

  return response.json();
}

// Types for Notion blocks
export interface NotionBlock {
  object: 'block';
  type: string;
  [key: string]: unknown;
}

// Helper to create text blocks
export function createHeading1(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

export function createHeading2(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

export function createHeading3(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

export function createParagraph(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

export function createBulletedList(items: string[]): NotionBlock[] {
  return items.map((item) => ({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [{ type: 'text', text: { content: item } }],
    },
  }));
}

export function createDivider(): NotionBlock {
  return {
    object: 'block',
    type: 'divider',
    divider: {},
  };
}

export function createCallout(text: string, emoji = '💡'): NotionBlock {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: text } }],
      icon: { type: 'emoji', emoji },
    },
  };
}
