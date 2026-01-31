# StellarForge CMS Studio

This is the Sanity Studio for managing StellarForge Learn articles.

## Setup

1. Install dependencies:
   ```bash
   cd studio
   npm install
   ```

2. Run the studio locally:
   ```bash
   npm run dev
   ```
   The studio will be available at http://localhost:3333

3. Log in with your Sanity account when prompted.

## Deploying the Studio

You can deploy the studio to Sanity's free hosting:

```bash
npm run deploy
```

This will give you a URL like: `https://stellarforge.sanity.studio`

## Creating Content

1. Open the studio
2. Click "Article" in the sidebar
3. Click the "+" button to create a new article
4. Fill in:
   - **Title**: The article title
   - **Slug**: Click "Generate" to auto-create from title
   - **Description**: A short summary (max 300 chars)
   - **Category**: Choose from Basics, Science, Craft, or Case Studies
   - **Published Date**: When to show the article
   - **Featured**: Toggle on to show in Featured section
   - **Content**: Rich text editor with headings, links, images, and code blocks

## Content Types

### Text Formatting
- **Bold** and *italic* text
- `Code` inline snippets
- Block quotes
- Headings (H2, H3, H4)

### Media
- Images with alt text and captions
- Code blocks with syntax highlighting

### Links
- External links open in new tab
- Internal links for navigation

## GROQ Queries

Test queries in the Vision tool (plugin included):

```groq
// All articles
*[_type == "article"] | order(publishedDate desc)

// Featured articles
*[_type == "article" && featured == true]

// Single article by slug
*[_type == "article" && slug.current == "drake-equation"][0]
```
