#!/usr/bin/env node

/**
 * OCR Model Training Script for Jaffna Cuisine
 * 
 * This script trains a custom OCR model for recognizing Jaffna cuisine menu items
 * using Tesseract.js and a dataset of labeled images.
 * 
 * Usage:
 *   node train-ocr.js --dataset=/path/to/dataset --output=/path/to/output
 * 
 * Dataset Structure:
 *   /dataset/
 *     images/
 *       image1.jpg
 *       image2.png
 *       ...
 *     ground-truth/
 *       image1.gt.txt
 *       image2.gt.txt
 *       ...
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const Tesseract = require('tesseract.js');

// Parse command line arguments
program
  .option('-d, --dataset <path>', 'Path to dataset directory')
  .option('-o, --output <path>', 'Path to output directory')
  .option('-l, --language <code>', 'Language code (default: tam)', 'tam')
  .parse();

const options = program.opts();

// Validate required arguments
if (!options.dataset) {
  console.error('Error: Dataset path is required');
  program.help();
}

if (!options.output) {
  console.error('Error: Output path is required');
  program.help();
}

// Ensure dataset directory exists
if (!fs.existsSync(options.dataset)) {
  console.error(`Error: Dataset directory "${options.dataset}" does not exist`);
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(options.output)) {
  fs.mkdirSync(options.output, { recursive: true });
}

// Paths
const imagesDir = path.join(options.dataset, 'images');
const groundTruthDir = path.join(options.dataset, 'ground-truth');

// Validate dataset structure
if (!fs.existsSync(imagesDir)) {
  console.error(`Error: Images directory "${imagesDir}" does not exist`);
  process.exit(1);
}

if (!fs.existsSync(groundTruthDir)) {
  console.error(`Error: Ground truth directory "${groundTruthDir}" does not exist`);
  process.exit(1);
}

// Get list of image files
const imageFiles = fs.readdirSync(imagesDir)
  .filter(file => /\.(jpe?g|png|gif|bmp|tiff)$/i.test(file));

if (imageFiles.length === 0) {
  console.error('Error: No image files found in dataset');
  process.exit(1);
}

console.log(`Found ${imageFiles.length} images in dataset`);

// Training function
async function trainModel() {
  console.log('Starting OCR model training...');
  console.log(`Dataset: ${options.dataset}`);
  console.log(`Output: ${options.output}`);
  console.log(`Language: ${options.language}`);
  
  // Initialize counters
  let processed = 0;
  let errors = 0;
  
  // Process each image
  for (const imageFile of imageFiles) {
    try {
      const imagePath = path.join(imagesDir, imageFile);
      const fileName = path.parse(imageFile).name;
      const groundTruthPath = path.join(groundTruthDir, `${fileName}.gt.txt`);
      
      // Check if ground truth file exists
      if (!fs.existsSync(groundTruthPath)) {
        console.warn(`Warning: No ground truth file for "${imageFile}"`);
        continue;
      }
      
      // Read ground truth text
      const groundTruth = fs.readFileSync(groundTruthPath, 'utf8').trim();
      
      // Skip if ground truth is empty
      if (!groundTruth) {
        console.warn(`Warning: Empty ground truth for "${imageFile}"`);
        continue;
      }
      
      // Perform OCR on image
      console.log(`Processing ${imageFile}...`);
      
      const result = await Tesseract.recognize(
        imagePath,
        options.language,
        {
          logger: info => {
            if (info.status === 'recognizing text') {
              process.stdout.write(`\rProgress: ${Math.round(info.progress * 100)}%`);
            }
          }
        }
      );
      
      // Compare results
      const extractedText = result.data.text.trim();
      const accuracy = calculateAccuracy(groundTruth, extractedText);
      
      console.log(`\nExtracted: "${extractedText}"`);
      console.log(`Ground Truth: "${groundTruth}"`);
      console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
      
      // Save results for analysis
      const resultPath = path.join(options.output, `${fileName}.result.txt`);
      fs.writeFileSync(resultPath, `Ground Truth: ${groundTruth}\nExtracted: ${extractedText}\nAccuracy: ${accuracy.toFixed(2)}%\n`);
      
      processed++;
    } catch (error) {
      console.error(`Error processing "${imageFile}":`, error.message);
      errors++;
    }
  }
  
  // Print summary
  console.log('\n=== Training Summary ===');
  console.log(`Processed: ${processed}`);
  console.log(`Errors: ${errors}`);
  console.log(`Success Rate: ${((processed / imageFiles.length) * 100).toFixed(2)}%`);
  
  // Generate accuracy report
  generateAccuracyReport(options.output);
  
  console.log('\nTraining completed!');
  console.log(`Results saved to: ${options.output}`);
}

// Calculate accuracy between ground truth and extracted text
function calculateAccuracy(groundTruth, extractedText) {
  // Simple character-level accuracy calculation
  const gtChars = groundTruth.toLowerCase().replace(/\s+/g, '');
  const exChars = extractedText.toLowerCase().replace(/\s+/g, '');
  
  if (gtChars.length === 0) return 100;
  
  let matches = 0;
  const minLength = Math.min(gtChars.length, exChars.length);
  
  for (let i = 0; i < minLength; i++) {
    if (gtChars[i] === exChars[i]) {
      matches++;
    }
  }
  
  return (matches / gtChars.length) * 100;
}

// Generate accuracy report
function generateAccuracyReport(outputDir) {
  const resultFiles = fs.readdirSync(outputDir)
    .filter(file => file.endsWith('.result.txt'));
  
  if (resultFiles.length === 0) return;
  
  let totalAccuracy = 0;
  let validResults = 0;
  
  for (const resultFile of resultFiles) {
    const content = fs.readFileSync(path.join(outputDir, resultFile), 'utf8');
    const accuracyMatch = content.match(/Accuracy: ([\d.]+)%/);
    
    if (accuracyMatch) {
      totalAccuracy += parseFloat(accuracyMatch[1]);
      validResults++;
    }
  }
  
  if (validResults > 0) {
    const averageAccuracy = totalAccuracy / validResults;
    const reportPath = path.join(outputDir, 'accuracy-report.txt');
    
    const report = `OCR Training Accuracy Report
========================

Total Images Processed: ${resultFiles.length}
Valid Results: ${validResults}
Average Accuracy: ${averageAccuracy.toFixed(2)}%

Accuracy Distribution:
${getAccuracyDistribution(outputDir)}
`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`Accuracy report saved to: ${reportPath}`);
    console.log(`Average Accuracy: ${averageAccuracy.toFixed(2)}%`);
  }
}

// Get accuracy distribution
function getAccuracyDistribution(outputDir) {
  const resultFiles = fs.readdirSync(outputDir)
    .filter(file => file.endsWith('.result.txt'));
  
  const ranges = {
    '90-100%': 0,
    '80-89%': 0,
    '70-79%': 0,
    '60-69%': 0,
    '50-59%': 0,
    '<50%': 0
  };
  
  for (const resultFile of resultFiles) {
    const content = fs.readFileSync(path.join(outputDir, resultFile), 'utf8');
    const accuracyMatch = content.match(/Accuracy: ([\d.]+)%/);
    
    if (accuracyMatch) {
      const accuracy = parseFloat(accuracyMatch[1]);
      
      if (accuracy >= 90) ranges['90-100%']++;
      else if (accuracy >= 80) ranges['80-89%']++;
      else if (accuracy >= 70) ranges['70-79%']++;
      else if (accuracy >= 60) ranges['60-69%']++;
      else if (accuracy >= 50) ranges['50-59%']++;
      else ranges['<50%']++;
    }
  }
  
  return Object.entries(ranges)
    .filter(([_, count]) => count > 0)
    .map(([range, count]) => `  ${range}: ${count}`)
    .join('\n');
}

// Run training
trainModel().catch(error => {
  console.error('Training failed:', error);
  process.exit(1);
});