# Playwright: Zoho Page Builder Navigation

## Purpose
Navigate Zoho Creator page builder to access HTML Snippet components.

## Steps

### 1. Enter Edit Mode
```
browser_click on "Edit this application" link
browser_wait_for: 3 seconds
```

### 2. Select HTML Snippet Component
```
# Click on the HTML Snippet in the preview frame
browser_click on ref of HTML Snippet component in designPreviewFrame
browser_wait_for: 2 seconds
```

### 3. Open Code Editor
```
# Click Configure button
browser_click on ref of "Configure" button
browser_wait_for: 3 seconds
```

### 4. Find CodeMirror Editor
- Content is in the **3rd CodeMirror instance** (index 2) in frame 0
- Use `playwright-code-editor` skill to edit content

### 5. Save Changes
```
# Click Save button in code editor popup
browser_click on "Save" button (id: zctemplate-dialog-okBtn)
browser_wait_for: 2 seconds

# Close editor and return to page builder
browser_press_key: Escape
browser_click on "Done" link (id: builder-close)
```

## Key Refs to Find
- HTML Snippet component: inside `#designPreviewFrame` iframe
- Configure button: `#zcpb-zmlProperties-toolbar`
- Save button: `#zctemplate-dialog-okBtn`
- Done link: `#builder-close`

## Tips
- Always wait 2-3 seconds after each click
- Use `browser_snapshot` to find current refs
