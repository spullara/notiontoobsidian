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

        // Search specifically for data_source objects (much more efficient!)
        const response = await notion.search({
            filter: {
                property: 'object',
                value: 'data_source'
            },
            sort: {
                direction: 'ascending',
                timestamp: 'last_edited_time'
            }
        });



        // Map data_sources to database format
        const databases = response.results.map(db => ({
            id: db.id,
            title: db.title?.[0]?.plain_text || 'Untitled Database',
            url: db.url,
            properties: Object.keys(db.properties || {}),
            type: db.object // Include the type for debugging
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
        const { outputPath = './output', obsidianVaultPath, createNotionFolder = true, conversionId } = req.body;

        // Send initial progress
        if (conversionId) {
            sendProgress(conversionId, {
                stage: 'starting',
                message: 'Starting conversion...',
                progress: 0
            });
        }

        console.log('=== CONVERSION DEBUG ===');
        console.log('Database ID:', databaseId);
        console.log('Output Path:', outputPath);
        console.log('Obsidian Vault Path:', obsidianVaultPath);
        console.log('Create Notion Folder:', createNotionFolder);

        // Send progress update
        if (conversionId) {
            sendProgress(conversionId, {
                stage: 'searching',
                message: 'Finding database...',
                progress: 10
            });
        }

        // First, let's try to find this database in our search results to see its type
        const searchResponse = await notion.search({
            query: '',
            page_size: 100
        });

        const targetDb = searchResponse.results.find(item => item.id === databaseId);

        // Send progress update
        if (conversionId) {
            sendProgress(conversionId, {
                stage: 'retrieving',
                message: 'Retrieving database information...',
                progress: 20
            });
        }

        // Try different approaches based on object type
        let database;
        if (targetDb?.object === 'data_source') {
            try {
                // For data_source, we might need to use a different endpoint
                database = await notion.request({
                    path: `data_sources/${databaseId}`,
                    method: 'GET'
                });
            } catch (error) {
                database = await notion.databases.retrieve({ database_id: databaseId });
            }
        } else {
            database = await notion.databases.retrieve({ database_id: databaseId });
        }

        console.log('Database retrieved:', {
            id: database.id,
            object: database.object,
            title: database.title?.[0]?.plain_text || 'No title',
            propertiesCount: Object.keys(database.properties || {}).length
        });

        const databaseTitle = database.title?.[0]?.plain_text || 'Untitled Database';

        // Send progress update
        if (conversionId) {
            sendProgress(conversionId, {
                stage: 'querying',
                message: `Fetching pages from "${databaseTitle}"...`,
                progress: 30
            });
        }

        // Get all pages from the database/data_source
        const pages = [];
        let cursor;
        let pageCount = 0;

        do {
            let response;
            if (targetDb?.object === 'data_source') {
                // For data_source, use the data sources query endpoint
                response = await notion.request({
                    path: `data_sources/${databaseId}/query`,
                    method: 'POST',
                    body: {
                        start_cursor: cursor,
                        page_size: 100
                    }
                });
            } else {
                response = await notion.databases.query({
                    database_id: databaseId,
                    start_cursor: cursor,
                    page_size: 100
                });
            }

            pages.push(...response.results);
            cursor = response.next_cursor;
            pageCount += response.results.length;

            // Send progress update for page fetching
            if (conversionId) {
                sendProgress(conversionId, {
                    stage: 'querying',
                    message: `Fetched ${pageCount} pages from "${databaseTitle}"...`,
                    progress: 30 + (cursor ? 10 : 20) // 30-50% for fetching
                });
            }
        } while (cursor);

        // Determine the final output path
        let finalOutputPath;
        if (obsidianVaultPath) {
            // Use Obsidian vault path
            if (createNotionFolder) {
                finalOutputPath = path.join(obsidianVaultPath, 'Notion Imports', sanitizeFilename(databaseTitle));
            } else {
                finalOutputPath = path.join(obsidianVaultPath, sanitizeFilename(databaseTitle));
            }
        } else {
            // Use regular output path
            finalOutputPath = path.join(outputPath, sanitizeFilename(databaseTitle));
        }


        await fs.mkdir(finalOutputPath, { recursive: true });

        // Send progress update
        if (conversionId) {
            sendProgress(conversionId, {
                stage: 'converting',
                message: `Converting ${pages.length} pages to Markdown...`,
                progress: 50,
                totalPages: pages.length
            });
        }

        // Convert each page
        const convertedFiles = [];
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            try {
                const fileName = await convertPageToMarkdown(page, finalOutputPath);
                convertedFiles.push(fileName);

                // Send progress update every 10 pages or on last page
                if (conversionId && (i % 10 === 0 || i === pages.length - 1)) {
                    const progress = 50 + ((i + 1) / pages.length) * 40; // 50-90% for conversion
                    sendProgress(conversionId, {
                        stage: 'converting',
                        message: `Converted ${i + 1}/${pages.length} pages...`,
                        progress: Math.round(progress),
                        currentPage: i + 1,
                        totalPages: pages.length
                    });
                }
            } catch (error) {
                console.error(`Error converting page ${page.id}:`, error);
            }
        }

        // Send final progress update
        if (conversionId) {
            sendProgress(conversionId, {
                stage: 'complete',
                message: `Conversion complete! Created ${convertedFiles.length} files.`,
                progress: 100,
                totalPages: pages.length,
                filesCreated: convertedFiles.length
            });

            // Clean up the progress stream
            if (global.progressStreams) {
                global.progressStreams.delete(conversionId);
            }
        }

        res.json({
            success: true,
            database: databaseTitle,
            filesCreated: convertedFiles.length,
            outputPath: finalOutputPath,
            obsidianIntegration: !!obsidianVaultPath,
            files: convertedFiles,
            conversionId: conversionId
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

// SSE endpoint for conversion progress
app.get('/api/progress/:conversionId', (req, res) => {
    const { conversionId } = req.params;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Store the response object for this conversion
    if (!global.progressStreams) {
        global.progressStreams = new Map();
    }
    global.progressStreams.set(conversionId, res);

    // Clean up when client disconnects
    req.on('close', () => {
        global.progressStreams.delete(conversionId);
    });
});

// Helper function to send progress updates
function sendProgress(conversionId, data) {
    if (global.progressStreams && global.progressStreams.has(conversionId)) {
        const res = global.progressStreams.get(conversionId);
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
            console.error(`Progress stream error for ${conversionId}:`, error.message);
            global.progressStreams.delete(conversionId);
        }
    }
}

// Initialize clients on startup
initializeClients();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to configure your .env file with the required tokens');
});
