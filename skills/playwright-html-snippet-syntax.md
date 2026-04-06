# Zoho Creator HTML Snippet Syntax

## Overview
This skill covers the correct syntax for writing Deluge code inside Zoho Creator HTML snippets. Understanding the proper tag format is critical - incorrect syntax causes compilation errors.

## Syntax Rules

### 1. Wrapper Tags (Start & End ONLY)
```html
<%{%>  <!-- Opening wrapper WITH curly braces -->
  <!-- content -->
<%}%>  <!-- Closing wrapper WITH curly braces -->
```
**Only** the opening and closing wrapper tags use `{` with `%`.

### 2. Internal Deluge Blocks
```html
<%
	records = Form_Name[ID != 0];
	%>
```
**NO curly braces** around `%` for internal code blocks. Use plain `<% code %>` format.

### 3. Output Expressions
```html
<%=rec.Field_Name%>
```
Use `<%= %>` to output Deluge values.

## Complete Working Example

```html
<%{%>
<h1>Hello Aathira | Activities</h1>
<%
	records = Form_Name[ID != 0];
	%>
<table>
	<tr><th>Column</th></tr>
<%
	for each rec in records
	{
		%>
<tr><td><%=rec.Field%></td></tr>
<%
	}
	%>
</table>
<%}%>
```

## Common Mistakes to Avoid

❌ `<%{ code }%>` - **Wrong** (curly braces only for wrappers)  
✅ `<% code %>` - **Correct** (plain tags for internal blocks)

❌ Using report names to fetch records  
✅ Using form link names: `Form_Name[ID != 0]`

## Save Sequence

1. Open page builder and configure HTML snippet
2. Edit code in CodeMirror editor
3. Click **Save** button
4. Press **Escape** to close editor
5. Click **Done** to exit page builder
6. Navigate to live page to verify

## References
- Zoho Official Docs: https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets
