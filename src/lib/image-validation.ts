import { AppError } from "./errors";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];

/** Client-side guard before reading a File into a data URL. */
export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new AppError("Поддерживаются только PNG, JPG и WEBP.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new AppError("Размер изображения не должен превышать 8 МБ.");
  }
}

/** Server-side guard for a base64 data URL coming from the client. */
export function validateDataUrl(dataUrl: string): void {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new AppError("Некорректный формат изображения.");
  }
  const mime = match[1];
  if (!ALLOWED_MIME.includes(mime)) {
    throw new AppError("Недопустимый тип изображения.");
  }
  const approxBytes = (match[2].length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) {
    throw new AppError("Изображение слишком большое (макс. 8 МБ).");
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new AppError("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}
