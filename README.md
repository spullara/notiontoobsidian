# Notion to Obsidian Converter

**Easily transfer your Notion databases to Obsidian with one click!**

This tool converts your Notion databases into Obsidian-compatible Markdown files, preserving all your data, properties, and formatting. Perfect for migrating from Notion to Obsidian or keeping both in sync.

## ✨ What It Does

- 🔄 **One-click conversion** of entire Notion databases
- 📁 **Direct import** to your Obsidian vault (no manual copying!)
- 📊 **Real-time progress bar** so you know exactly what's happening
- 🏷️ **Preserves all properties** as YAML frontmatter (tags, dates, etc.)
- 📝 **Converts all content** (headings, lists, code blocks, quotes, etc.)
- 🎯 **Web interface** - no command line needed!

## 🚀 Quick Start (5 minutes)

### Step 1: Download and Setup
1. **Download this project** (green "Code" button → "Download ZIP")
2. **Extract the files** to a folder like `C:/NotionConverter/`
3. **Open Command Prompt** in that folder
4. **Run**: `npm install` (installs required components)

### Step 2: Connect to Notion
1. **Go to**: https://www.notion.so/my-integrations
2. **Click "New integration"**
3. **Name it**: "Obsidian Converter"
4. **Select your workspace** and click "Submit"
5. **Copy the token** (starts with `secret_`)

### Step 3: Configure the App
1. **Run**: `npm run setup` (guided setup)
2. **Paste your token** when prompted
3. **Press Enter** to start the app

### Step 4: Share Your Databases
**Important**: You need to share each database you want to convert:

1. **Open a database** in Notion
2. **Click "..." menu** (top right)
3. **Select "Add connections"**
4. **Choose "Obsidian Converter"**
5. **Click "Confirm"**

Repeat for each database you want to convert.

### Step 5: Convert!
1. **Open**: http://localhost:3000
2. **Click "Refresh Databases"** - you'll see your shared databases
3. **Check "Import directly to Obsidian vault"**
4. **Enter your Obsidian vault path** (see guide below)
5. **Choose your conversion format** (see options below)
6. **Select a database** and click "Convert Selected Database"
7. **Watch the progress bar** - your files will appear in Obsidian!

## 📁 Finding Your Obsidian Vault Path

### If you have Obsidian:
1. **Open Obsidian**
2. **Click Settings** (gear icon, bottom left)
3. **Go to "Files & Links"**
4. **Copy the "Vault location"** path
5. **Paste it** into the converter

### If you don't have Obsidian yet:
1. **Download Obsidian**: https://obsidian.md
2. **Create a new vault** (choose a location like `C:/Users/YourName/Documents/MyVault`)
3. **Use that path** in the converter

### Example paths:
- Windows: `C:/Users/YourName/Documents/ObsidianVault`
- Mac: `/Users/YourName/Documents/ObsidianVault`

## 📊 Conversion Format Options

Choose the format that best fits your Obsidian workflow:

### **1. Separate Pages (Default)**
- ✅ **Individual .md files** for each database row
- ✅ **Full content preservation** with YAML frontmatter
- ✅ **Best for detailed notes** with rich content
- ✅ **Works immediately** - no plugins required

### **2. Dataview Table + Individual Notes (Recommended)** 🌟
- ✅ **Individual notes** with rich frontmatter (same as above)
- ✅ **Master table file** with dynamic Dataview queries
- ✅ **Auto-updating table view** in Obsidian
- ✅ **Best of both worlds** - detailed notes + table overview
- ⚙️ **Requires**: [Dataview plugin](https://github.com/blacksmithgu/obsidian-dataview)

### **3. Single Markdown Table (Lightweight)**
- ✅ **One table file** with all your data
- ✅ **Sortable columns** in Obsidian's reading view
- ✅ **No plugins required** - works with native Obsidian
- ✅ **Perfect for simple databases** or quick reference

### **4. Obsidian Base (Native Database View)** 🆕
- ✅ **Individual notes** with rich frontmatter (same as separate pages)
- ✅ **Native .base file** for true database functionality
- ✅ **Table and card views** built into Obsidian
- ✅ **Advanced filtering and sorting** with Bases syntax
- ⚙️ **Requires**: Obsidian 1.7+ with Bases feature enabled

### Installing the Dataview Plugin (for option 2):
1. **Open Obsidian** → Settings → Community Plugins
2. **Turn off Safe Mode** if it's enabled
3. **Click "Browse"** and search for "Dataview"
4. **Install and Enable** the Dataview plugin
5. **That's it!** Your table will automatically work

### Using Obsidian Bases (for option 4):
1. **Update Obsidian** to version 1.7.0 or later
2. **Enable Bases** in Settings → Core Plugins → Bases
3. **Open the .base file** that gets created during conversion
4. **Enjoy native database views** with filtering, sorting, and multiple view types!

## 🎯 What You Get

Your converted files will have:

### Perfect Obsidian Integration
- ✅ **Direct import** to your vault (no manual copying!)
- ✅ **Organized folders** (`Notion Imports/DatabaseName/`)
- ✅ **YAML frontmatter** with all your Notion properties
- ✅ **Proper Markdown formatting** that Obsidian loves

### Example Output Files

**Individual Note (all formats):**
```markdown
---
notion_id: 12345678-1234-1234-1234-123456789012
created: 2023-01-01T00:00:00.000Z
updated: 2023-01-02T00:00:00.000Z
Status: In Progress
Priority: High
Tags: project, important
---

# My Project Page

This content was automatically converted from Notion!

- All your bullet points
- **Bold text** and *italic text*
- Code blocks and quotes

> Everything preserved perfectly for Obsidian
```

**Dataview Table File (format 2):**
```markdown
# My Database - Table View

```dataview
TABLE Status, Priority, Tags, created, updated
FROM "Notion Imports/My Database"
WHERE notion_id
SORT file.name ASC
```

**Markdown Table File (format 3):**
```markdown
# My Database

| Title | Status | Priority | Tags | Created | Updated |
| --- | --- | --- | --- | --- | --- |
| My Project Page | In Progress | High | project, important | 2023-01-01 | 2023-01-02 |
| Another Page | Complete | Medium | work | 2023-01-03 | 2023-01-04 |
```

**Obsidian Base File (format 4):**
```yaml
# Obsidian Base file for My Database
# Generated from Notion database

filters:
  file.inFolder("My Database")

properties:
  title:
    displayName: "Title"
  status:
    displayName: "Status"
  priority:
    displayName: "Priority"

views:
  - type: table
    name: "My Database Table"
    limit: 100
    order:
      - title
      - status
      - priority
      - file.ctime
```

## 🔧 Troubleshooting

### "No databases found"
- **Make sure you shared your databases** with the integration (Step 4 above)
- Click "Refresh Databases" after sharing
- Check that you're in the right Notion workspace

### "Notion token not configured"
- Run `npm run setup` again to reconfigure
- Make sure you copied the full token (starts with `secret_`)

### "Can't find Obsidian vault path"
- The path should be the main folder containing your `.obsidian` folder
- Try creating a new vault if you're unsure
- Use forward slashes `/` even on Windows

### Conversion takes forever
- **This is normal!** Large databases (100+ pages) can take 5-10 minutes
- Watch the progress bar - it shows exactly what's happening
- Don't close the browser tab while converting

## 💡 Pro Tips

- **Start small**: Try converting a small database first to test everything
- **Choose the right format**:
  - Use **Separate Pages** for detailed notes with rich content
  - Use **Dataview Table** for the best of both worlds (notes + table view)
  - Use **Markdown Table** for simple data that doesn't need individual notes
- **Organize in Obsidian**: The "Create Notion Imports folder" option keeps things tidy
- **Check your vault**: Files appear in Obsidian immediately after conversion
- **Properties become searchable**: Your Notion properties work great with Obsidian's search
- **Dataview is powerful**: If you choose the Dataview format, explore its query capabilities
- **Tables are sortable**: Click column headers in Obsidian's reading view to sort

## 🆘 Need Help?

1. **Check the browser console** (F12) for detailed error messages
2. **Try a smaller database** first to test your setup
3. **Verify database sharing** - this is the most common issue
4. **Restart the app** if something seems stuck

## 🔒 Privacy & Security

- **Your data stays local** - nothing is sent to external servers
- **Notion token is secure** - stored only on your computer
- **No data collection** - this tool doesn't track or store anything
- **Open source** - you can see exactly what it does

---

**Ready to migrate from Notion to Obsidian? Follow the Quick Start guide above and you'll be converting databases in minutes!** 🚀

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ **Free to use** for personal and commercial projects
- ✅ **Free to modify** and distribute
- ✅ **Free to contribute** improvements back to the project
- ✅ **Patent protection** included
- ⚖️ **Attribution required** (keep copyright notices)

**TL;DR**: Use it freely, modify it, share it, just keep the license notice! 🎉
