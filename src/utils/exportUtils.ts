import html2canvas from 'html2canvas';

interface DownloadOptions {
  backgroundColor?: string | null;
}

export const downloadAsImage = async (elementId: string, filename: string, options: DownloadOptions = {}) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor !== undefined ? options.backgroundColor : null, // Use passed color or default to null (transparent)
      scale: 2, // Higher resolution
      useCORS: true, // often helps with fonts/images
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Export failed:', error);
  }
};
