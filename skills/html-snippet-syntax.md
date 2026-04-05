# HTML Snippet Syntax Reference

## Purpose
Comprehensive reference for writing HTML snippets with Deluge code in Zoho Creator pages.

## Overview
HTML snippets combine standard HTML5 markup with server-side Deluge scripting. The code executes server-side before the page renders in the browser, allowing dynamic content injection.

## Snippet Wrapper Structure (CRITICAL)

Every HTML snippet in Zoho Creator **MUST** be wrapped with the following tags:

```
<%{%>
<!-- Your HTML content goes here -->
<%}%>
```

- `<%{%>` - Opening wrapper tag (execution block open + immediate close)
- `<%}%>` - Closing wrapper tag (execution block close)
- All HTML content must go **between** these two tags

### Simple Example
```html
<%{%>
<h1>Hello World</h1>
<%}%>
```

## Deluge Tags

### Execution Block: `<%{ ... }%>`
Executes Deluge logic without printing output to the browser. Used for:
- Variable assignments
- Conditional statements (if/else)
- Loops (for each)
- Data processing

```html
<%{%>
<%{
  v_Name = "Zoho Creator";
  v_Year = 2024;
  v_Count = input.Records.count();
%>
<p>Name: <%= v_Name %></p>
<%}%>
```

### Output Block: `<%= ... %>`
Evaluates a Deluge expression and injects the resulting value directly into the HTML. Used for:
- Displaying variable values
- Outputting field values
- Rendering computed strings

```html
<%{%>
<h2>Welcome to <%= v_Name %></h2>
<p>Current Year: <%= v_Year %></p>
<p>Total Records: <%= v_Count %></p>
<%}%>
```

## Common Patterns

### Display Field Value
```html
<%{%>
<p>Customer Name: <%= input.Customer_Name %></p>
<h1><%= input.Title %></h1>
<%}%>
```

### Simple Text Output
```html
<%{%>
<h1>Hello World</h1>
<p>Welcome to our application</p>
<%}%>
```

### Conditional Rendering
```html
<%{%>
<%{ if(input.Status == "Approved") { %>
  <p style="color: green;">Status: Approved</p>
<%{ } %>

<%{ if(input.Status == "Pending") { %>
  <p style="color: orange;">Status: Pending Review</p>
<%{ } else { %>
  <p style="color: red;">Status: Rejected</p>
<%{ } %>
<%}%>
```

### Loop Through Records
```html
<%{%>
<ul>
<%{ for each item in input.Order_Items { %>
  <li><%= item.Product_Name %> - $<%= item.Price %></li>
<%{ } %>
</ul>
<%}%>
```

### Combined Logic and Output
```html
<%{%>
<%{
  activeUsers = Users [Status == "Active"];
  total = activeUsers.count();
%>
<div class="user-list">
  <p>Total Active: <%= total %></p>
  <%{ for each user in activeUsers %>
    <div class="user-card">
      <h3><%= user.Full_Name %></h3>
      <p>Email: <%= user.Email %></p>
      <%{ if user.Role == "Admin" then %>
        <span class="badge">Administrator</span>
      <%{ end if }%>
    </div>
  <%{ end for %>
</div>
<%}%>
```

## Important Rules

### Must Follow
1. **Always use wrapper tags**: Every snippet MUST start with `<%{%>` and end with `<%}%>`
2. **Always close Deluge blocks**: Every `<%{` must have a matching `}%>`
3. **Use `<%= %>` for output**: Never use `<% %>` when you want text to appear
4. **Proper HTML structure**: All HTML tags must be properly opened and closed
5. **Case-sensitive Deluge**: Deluge syntax is case-sensitive
6. **String quoting**: Use `" "` or `' '` for strings in Deluge

### Must Avoid
1. **Missing wrapper tags**: Forgetting `<%{%>` and `<%}%>` causes "Improper Statement" errors
2. **Unclosed tags**: Missing `}%>` or malformed HTML breaks rendering
3. **Client/server confusion**: Deluge runs before page load, not on browser events
4. **Complex logic in snippets**: Keep snippets lightweight; do heavy lifting in Page "On Load"
5. **Direct database operations**: Fetch data in Page workflow, pass to snippet via `args`
6. **Using `<% %>` for output**: This executes but doesn't print - use `<%= %>` instead

## Code Editor Workflow

### Accessing the Editor
1. Navigate to page builder
2. Click on HTML Snippet component
3. Click "Configure" button
4. Code editor opens with CodeMirror

### Editing Content
- Content is in the **3rd CodeMirror instance** (index 2)
- Use 0-based indexing for line numbers
- Always call `cm.focus()` before making selections
- See `playwright-code-editor.md` for editing patterns

### Saving Changes
1. Click Save button in code editor
2. Wait 2 seconds
3. Press Escape to close popup
4. Wait 1 second
5. Click Done to exit page builder
6. Navigate to live page to verify

## Troubleshooting

### "Improper Statement" Error (Line 0)
- **Most common cause**: Missing `<%{%>` wrapper at the start or `<%}%>` at the end
- **Fix**: Ensure your snippet starts with `<%{%>` and ends with `<%}%>`
- Also check for missing `;` at end of Deluge statements

### Snippet Not Rendering
- Check for unclosed Deluge blocks
- Verify proper tag syntax (`<%{ }%>` and `<%= %>`)
- Check Zoho Creator error logs

### Variable Not Printing
- Ensure using `<%= %>` not `<% %>`
- Verify variable is defined before use
- Check for typos in variable names

### HTML Breaking
- Validate all HTML tags are closed
- Check for special characters that need escaping
- Verify Deluge logic doesn't output malformed HTML

## References
- [Zoho Creator HTML Snippets Documentation](https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets)
- [Understanding HTML Snippets](https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets/articles/understand-html-snippets)
- [Understanding Snippets](https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets/articles/understand-snippets)
