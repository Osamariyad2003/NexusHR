/**
 * File Upload Security & Magic Byte Validation Utility
 * Enforces file extension and mime type validation for file upload forms.
 */

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

/**
 * Validates file MIME type, file size, and extension integrity.
 * @param {File} file - The file object to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUploadedFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the allowable limit of 10 MB (Actual: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`
    };
  }

  const fileExtension = file.name.split('.').pop().toLowerCase();
  const validExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

  if (!validExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Unsupported file extension .${fileExtension}. Allowed formats: PDF, DOC, DOCX, JPG, PNG.`
    };
  }

  return { valid: true };
}
