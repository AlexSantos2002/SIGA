import { Injectable } from '@angular/core';
import { supabase } from '../../../../supabase/supabase';
import { BusinessError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_SIDE_PIXELS = 2048;
const IMAGE_QUALITY_STEPS = [0.82, 0.74, 0.66];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const OPTIMIZED_IMAGE_TYPE = 'image/webp';

/**
 * Gere as imagens dos animais no Supabase Storage.
 */
@Injectable({
  providedIn: 'root',
})
export class ImageService {
  /**
   * Envia uma imagem para o Supabase Storage.
   * @param animalId id do animal
   * @param file imagem para ser guardada
   */
  private async updateImageToStorage(animalId: string, file: File): Promise<string> {
    const extension = IMAGE_EXTENSION_BY_TYPE[file.type] || file.name.split('.').pop();

    const filePath = `${animalId}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from('animals').upload(filePath, file);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return filePath;
  }

  private validateImageType(file: File): void {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new BusinessError(ERROR_CODES.IMAGE_INVALID_TYPE);
    }
  }

  private calculateTargetDimensions(
    width: number,
    height: number,
  ): { width: number; height: number } {
    const largestSide = Math.max(width, height);

    if (largestSide <= MAX_IMAGE_SIDE_PIXELS) {
      return { width, height };
    }

    const scale = MAX_IMAGE_SIDE_PIXELS / largestSide;

    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new BusinessError(ERROR_CODES.IMAGE_PROCESSING_FAILED));
      };

      image.src = objectUrl;
    });
  }

  private canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new BusinessError(ERROR_CODES.IMAGE_PROCESSING_FAILED));
          }
        },
        type,
        quality,
      );
    });
  }

  private withExtension(fileName: string, extension: string): string {
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');

    return `${nameWithoutExtension || 'imagem'}.${extension}`;
  }

  private async optimizeImage(file: File): Promise<File> {
    const image = await this.loadImage(file);
    const dimensions = this.calculateTargetDimensions(image.naturalWidth, image.naturalHeight);
    const shouldResize =
      dimensions.width !== image.naturalWidth || dimensions.height !== image.naturalHeight;
    const shouldCompress = file.size > MAX_IMAGE_SIZE_BYTES || shouldResize;

    if (!shouldCompress) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new BusinessError(ERROR_CODES.IMAGE_PROCESSING_FAILED);
    }

    context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

    let bestBlob: Blob | null = null;

    for (const quality of IMAGE_QUALITY_STEPS) {
      const blob = await this.canvasToBlob(canvas, OPTIMIZED_IMAGE_TYPE, quality);

      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }

      if (blob.size <= MAX_IMAGE_SIZE_BYTES) {
        return new File([blob], this.withExtension(file.name, 'webp'), {
          type: OPTIMIZED_IMAGE_TYPE,
        });
      }
    }

    if (file.size <= MAX_IMAGE_SIZE_BYTES && bestBlob && bestBlob.size > file.size) {
      return file;
    }

    if (bestBlob && bestBlob.size <= MAX_IMAGE_SIZE_BYTES) {
      return new File([bestBlob], this.withExtension(file.name, 'webp'), {
        type: OPTIMIZED_IMAGE_TYPE,
      });
    }

    throw new BusinessError(ERROR_CODES.IMAGE_TOO_LARGE);
  }

  /**
   * Prepara uma imagem para upload, garantindo formato aceite e limite de 10 MB.
   */
  async prepareImageForUpload(file: File): Promise<File> {
    this.validateImageType(file);

    const optimizedFile = await this.optimizeImage(file);

    if (optimizedFile.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BusinessError(ERROR_CODES.IMAGE_TOO_LARGE);
    }

    return optimizedFile;
  }

  /**
   * Remove uma imagem do Supabase Storage.
   * @param imagePath path da imagem armazenada
   */
  private async deleteImageFromStorage(imagePath: string): Promise<void> {
    const { error } = await supabase.storage.from('animals').remove([imagePath]);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * Atualiza a tabela "animals" com a imagem armazenada no Supabase Storage.
   * @param animalId id do animal a ser atualizado
   * @param imagePath path da imagem
   */
  private async updateAnimalTableImage(animalId: string, imagePath: string): Promise<void> {
    const { error } = await supabase
      .from('animals')
      .update({
        image_path: imagePath,
      })
      .eq('id', animalId);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * Remove a referencia da imagem da tabela animals.
   * @param animalId id do animal
   */
  private async deleteAnimalTableImage(animalId: string): Promise<void> {
    const { error } = await supabase
      .from('animals')
      .update({
        image_path: null,
      })
      .eq('id', animalId);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * Associa uma nova imagem a um animal.
   * @param animalId id so animal
   * @param file imagem para ser armazenada
   */
  async uploadImage(animalId: string, file: File): Promise<void> {
    const preparedFile = await this.prepareImageForUpload(file);
    let imagePath;

    try {
      imagePath = await this.updateImageToStorage(animalId, preparedFile);
      await this.updateAnimalTableImage(animalId, imagePath);
    } catch {
      throw new DBError(ERROR_CODES.IMAGE_UPLOAD_FAILED);
    }
  }

  /**
   * Obtem a URL publica da imagem de um animal.
   * Retorna null caso o animal nao possua imagem.
   * @param imagePath imagePath: path para a imagem
   */
  getAnimalImage(imagePath: string | null | undefined): string | null {
    if (!imagePath) {
      return null;
    }

    const { data } = supabase.storage.from('animals').getPublicUrl(imagePath);

    return data.publicUrl;
  }

  /**
   * Substitui a imagem de um animal.
   * @param animalId id do animal
   * @param oldImagePath path da imagem anterior
   * @param file nova imagem para substituição
   */
  async replaceImage(animalId: string, oldImagePath: string, file: File): Promise<void> {
    const preparedFile = await this.prepareImageForUpload(file);
    let newImagePath: string | null = null;

    try {
      newImagePath = await this.updateImageToStorage(animalId, preparedFile);

      await this.updateAnimalTableImage(animalId, newImagePath);
    } catch {
      if (newImagePath) {
        try {
          await this.deleteImageFromStorage(newImagePath);
        } catch (cleanupError) {
          console.warn(
            'Nao foi possivel remover a nova imagem apos falha de substituicao.',
            cleanupError,
          );
        }
      }

      throw new DBError(ERROR_CODES.IMAGE_UPLOAD_FAILED);
    }

    try {
      await this.deleteImageFromStorage(oldImagePath);
    } catch (cleanupError) {
      console.warn('Nao foi possivel remover a imagem antiga apos substituicao.', cleanupError);
    }
  }

  /**
   * Remove a imagem de um animal.
   * @param animalId id do animal
   * @param imagePath path da imagem armazenada
   */
  async deleteImage(animalId: string, imagePath: string | null | undefined): Promise<void> {
    try {
      if (imagePath) {
        await this.deleteImageFromStorage(imagePath);
      }

      await this.deleteAnimalTableImage(animalId);
    } catch {
      throw new DBError(ERROR_CODES.IMAGE_DELETE_FAILED);
    }
  }
}
