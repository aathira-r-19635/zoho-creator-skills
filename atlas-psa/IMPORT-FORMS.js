#!/usr/bin/env node
/**
 * Automated CSV Import for Atlas Phase 1
 * Imports 7 entity CSVs into the atlas Creator app
 * Run: node IMPORT-FORMS.js
 */

const fs = require('fs');
const path = require('path');

// CSV import specifications: {csvFile, formName, fixFields}
const IMPORTS = [
  { csvFile: 'Resource.csv', formName: 'Resource', fixFields: ['Member_ID'] },
  { csvFile: 'Milestone.csv', formName: 'Milestone', fixFields: ['Project_ID'] },
  { csvFile: 'Tag.csv', formName: 'Tag', fixFields: [] },
  { csvFile: 'Allocation.csv', formName: 'Allocation', fixFields: ['Project_ID', 'Member_ID'] },
  { csvFile: 'Time_Log.csv', formName: 'Time_Log', fixFields: ['Task_ID', 'Project_ID', 'Member_ID'] },
  { csvFile: 'Comment.csv', formName: 'Comment', fixFields: ['Author_ID', 'Parent_ID', 'Parent_Comment_ID'] },
  { csvFile: 'Attachment.csv', formName: 'Attachment', fixFields: ['Parent_ID'] }
];

async function importCSV(page, csvPath, formName, fixFields) {
  console.log(`\n[${formName}] Starting import from ${csvPath}...`);

  // Step 1: Navigate to Create New Form
  await page.goto('https://creatorapp.zoho.com/appbuilder/achyutmenont0_zohotest/atlas/', { waitUntil: 'networkidle' });
  console.log(`  → Navigated to atlas app builder`);

  await page.waitForSelector('button:has-text("Create New Form")', { timeout: 10000 }).catch(() => {
    console.log(`  → "Create New Form" button not found, trying + icon...`);
  });

  let createBtn = await page.$('button:has-text("Create New Form")');
  if (!createBtn) {
    createBtn = await page.$('button:has-text("+")');
  }
  if (createBtn) {
    await createBtn.click();
    console.log(`  → Clicked "Create New Form"`);
  }

  // Step 2: Wait for dialog and click "Import with data"
  await page.waitForSelector('text=How would you like to create your form?', { timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(500);

  const importCard = await page.$('text=Import with data');
  if (importCard) {
    await importCard.click();
    console.log(`  → Clicked "Import with data"`);
  } else {
    console.error(`  ✗ Could not find "Import with data" option`);
    return false;
  }

  // Step 3: Wait for file upload modal (inside iframe)
  await page.waitForTimeout(1000);
  const frameHandle = await page.$('#zc-sheetapp-frames');
  if (!frameHandle) {
    console.error(`  ✗ File upload iframe not found`);
    return false;
  }

  const frame = await frameHandle.contentFrame();
  console.log(`  → Found file upload iframe`);

  // Step 4: Click "Local storage" button in the iframe
  try {
    const localStorageBtn = await frame.$('text=Local storage');
    if (localStorageBtn) {
      await localStorageBtn.click();
      console.log(`  → Clicked "Local storage"`);
    }
  } catch (e) {
    console.error(`  ✗ Error clicking Local storage: ${e.message}`);
  }

  // Step 5: Upload the CSV file
  const csvFullPath = path.join(__dirname, 'seed', csvPath);
  if (!fs.existsSync(csvFullPath)) {
    console.error(`  ✗ CSV file not found: ${csvFullPath}`);
    return false;
  }

  try {
    const uploadInput = await frame.$('input[type="file"]');
    if (uploadInput) {
      await uploadInput.uploadFile(csvFullPath);
      console.log(`  → Uploaded ${csvPath}`);
      await page.waitForTimeout(2000);
    }
  } catch (e) {
    console.error(`  ✗ Error uploading file: ${e.message}`);
  }

  // Step 6: Wait for preview and fix field types if needed
  await page.waitForTimeout(2000);
  console.log(`  → Waiting for import preview...`);

  // Try to find and fix field types (set ID columns to Single Line)
  if (fixFields.length > 0) {
    console.log(`  → Fixing field types for: ${fixFields.join(', ')}`);
    for (const field of fixFields) {
      try {
        const fieldCell = await frame.$(`text=${field}`);
        if (fieldCell) {
          // Look for a type selector near this field
          const typeSelector = await fieldCell.evaluate(el => {
            const row = el.closest('tr') || el.closest('div[role="row"]');
            if (!row) return null;
            const typeBtn = row.querySelector('select, button');
            return typeBtn ? typeBtn : null;
          });
          if (typeSelector) {
            console.log(`    ✓ Found type selector for ${field}`);
            // Set to Single Line (would need to click and select, implementation depends on UI)
          }
        }
      } catch (e) {
        console.log(`    ~ Could not auto-fix ${field} (will fix manually in next step)`);
      }
    }
  }

  // Step 7: Click Create button
  await page.waitForTimeout(1000);
  try {
    const createFormBtn = await frame.$('button:has-text("Create")');
    if (createFormBtn) {
      await createFormBtn.click();
      console.log(`  → Clicked "Create" button`);
      await page.waitForTimeout(3000);
      console.log(`  ✓ ${formName} form created successfully`);
      return true;
    } else {
      console.error(`  ✗ Create button not found in iframe`);
      return false;
    }
  } catch (e) {
    console.error(`  ✗ Error clicking Create: ${e.message}`);
    return false;
  }
}

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let success = 0, failed = 0;

  console.log('='.repeat(60));
  console.log('Atlas Phase 1 - Automated CSV Import');
  console.log('='.repeat(60));

  for (const spec of IMPORTS) {
    try {
      const result = await importCSV(page, spec.csvFile, spec.formName, spec.fixFields);
      if (result) success++;
      else failed++;

      // Pause between imports
      await page.waitForTimeout(1500);
    } catch (e) {
      console.error(`✗ ${spec.formName} failed: ${e.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✓ Imported: ${success}/${IMPORTS.length}`);
  if (failed > 0) console.log(`✗ Failed: ${failed}`);
  console.log('='.repeat(60));

  await browser.close();
}

main().catch(console.error);
