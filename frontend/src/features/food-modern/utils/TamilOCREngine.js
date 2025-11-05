// Placeholder for Tesseract fine-tuned Tamil OCR
import Tesseract from "tesseract.js";

export async function recognizeTamilMenu(imageFile) {
  const { data: { text } } = await Tesseract.recognize(
    imageFile,
    "tam+eng",
    { logger: m => console.log(m) }
  );
  return text;
}
