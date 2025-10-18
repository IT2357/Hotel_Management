const AIExtractor = require('../utils/AIExtractor');

describe('AIExtractor', () => {
  describe('parseOCRText', () => {
    it('should extract Jaffna dish names in English', () => {
      const text = 'Jaffna Crab Curry\nLKR 500\nFresh crab in coconut sauce';
      const result = AIExtractor.parseOCRText(text);
      
      expect(result.name.en).toBe('Crab Curry');
      expect(result.category).toBe('Curry');
      expect(result.tags).toContain('Jaffna');
      expect(result.tags).toContain('Seafood');
    });

    it('should extract Jaffna dish names in Tamil', () => {
      const text = 'நண்டு கறி\nLKR 500\nபுதிய நண்டு தேங்காய் சோஸில்';
      const result = AIExtractor.parseOCRText(text);
      
      expect(result.name.ta).toBe('நண்டு கறி');
      expect(result.category).toBe('Curry');
      expect(result.tags).toContain('Jaffna');
      expect(result.tags).toContain('Seafood');
    });

    it('should extract prices correctly', () => {
      const text = 'Hoppers\nLKR 350\nTraditional Jaffna hoppers';
      const result = AIExtractor.parseOCRText(text);
      
      expect(result.originalPrice).toBe(350);
      expect(result.price).toBe(332.5); // 5% discount
    });

    it('should extract ingredients from comma-separated lists', () => {
      const text = 'Brinjal Curry\nLKR 400\nbrinjal, coconut, spices';
      const result = AIExtractor.parseOCRText(text);
      
      expect(result.ingredients).toContain('brinjal');
      expect(result.ingredients).toContain('coconut');
      expect(result.ingredients).toContain('spices');
    });

    it('should categorize different dish types', () => {
      // Test curry
      const curryText = 'Fish Curry\nLKR 450';
      const curryResult = AIExtractor.parseOCRText(curryText);
      expect(curryResult.category).toBe('Curry');
      
      // Test hoppers
      const hoppersText = 'String Hoppers\nLKR 250';
      const hoppersResult = AIExtractor.parseOCRText(hoppersText);
      expect(hoppersResult.category).toBe('Hoppers');
      
      // Test kool
      const koolText = 'Odiyal Kool\nLKR 300';
      const koolResult = AIExtractor.parseOCRText(koolText);
      expect(koolResult.category).toBe('Kool');
    });

    it('should add appropriate tags based on dish names', () => {
      const text = 'Jaffna Mutton Curry\nLKR 600';
      const result = AIExtractor.parseOCRText(text);
      
      expect(result.tags).toContain('Jaffna');
      expect(result.tags).toContain('Traditional');
      expect(result.tags).toContain('Sri Lankan');
    });
  });
});