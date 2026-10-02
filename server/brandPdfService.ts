import { GoogleGenAI } from '@google/genai';
import * as pdfParseModule from 'pdf-parse';
import { BrandDesignSystem } from '../src/types/auth.js';

export interface PdfBrandAnalysisResult {
  success: boolean;
  suggestions?: BrandDesignSystem['pdfSuggestions'];
  extractedSummary?: string;
  pageCount?: number;
  rawTextSnippet?: string;
  error?: string;
}

export async function analyzeBrandGuidelinesPdf(
  pdfBuffer: Buffer,
  apiKey: string
): Promise<PdfBrandAnalysisResult> {
  try {
    let extractedText = '';
    let numPages = 1;

    try {
      // 1. Text extraction with pdf-parse PDFParse class if available
      const PDFParseClass = (pdfParseModule as any).PDFParse;
      if (typeof PDFParseClass === 'function') {
        const parser = new PDFParseClass({ data: pdfBuffer });
        if (typeof parser.load === 'function') {
          await parser.load();
        }
        if (typeof parser.getText === 'function') {
          const res = await parser.getText();
          extractedText = (res?.text || '').trim();
          numPages = res?.pages?.length || 1;
        }
      }
    } catch (parseErr: any) {
      console.warn('[Brand PDF Service] Direct parser note, fallback to raw buffer processing:', parseErr?.message);
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const prompt = `You are a Senior Creative Director & Brand Identity Architect.
Carefully analyze the attached Brand Guidelines document and extract the core brand styling tokens into a structured JSON object.

EXTRACTED DOCUMENT TEXT (OR DOCUMENT CONTENT):
"""
${extractedText.slice(0, 12000) || 'Official company brand guidelines document'}
"""

Extract the following brand attributes (suggest closest authentic matches if not explicitly specified):
1. primaryColor: hex color (e.g. #0A0B0E)
2. secondaryColor: hex color (e.g. #FF4500)
3. accentColor: hex color (e.g. #2563EB)
4. backgroundColor: hex color (e.g. #F8FAFC)
5. textColor: hex color (e.g. #111827)
6. headingFont: heading font name or typography direction (e.g. "Inter", "Syne", "Montserrat Bold")
7. bodyFont: body font name or typography direction (e.g. "Inter", "Manrope")
8. visualStyleNotes: concise summary of art direction, composition, aesthetics
9. imageStyle: photography direction, lighting, composition, camera style
10. videoStyleDirection: motion graphics pacing, camera direction, grading
11. creativeRules: critical dos and don'ts, claims to avoid, brand rules
12. brandVoiceNote: brand personality, tone of voice
13. extractedSummary: 2-sentence summary of the brand system found in the document.

Output strictly valid JSON with these exact keys.`;

    let response;
    try {
      // Support native multimodal inline PDF data for Gemini 3.8 Flash
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBuffer.toString('base64')
                }
              }
            ]
          }
        ],
        config: { responseMimeType: 'application/json' }
      });
    } catch {
      // Text fallback
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
    }

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    return {
      success: true,
      suggestions: {
        primaryColor: parsedData.primaryColor || '#111827',
        secondaryColor: parsedData.secondaryColor || '#FF4500',
        accentColor: parsedData.accentColor || '#2563EB',
        backgroundColor: parsedData.backgroundColor || '#F8FAFC',
        textColor: parsedData.textColor || '#111827',
        headingFont: parsedData.headingFont || 'Inter',
        bodyFont: parsedData.bodyFont || 'Inter',
        visualStyleNotes: parsedData.visualStyleNotes || 'Clean, grounded, high clarity brand design.',
        imageStyle: parsedData.imageStyle || 'Authentic photography with subtle brand overlays.',
        videoStyleDirection: parsedData.videoStyleDirection || 'Dynamic, punchy video pacing with on-brand typography.',
        creativeRules: parsedData.creativeRules || 'Adhere strictly to official brand guidelines.',
        brandVoiceNote: parsedData.brandVoiceNote || 'Clear, confident and authentic.',
        extractedSummary: parsedData.extractedSummary || `Analyzed brand guidelines document (${numPages} pages).`
      },
      extractedSummary: parsedData.extractedSummary,
      pageCount: numPages,
      rawTextSnippet: extractedText.slice(0, 300)
    };
  } catch (err: any) {
    console.error('[Brand PDF Service] Failed to analyze PDF:', err);
    return {
      success: false,
      error: err?.message || 'Failed to analyze brand guidelines PDF'
    };
  }
}
