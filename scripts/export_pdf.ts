import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function exportPDF() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Ensure dist directory exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const outputPath = path.join(distDir, 'imagit-pen-testing-flyer.pdf');
  const srcDir = path.join(__dirname, '..', 'src');
  const frontPath = path.join(srcDir, 'front.html');
  const backPath = path.join(srcDir, 'back.html');

  // Read both HTML files
  const frontHTML = fs.readFileSync(frontPath, 'utf-8');
  const backHTML = fs.readFileSync(backPath, 'utf-8');
  
  // Extract body content from both pages
  const frontBodyMatch = frontHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const backBodyMatch = backHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  
  if (!frontBodyMatch || !backBodyMatch) {
    throw new Error('Could not parse HTML files');
  }

  // Create combined HTML with both pages
  const combinedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Imagit Penetration Testing Flyer</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    .page {
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: auto;
    }
  </style>
</head>
<body>
  ${frontBodyMatch[1]}
  ${backBodyMatch[1]}
</body>
</html>
  `;
  
  // Write temporary combined file
  const combinedPath = path.join(srcDir, 'combined.html');
  fs.writeFileSync(combinedPath, combinedHTML);
  
  try {
    // Load combined page
    await page.goto(`file://${combinedPath}`);
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any CSS animations or transitions
    await page.waitForTimeout(500);
    
    // Generate PDF - margins handled by CSS @page
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
    // Clean up temporary file
    if (fs.existsSync(combinedPath)) {
      fs.unlinkSync(combinedPath);
    }
    await browser.close();
  }
}

exportPDF().catch(console.error);

