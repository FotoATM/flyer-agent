const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function analyzeReference() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const pdfPath = path.join(__dirname, '..', 'Flyer Examples for Training', 'Imagit - Slick - Engineer-Sales Rep Program - Jess.pdf');
  const absolutePath = path.resolve(pdfPath);
  
  // Open PDF in browser
  await page.goto(`file://${absolutePath}`);
  
  // Wait for PDF to load
  await page.waitForTimeout(2000);
  
  // Take screenshot of the first page
  const screenshotPath = path.join(__dirname, '..', 'dist', 'reference-analysis.png');
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  
  console.log(`Screenshot saved to: ${screenshotPath}`);
  
  // Try to extract text content
  try {
    const textContent = await page.evaluate(() => {
      // Try to find text elements
      const body = document.body;
      return {
        innerText: body.innerText,
        innerHTML: body.innerHTML.substring(0, 5000) // First 5000 chars
      };
    });
    
    console.log('\n=== TEXT CONTENT ===');
    console.log(textContent.innerText.substring(0, 1000));
    
    // Save analysis
    const analysisPath = path.join(__dirname, '..', 'dist', 'reference-analysis.txt');
    fs.writeFileSync(analysisPath, JSON.stringify(textContent, null, 2));
    console.log(`\nAnalysis saved to: ${analysisPath}`);
  } catch (e) {
    console.log('Could not extract text:', e.message);
  }
  
  await browser.close();
}

analyzeReference().catch(console.error);


