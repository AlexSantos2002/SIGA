import { Injectable } from '@angular/core';
import { supabase } from '../../../supabase/supabase';
import { DBError } from '../error/app-error';
import { ERROR_CODES } from '../error/error-codes';

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
    const extension = file.name.split('.').pop();

    const filePath = `${animalId}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from('animals').upload(filePath, file);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return filePath;
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
    let imagePath;

    try {
      imagePath = await this.updateImageToStorage(animalId, file);
      await this.updateAnimalTableImage(animalId, imagePath);
    } catch (err) {
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
    let newImagePath: string | null = null;

    try {
      newImagePath = await this.updateImageToStorage(animalId, file);

      await this.updateAnimalTableImage(animalId, newImagePath);
    } catch (err) {
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
    } catch (err) {
      throw new DBError(ERROR_CODES.IMAGE_DELETE_FAILED);
    }
  }
}
