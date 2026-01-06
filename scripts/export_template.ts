import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function exportTemplate(templateName: string = 'flyer-template') {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Ensure dist directory exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const templatePath = path.join(__dirname, '..', 'src', 'templates', `${templateName}.html`);
  const outputPath = path.join(distDir, `${templateName}.pdf`);

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    process.exit(1);
  }

  try {
    // Load template
    await page.goto(`file://${templatePath}`);
    await page.waitForLoadState('networkidle');

    // Wait for fonts to load
    await page.waitForTimeout(1000);

    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'Letter',
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    console.log(`✅ PDF exported successfully to: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

// Get template name from command line args
const templateName = process.argv[2] || 'flyer-template';
exportTemplate(templateName).catch(console.error);
