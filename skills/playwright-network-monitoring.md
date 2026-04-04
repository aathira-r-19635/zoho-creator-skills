# Playwright: Network Request Monitoring

## Purpose
Capture and analyze Zoho Creator API calls to understand save mechanisms.

## Start Monitoring
```
browser_network_requests:
  static: false
  requestBody: true
  requestHeaders: true
```

## Key Zoho API Endpoints

### Save HTML Snippet
```
POST /appbuilder/{account}/{app}/storeFunction
Content-Type: application/x-www-form-urlencoded

Body parameters:
- appLinkName: app link name
- text: URL-encoded HTML content
- zohoruntime: current timestamp
- zccpn: CSRF token (from cookies)
- parentPageId: page ID
- htmlviewid: HTML view ID
- linkName: snippet name (e.g., html_snippet1)
- scripttype: htmlpagemodify
```

### Save Page Template
```
POST /appbuilder/{account}/{app}/{page}/updateTemplateContent
Body: pageContent={zml layout}&zccpn={token}
```

## Extract zccpn Token
```javascript
async (page) => {
  const cookies = await page.context().cookies();
  return cookies.find(c => c.name === 'zccpn')?.value;
}
```

## Use Cases
- Learn API patterns for automation
- Debug save failures
- Replicate actions via direct API calls

## Tips
- Call `browser_network_requests` before performing actions
- Filter results by searching for specific endpoints
- Request bodies are URL-encoded; decode for readability
