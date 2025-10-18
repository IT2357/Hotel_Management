// Test Tesseract.js functionality
import Tesseract from 'tesseract.js';

async function testTesseract() {
  try {
    console.log('Testing Tesseract.js...');
    
    // Test with a simple image or text
    const result = await Tesseract.recognize(
      'https://tesseract.projectnaptha.com/img/eng_bw.png',
      'eng',
      {
        logger: info => console.log(info)
      }
    );
    
    console.log('OCR Result:', result.data.text);
  } catch (error) {
    console.error('Error testing Tesseract:', error);
  }
}

testTesseract();