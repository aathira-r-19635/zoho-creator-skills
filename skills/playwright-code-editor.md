# Playwright: Zoho Code Editor (CodeMirror)

## Purpose
Edit HTML content in Zoho Creator's CodeMirror-based code editor.

## Key Discovery
- HTML content is in the **3rd CodeMirror instance** (index 2) in frame 0
- Line numbers in UI are 1-based; CodeMirror uses 0-based indexing

## Edit Text at Specific Line

```javascript
async (page) => {
  const result = await page.frames()[0].evaluate(() => {
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
  const result = await page.frames()[0].evaluate(() => {
    const cm = document.querySelectorAll('.CodeMirror')[2].CodeMirror;
    for (let i = 0; i < cm.lineCount(); i++) {
      if (cm.getLine(i).includes('Search Text')) {
        return { line: i + 1, content: cm.getLine(i) };
      }
    }
    return { found: false };
  });
  return result;
}
```

## Save After Editing
- See `playwright-zoho-page-builder` for save steps
