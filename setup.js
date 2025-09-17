/*
 * Copyright 2024 Sam Pullara
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Notion to Obsidian Converter Setup\n');

async function setup() {
    try {
        // Check if .env already exists
        if (fs.existsSync('.env')) {
            console.log('✅ .env file already exists');
            const answer = await question('Do you want to update it? (y/n): ');
            if (answer.toLowerCase() !== 'y') {
                console.log('Setup cancelled.');
                rl.close();
                return;
            }
        }

        console.log('\n📝 Let\'s configure your environment variables:\n');
        
        console.log('1. First, you need to create a Notion integration:');
        console.log('   - Go to https://www.notion.so/my-integrations');
        console.log('   - Click "New integration"');
        console.log('   - Give it a name and select your workspace');
        console.log('   - Copy the "Internal Integration Token"\n');
        
        const notionToken = await question('Enter your Notion Integration Token: ');
        
        if (!notionToken.startsWith('secret_')) {
            console.log('⚠️  Warning: Notion tokens usually start with "secret_"');
        }
        
        const port = await question('Enter port number (default 3000): ') || '3000';
        
        // Create .env file
        const envContent = `# Notion API Configuration
NOTION_TOKEN=${notionToken}

# Server Configuration
PORT=${port}

# Optional: Specify a default output path for converted files
# OBSIDIAN_VAULT_PATH=C:/path/to/your/obsidian/vault
`;

        fs.writeFileSync('.env', envContent);
        console.log('\n✅ .env file created successfully!');
        
        console.log('\n📋 Next steps:');
        console.log('1. Share your Notion databases with the integration:');
        console.log('   - Open each database in Notion');
        console.log('   - Click "..." menu → "Add connections"');
        console.log('   - Select your integration');
        console.log('2. Run "npm start" to start the application');
        console.log('3. Open http://localhost:' + port + ' in your browser\n');
        
        const startNow = await question('Start the application now? (y/n): ');
        if (startNow.toLowerCase() === 'y') {
            console.log('\n🚀 Starting the application...\n');
            require('./server.js');
        }
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        rl.close();
    }
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

setup();
