/**
 * Converts a File object to a base64 data URL.
 * @param {File} file The file to convert.
 * @returns {Promise<string|null>} A promise that resolves with the base64 string, or null if no file is provided.
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return resolve(null);
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}; 