const express = require('express');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Notion client
let notion;

// Initialize clients when tokens are available
function initializeClients() {
    if (process.env.NOTION_TOKEN) {
        notion = new Client({
            auth: process.env.NOTION_TOKEN,
        });
    }
}

// Route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to get Notion databases
app.get('/api/databases', async (req, res) => {
    try {
        if (!notion) {
            return res.status(400).json({ error: 'Notion token not configured' });
        }

        const response = await notion.search({
            filter: {
                property: 'object',
                value: 'database'
            }
        });

        const databases = response.results.map(db => ({
            id: db.id,
            title: db.title?.[0]?.plain_text || 'Untitled Database',
            url: db.url,
            properties: Object.keys(db.properties || {})
        }));

        res.json(databases);
    } catch (error) {
        console.error('Error fetching databases:', error);
        res.status(500).json({ error: 'Failed to fetch databases' });
    }
});

// Route to convert a database
app.post('/api/convert/:databaseId', async (req, res) => {
    try {
        if (!notion) {
            return res.status(400).json({ error: 'Notion token not configured' });
        }

        const { databaseId } = req.params;
        const { outputPath = './output' } = req.body;

        // Get database info
        const database = await notion.databases.retrieve({ database_id: databaseId });
        const databaseTitle = database.title?.[0]?.plain_text || 'Untitled Database';

        // Get all pages from the database
        const pages = [];
        let cursor;
        
        do {
            const response = await notion.databases.query({
                database_id: databaseId,
                start_cursor: cursor,
                page_size: 100
            });
            
            pages.push(...response.results);
            cursor = response.next_cursor;
        } while (cursor);

        // Create output directory
        const dbOutputPath = path.join(outputPath, sanitizeFilename(databaseTitle));
        await fs.mkdir(dbOutputPath, { recursive: true });

        // Convert each page
        const convertedFiles = [];
        for (const page of pages) {
            try {
                const fileName = await convertPageToMarkdown(page, dbOutputPath);
                convertedFiles.push(fileName);
            } catch (error) {
                console.error(`Error converting page ${page.id}:`, error);
            }
        }

        res.json({
            success: true,
            database: databaseTitle,
            filesCreated: convertedFiles.length,
            outputPath: dbOutputPath,
            files: convertedFiles
        });

    } catch (error) {
        console.error('Error converting database:', error);
        res.status(500).json({ error: 'Failed to convert database' });
    }
});

// Helper function to convert a Notion page to Markdown
async function convertPageToMarkdown(page, outputPath) {
    try {
        // Get page title
        const titleProperty = Object.values(page.properties).find(prop => prop.type === 'title');
        const title = titleProperty?.title?.[0]?.plain_text || `Page ${page.id}`;
        
        // Get page content
        const blocks = await getPageBlocks(page.id);
        
        // Convert to markdown
        let markdown = `# ${title}\n\n`;
        
        // Add properties as frontmatter
        markdown += '---\n';
        markdown += `notion_id: ${page.id}\n`;
        markdown += `created: ${page.created_time}\n`;
        markdown += `updated: ${page.last_edited_time}\n`;
        
        // Add other properties
        for (const [key, property] of Object.entries(page.properties)) {
            if (property.type !== 'title') {
                const value = extractPropertyValue(property);
                if (value) {
                    markdown += `${key}: ${value}\n`;
                }
            }
        }
        markdown += '---\n\n';
        
        // Add content blocks
        markdown += await convertBlocksToMarkdown(blocks);
        
        // Save file
        const fileName = `${sanitizeFilename(title)}.md`;
        const filePath = path.join(outputPath, fileName);
        await fs.writeFile(filePath, markdown, 'utf8');
        
        return fileName;
    } catch (error) {
        console.error('Error converting page to markdown:', error);
        throw error;
    }
}

// Helper function to get all blocks from a page
async function getPageBlocks(pageId) {
    const blocks = [];
    let cursor;
    
    do {
        const response = await notion.blocks.children.list({
            block_id: pageId,
            start_cursor: cursor,
            page_size: 100
        });
        
        blocks.push(...response.results);
        cursor = response.next_cursor;
    } while (cursor);
    
    return blocks;
}

// Helper function to extract property values
function extractPropertyValue(property) {
    switch (property.type) {
        case 'rich_text':
            return property.rich_text?.map(text => text.plain_text).join('') || '';
        case 'number':
            return property.number;
        case 'select':
            return property.select?.name || '';
        case 'multi_select':
            return property.multi_select?.map(item => item.name).join(', ') || '';
        case 'date':
            return property.date?.start || '';
        case 'checkbox':
            return property.checkbox;
        case 'url':
            return property.url || '';
        case 'email':
            return property.email || '';
        case 'phone_number':
            return property.phone_number || '';
        default:
            return '';
    }
}

// Helper function to convert blocks to markdown
async function convertBlocksToMarkdown(blocks) {
    let markdown = '';
    
    for (const block of blocks) {
        switch (block.type) {
            case 'paragraph':
                const text = block.paragraph?.rich_text?.map(text => text.plain_text).join('') || '';
                markdown += `${text}\n\n`;
                break;
            case 'heading_1':
                const h1Text = block.heading_1?.rich_text?.map(text => text.plain_text).join('') || '';
                markdown += `# ${h1Text}\n\n`;
                break;
            case 'heading_2':
                const h2Text = block.heading_2?.rich_text?.map(text => text.plain_text).join('') || '';
                markdown += `## ${h2Text}\n\n`;
                break;
            case 'heading_3':
                const h3Text = block.heading_3?.rich_text?.map(text => text.plain_text).join('') || '';
                markdown += `### ${h3Text}\n\n`;
                break;
            case 'bulleted_list_item':
                const bulletText = block.bulleted_list_item?.rich_text?.map(text => text.plain_text).join('') || '';
                markdown += `- ${bulletText}\n`;
                break;
            case 'numbered_list_item':
                const numberedText = block.numbered_list_item?.rich_text?.map(text => text.plain_text).join('') || '';
                markdown += `1. ${numberedText}\n`;
                break;
            case 'code':
                const codeText = block.code?.rich_text?.map(text => text.plain_text).join('') || '';
                const language = block.code?.language || '';
                markdown += `\`\`\`${language}\n${codeText}\n\`\`\`\n\n`;
                break;
            case 'quote':
                const quoteText = block.quote?.rich_text?.map(text => text.plain_text).join('') || '';
                markdown += `> ${quoteText}\n\n`;
                break;
            default:
                // Handle other block types as plain text
                if (block[block.type]?.rich_text) {
                    const defaultText = block[block.type].rich_text.map(text => text.plain_text).join('') || '';
                    if (defaultText) {
                        markdown += `${defaultText}\n\n`;
                    }
                }
        }
    }
    
    return markdown;
}

// Helper function to sanitize filenames
function sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
}

// Route to check configuration
app.get('/api/config', (req, res) => {
    res.json({
        notionConfigured: !!process.env.NOTION_TOKEN,
        obsidianConfigured: !!process.env.OBSIDIAN_VAULT_PATH
    });
});

// Initialize clients on startup
initializeClients();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to configure your .env file with the required tokens');
});
