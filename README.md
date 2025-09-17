# Notion to Obsidian Converter

A Node.js web application that converts Notion databases to Obsidian-compatible Markdown files using the Notion API.

## Features

- Web-based interface for easy database selection
- Converts Notion databases to Markdown files with frontmatter
- Preserves page properties as YAML frontmatter
- Supports various Notion block types (headings, paragraphs, lists, code blocks, etc.)
- Batch conversion of entire databases
- Real-time conversion progress and results

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Notion API Setup

#### Create a Notion Integration

1. Go to [Notion Developers](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name (e.g., "Obsidian Converter")
4. Select the workspace you want to use
5. Click "Submit"
6. Copy the "Internal Integration Token" - you'll need this for the `.env` file

#### Share Databases with Your Integration

For each database you want to convert:

1. Open the database in Notion
2. Click the "..." menu in the top right
3. Select "Add connections"
4. Find and select your integration
5. Click "Confirm"

**Important**: You must share each database individually with your integration, or the API won't be able to access them.

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit the `.env` file and add your Notion token:
   ```
   NOTION_TOKEN=secret_your_actual_token_here
   ```

### 4. Run the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Open your browser and go to `http://localhost:3000`
2. The configuration status will show if your Notion token is properly configured
3. Click "Refresh Databases" to load your available Notion databases
4. Select a database from the list
5. Optionally modify the output path (default is `./output`)
6. Click "Convert Selected Database"
7. Wait for the conversion to complete - this may take a few minutes for large databases

## Output Format

The converter creates:

- A folder named after your database
- Individual Markdown files for each page in the database
- YAML frontmatter containing:
  - Original Notion page ID
  - Creation and modification dates
  - All database properties

### Example Output

```markdown
---
notion_id: 12345678-1234-1234-1234-123456789012
created: 2023-01-01T00:00:00.000Z
updated: 2023-01-02T00:00:00.000Z
Status: In Progress
Priority: High
Tags: project, important
---

# Page Title

Page content converted to Markdown...
```

## Supported Notion Block Types

- Paragraphs
- Headings (H1, H2, H3)
- Bulleted lists
- Numbered lists
- Code blocks
- Quotes
- Basic text formatting

## Supported Property Types

- Rich text
- Numbers
- Select/Multi-select
- Dates
- Checkboxes
- URLs
- Email addresses
- Phone numbers

## Troubleshooting

### "Notion token not configured" Error

- Make sure your `.env` file exists and contains a valid `NOTION_TOKEN`
- Restart the server after updating the `.env` file

### "No databases found" or Empty Database List

- Ensure you've shared the databases with your Notion integration
- Check that your integration has the correct permissions
- Try refreshing the databases list

### Conversion Errors

- Large databases may take several minutes to convert
- Check the browser console for detailed error messages
- Ensure your Notion integration has access to all pages in the database

## File Structure

```
notiontoobsidian/
├── server.js              # Main server application
├── public/
│   └── index.html         # Web interface
├── package.json           # Node.js dependencies
├── .env.example          # Environment variables template
├── .env                  # Your actual environment variables (create this)
└── output/               # Default output directory (created automatically)
```

## API Endpoints

- `GET /` - Serves the web interface
- `GET /api/config` - Returns configuration status
- `GET /api/databases` - Returns list of available Notion databases
- `POST /api/convert/:databaseId` - Converts a specific database

## Notes

- This tool creates standard Markdown files that work well with Obsidian
- The YAML frontmatter is compatible with Obsidian's metadata system
- Files are organized in folders by database name
- All special characters in filenames are sanitized for filesystem compatibility

## Security

- Keep your `.env` file secure and never commit it to version control
- The Notion token provides access to your Notion workspace
- Consider using environment-specific tokens for different deployments
