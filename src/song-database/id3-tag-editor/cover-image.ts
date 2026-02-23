const MAX_DIMENSION = 600;
const JPEG_QUALITY = 0.85;

function guessMimeTypeFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return null;
}

function isSupportedImageMime(mime: string): boolean {
  return mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp';
}

async function fileToBlobWithType(file: File): Promise<Blob> {
  if (file.type && isSupportedImageMime(file.type)) {
    return file;
  }

  const guessed = guessMimeTypeFromName(file.name);
  const type = guessed && isSupportedImageMime(guessed) ? guessed : 'image/jpeg';
  const bytes = await file.arrayBuffer();
  return new Blob([bytes], { type });
}

async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });

    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

export async function normalizeCoverImageToDataUrl(file: File): Promise<string> {
  const blob = await fileToBlobWithType(file);
  const img = await loadImageFromBlob(blob);

  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (!srcWidth || !srcHeight) {
    throw new Error('Invalid image dimensions');
  }

  const scale = Math.min(1, MAX_DIMENSION / srcWidth, MAX_DIMENSION / srcHeight);
  const targetWidth = Math.max(1, Math.round(srcWidth * scale));
  const targetHeight = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }

  // JPEG has no alpha; flatten with the current app background (when available).
  const bg = getComputedStyle(document.body).backgroundColor;
  if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const outBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      b => {
        if (!b) {
          reject(new Error('Failed to encode image'));
          return;
        }
        resolve(b);
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });

  return blobToDataUrl(outBlob);
}

export function getClipboardImageFile(e: ClipboardEvent): File | null {
  const items = e.clipboardData?.items ? Array.from(e.clipboardData.items) : [];
  for (const item of items) {
    if (item.kind !== 'file') continue;
    const f = item.getAsFile();
    if (!f) continue;
    if (f.type && f.type.startsWith('image/')) return f;
  }
  return null;
}

export function getDroppedImageFile(e: DragEvent): File | null {
  const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
  for (const f of files) {
    const mime = f.type || guessMimeTypeFromName(f.name) || '';
    if (mime.startsWith('image/')) return f;
  }
  return null;
}
