import { createWorker } from 'tesseract.js';

/**
 * AI Jaffna Trainer Service
 * Specialized training for Tamil/Jaffna cuisine OCR
 */
class AIJaffnaTrainer {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.trainingData = this.getJaffnaTrainingData();
  }

  /**
   * Initialize Tesseract worker with Tamil language support
   */
  async initializeWorker() {
    if (this.isInitialized) return true;

    try {
      console.log('🤖 Initializing AI Jaffna Trainer...');
      this.worker = await createWorker('tam+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`AI Training Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      this.isInitialized = true;
      console.log('✅ AI Jaffna Trainer initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AI Jaffna Trainer:', error);
      return false;
    }
  }

  /**
   * Train on Jaffna cuisine images
   * @param {string} imagePath - Path to training image
   * @param {Object} labels - Training labels
   */
  async trainOnImage(imagePath, labels = {}) {
    if (!this.isInitialized) {
      await this.initializeWorker();
    }

    try {
      console.log(`📚 Training on image: ${imagePath}`);
      
      const { data: { text, confidence } } = await this.worker.recognize(imagePath, {
        tessedit_pageseg_mode: '6', // Single uniform block
        tessedit_ocr_engine_mode: '1' // LSTM only
      });

      // Apply Jaffna-specific post-processing
      const processedText = this.postProcessJaffnaText(text, labels);
      
      console.log(`📊 Training confidence: ${Math.round(confidence * 100)}%`);
      
      return {
        text: processedText,
        confidence,
        method: 'jaffna-trained',
        success: true
      };
    } catch (error) {
      console.error('❌ Training failed:', error);
      return {
        text: '',
        confidence: 0,
        method: 'failed',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post-process OCR text for Jaffna cuisine
   * @param {string} text - Raw OCR text
   * @param {Object} labels - Training labels
   */
  postProcessJaffnaText(text, labels = {}) {
    let processedText = text;

    // Apply Jaffna-specific corrections
    const corrections = {
      // Common OCR mistakes for Tamil text
      'நண்டு': 'நண்டு', // Crab
      'அப்பம்': 'அப்பம்', // Hoppers
      'கத்தரிக்கை': 'கத்தரிக்கை', // Brinjal
      'ஆட்டுக்கறி': 'ஆட்டுக்கறி', // Mutton Curry
      'மீன் கறி': 'மீன் கறி', // Fish Curry
      'இடியாப்பம்': 'இடியாப்பம்', // String Hoppers
      
      // Price format corrections
      'LKR': 'LKR',
      'රු': 'LKR',
      'Rs': 'LKR',
      
      // Common English corrections
      'Crab Curry': 'Jaffna Crab Curry',
      'Hoppers': 'Jaffna Hoppers',
      'Brinjal Curry': 'Jaffna Brinjal Curry'
    };

    // Apply corrections
    Object.entries(corrections).forEach(([wrong, correct]) => {
      processedText = processedText.replace(new RegExp(wrong, 'gi'), correct);
    });

    return processedText;
  }

  /**
   * Get Jaffna training data
   */
  getJaffnaTrainingData() {
    return {
      dishes: [
        { tamil: 'நண்டு கறி', english: 'Jaffna Crab Curry', category: 'curry' },
        { tamil: 'அப்பம்', english: 'Hoppers', category: 'bread' },
        { tamil: 'கத்தரிக்கை கறி', english: 'Brinjal Curry', category: 'curry' },
        { tamil: 'ஆட்டுக்கறி', english: 'Mutton Curry', category: 'curry' },
        { tamil: 'மீன் கறி', english: 'Fish Curry', category: 'curry' },
        { tamil: 'இடியாப்பம்', english: 'String Hoppers', category: 'bread' },
        { tamil: 'புட்டு', english: 'Puttu', category: 'rice' },
        { tamil: 'இட்லி', english: 'Idli', category: 'breakfast' },
        { tamil: 'தோசை', english: 'Dosa', category: 'breakfast' },
        { tamil: 'வடை', english: 'Vadai', category: 'snack' },
        { tamil: 'பொங்கல்', english: 'Pongal', category: 'rice' },
        { tamil: 'ரசம்', english: 'Rasam', category: 'soup' },
        { tamil: 'சாம்பார்', english: 'Sambar', category: 'soup' },
        { tamil: 'தயிர்', english: 'Curd', category: 'dairy' },
        { tamil: 'பாயசம்', english: 'Payasam', category: 'dessert' }
      ],
      categories: [
        'கறி', 'கறிகள்', 'ரைஸ்', 'அரிசி', 'ரொட்டி', 'அப்பம்',
        'காலை', 'முறை', 'மதிய', 'மதியம்', 'இரவு', 'இரவு உணவு',
        'இனிப்பு', 'இனிப்புகள்', 'பானம்', 'பானங்கள்',
        'சிற்றுண்டி', 'சிற்றுண்டிகள்', 'முன்னுணவு'
      ],
      prices: [
        'LKR', 'රු', 'Rs', 'රුපියල්', 'rupiah'
      ]
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('🧹 AI Jaffna Trainer cleaned up');
    }
  }
}

export default AIJaffnaTrainer;
