# Playwright: Zoho Code Editor (CodeMirror)

## Purpose
Edit HTML content in Zoho Creator's CodeMirror-based code editor.

## Key Discovery
- HTML content is in the **3rd CodeMirror instance** (index 2) in the appbuilder frame
- Line numbers in UI are 1-based; CodeMirror uses 0-based indexing
- Always access via the appbuilder frame, not frame 0

## HTML Snippet Deluge Syntax

### Special Tags
Zoho Creator HTML snippets use special Deluge tags for server-side processing:

| Tag | Purpose | Example |
|-----|---------|---------|
| `<%{ ... }%>` | Execute Deluge logic (no output) | `<%{ if(input.Status == "Approved") { } }%>` |
| `<%= ... %>` | Output Deluge value | `<%= input.Field_Name %>` |

### Common Patterns

**Display a field value:**
```html
<p>Customer: <%= input.Customer_Name %></p>
```

**Conditional rendering:**
```html
<%{ if(input.Status == "Approved") { %>
  <p style="color: green;">Status: Approved</p>
<%{ } %>
```

**Simple text output:**
```html
<h1><%= "Hello World" %></h1>
```

**Loop through records:**
```html
<ul>
<%{ for each item in input.Order_Items { %>
  <li><%= item.Product_Name %> - $<%= item.Price %></li>
<%{ } %>
</ul>
```

### Important Notes
- HTML snippets execute server-side before page renders
- Do NOT use `<% %>` for output - use `<%= %>` instead
- Always close Deluge blocks: `<%{ ... }%>`
- Reference: https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets
- See `html-snippet-syntax.md` for complete syntax reference

## Complete Working Example: Find and Replace Text

### Step 1: Find the Text Location
```javascript
async (page) => {
  const frame = page.frames().find(f => f.url().includes('appbuilder'));
  const result = await frame.evaluate(() => {
    const cm = document.querySelectorAll('.CodeMirror')[2].CodeMirror;
    for (let i = 0; i < cm.lineCount(); i++) {
      const line = cm.getLine(i);
      if (line.includes('Text to find')) {
        return { found: true, line: i + 1, content: line };
      }
    }
    return { found: false };
  });
  return result;
}
```

### Step 2: Replace the Text
```javascript
async (page) => {
  const frame = page.frames().find(f => f.url().includes('appbuilder'));
  const result = await frame.evaluate(() => {
    const cmElements = document.querySelectorAll('.CodeMirror');
    const cm = cmElements[2].CodeMirror;  // 3rd editor

    cm.focus();

    const lineIdx = 41;  // UI line 42 = index 41
    const lineContent = cm.getLine(lineIdx);
    const startPos = lineContent.indexOf('Old Text');

    cm.setSelection(
      { line: lineIdx, ch: startPos },
      { line: lineIdx, ch: startPos + 'Old Text'.length }
    );

    cm.replaceSelection('New Text');
    cm.scrollIntoView({ line: lineIdx, ch: 0 }, 200);

    return { success: true, newContent: cm.getLine(lineIdx) };
  });
  return result;
}
```

### Step 3: Set Entire Content (Alternative)
```javascript
async (page) => {
  const frame = page.frames().find(f => f.url().includes('appbuilder'));
  const result = await frame.evaluate(() => {
    const cm = document.querySelectorAll('.CodeMirror')[2].CodeMirror;
    cm.focus();
    
    // Set entire content - useful for HTML snippets with Deluge
    cm.setValue('<h1><%= "Hello World" %></h1>');
    
    return 'Content set to: ' + cm.getValue();
  });
  return result;
}
```

## Edit Text at Specific Line

```javascript
async (page) => {
  const frame = page.frames().find(f => f.url().includes('appbuilder'));
  const result = await frame.evaluate(() => {
    const cmElements = document.querySelectorAll('.CodeMirror');
    const cm = cmElements[2].CodeMirror;  // 3rd editor

    cm.focus();

    const lineIdx = 127;  // UI line 128 = index 127
    const lineContent = cm.getLine(lineIdx);
    const startPos = lineContent.indexOf('Old Text');

    cm.setSelection(
      { line: lineIdx, ch: startPos },
      { line: lineIdx, ch: startPos + 'Old Text'.length }
    );

    cm.replaceSelection('New Text');
    cm.scrollIntoView({ line: lineIdx, ch: 0 }, 200);

    return { success: true, newContent: cm.getLine(lineIdx) };
  });
  return result;
}
```

## Find Text Location
```javascript
async (page) => {
  const frame = page.frames().find(f => f.url().includes('appbuilder'));
  const result = await frame.evaluate(() => {
    const cm = document.querySelectorAll('.CodeMirror')[2].CodeMirror;
    for (let i = 0; i < cm.lineCount(); i++) {
      if (cm.getLine(i).includes('Search Text')) {
        return { found: true, line: i + 1, content: cm.getLine(i) };
      }
    }
    return { found: false };
  });
  return result;
}
```

## Save After Editing
- See `playwright-zoho-page-builder` for save steps
- Always click Save button BEFORE pressing Escape
- Press Escape to close the code editor popup
- Click Done to exit page builder
- If freezer overlay blocks clicks, remove `.zc-freezer` elements first

## Important Notes
- **Always focus the CodeMirror** before making selections: `cm.focus()`
- **Use 0-based indexing** for CodeMirror (UI line 42 = index 41)
- **Verify the replacement** by checking the returned `newContent`
- **Scroll into view** to ensure the change is visible: `cm.scrollIntoView()`
- **Access correct frame**: Use appbuilder frame, not frame 0
- **Deluge syntax**: Use `<%{ }%>` for logic, `<%= %>` for output
- **Session recovery**: If browser context closes, re-navigate and re-edit
