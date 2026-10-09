package com.agenthire.service.extraction;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Slf4j
@Service
public class ResumeTextExtractorService {

    public static final int MAX_EXTRACTED_CHARACTERS = 30_000;

    /**
     * Extracts text from an input stream according to the detected file extension.
     */
    public String extractText(InputStream inputStream, String fileExtension) {
        if (inputStream == null) {
            throw new IllegalArgumentException("InputStream cannot be null");
        }

        String ext = fileExtension != null ? fileExtension.trim().toLowerCase() : "";
        if (ext.startsWith(".")) {
            ext = ext.substring(1);
        }

        try {
            String rawText;
            if ("pdf".equals(ext)) {
                rawText = extractFromPdf(inputStream);
            } else if ("docx".equals(ext)) {
                rawText = extractFromDocx(inputStream);
            } else {
                throw new IllegalArgumentException("Unsupported file type for text extraction: " + fileExtension);
            }

            return sanitizeAndLimitText(rawText);
        } catch (Exception e) {
            log.error("Failed to extract text from resume file (ext: {})", fileExtension, e);
            throw new RuntimeException("Text extraction failed: " + e.getMessage(), e);
        }
    }

    private String extractFromPdf(InputStream inputStream) throws Exception {
        byte[] bytes = inputStream.readAllBytes();
        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.isEncrypted()) {
                throw new IllegalStateException("PDF is encrypted / password-protected and cannot be processed.");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            if (text == null || text.trim().isEmpty()) {
                log.warn("Extracted PDF text is empty. The document may be scanned or image-only.");
                return "";
            }
            return text;
        }
    }

    private String extractFromDocx(InputStream inputStream) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            String text = extractor.getText();
            return text != null ? text : "";
        }
    }

    private String sanitizeAndLimitText(String text) {
        if (text == null) {
            return "";
        }
        // Normalize line breaks and remove null / unprintable control chars
        String cleaned = text.replace("\u0000", "")
                .replaceAll("[\\r\\n]+", "\n")
                .trim();

        if (cleaned.length() > MAX_EXTRACTED_CHARACTERS) {
            log.info("Extracted resume text length ({}) exceeded maximum limit ({}). Truncating safely.",
                    cleaned.length(), MAX_EXTRACTED_CHARACTERS);
            cleaned = cleaned.substring(0, MAX_EXTRACTED_CHARACTERS) + "\n\n[TRUNCATED: Exceeded character limit]";
        }

        return cleaned;
    }
}
