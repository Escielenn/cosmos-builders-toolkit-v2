# Notion Integration Setup

This guide walks you through setting up Notion integration for the Cosmos Builders Toolkit.

## Prerequisites

- A Notion account
- Access to Supabase dashboard
- Admin access to your deployment

## Step 1: Create a Notion Integration

1. Go to [Notion Developers](https://www.notion.so/my-integrations)
2. Click **+ New integration**
3. Fill in the details:
   - **Name**: Cosmos Builders Toolkit
   - **Logo**: Upload your app logo (optional)
   - **Associated workspace**: Select your workspace
   - **Type**: **Public** (required for OAuth)
4. Click **Submit**

## Step 2: Configure OAuth Settings

In your integration settings:

1. Go to the **Distribution** tab
2. Enable **Public integration**
3. Fill in the required fields:
   - **Company name**: Your company name
   - **Website**: Your app URL
   - **Privacy policy URL**: Your privacy policy
   - **Terms of use URL**: Your terms of service
4. Under **OAuth Domain & URIs**:
   - **Redirect URIs**: Add your callback URL:
     - Development: `http://localhost:8080/api/notion/callback`
     - Production: `https://your-domain.com/api/notion/callback`
5. Under **Capabilities**, enable:
   - **Read content**
   - **Update content**
   - **Insert content**
   - **Read user information including email addresses** (optional)
6. Save changes

## Step 3: Get Your Credentials

From your integration page:
- Copy the **OAuth client ID**
- Copy the **OAuth client secret**

## Step 4: Configure Supabase

### Add Environment Variables

In Supabase Dashboard → Settings → Edge Functions:

Add these secrets:
```
NOTION_CLIENT_ID=your_client_id_here
NOTION_CLIENT_SECRET=your_client_secret_here
NOTION_REDIRECT_URI=https://your-domain.com/api/notion/callback
```

### Run Database Migration

The migration file is at: `supabase/migrations/20260129_add_notion_connections.sql`

Run it via the Supabase Dashboard SQL editor or using the CLI:
```bash
supabase db push
```

### Deploy Edge Functions

Deploy the Notion edge functions:
```bash
supabase functions deploy notion-auth-start
supabase functions deploy notion-auth-callback
supabase functions deploy notion-export
```

## Step 5: Test the Integration

1. Start your development server
2. Open a worksheet tool
3. Click the **Export** button
4. Select the **Notion** tab
5. Click **Connect Notion**
6. Authorize the integration in the popup
7. Export a worksheet to verify it creates a page

## Troubleshooting

### "Notion OAuth not configured"
- Verify the environment variables are set in Supabase Edge Functions settings
- Check that the values don't have extra spaces

### "Authorization expired"
- The OAuth state has a 15-minute timeout
- Try the connect flow again

### "No accessible pages found"
- The user needs to share at least one page with the integration
- In Notion, open a page → Click **...** → **Add connections** → Select your integration

### "Failed to create page"
- Check the Edge Function logs in Supabase Dashboard
- Verify the access token is being stored correctly

## Security Notes

- Access tokens are stored encrypted in Supabase
- Each user has their own connection
- Tokens can be revoked by disconnecting in the app or in Notion settings
- The integration only has access to pages explicitly shared with it
