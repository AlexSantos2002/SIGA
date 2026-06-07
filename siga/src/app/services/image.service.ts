import { Injectable } from '@angular/core';
import { supabase } from '../../../supabase/supabase';
import { DBError } from '../error/app-error';
import { ERROR_CODES } from '../error/error-codes';


/**
 * Serviço responsável pelo CRUD de imagens
 * de animais
 */
@Injectable({
  providedIn: 'root',
})
export class ImageService {

  /**
   * Faz o upload de uma imagem para o Supabase Storage
   * @param animalId id do animal
   * @param file imagem para ser guardada
   */
  private async updateImageToStorage(
    animalId: string,
    file: File
  ): Promise<string> {

    const extension = file.name.split('.').pop();

    const filePath =
      `${animalId}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from('animals')
      .upload(filePath, file);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return filePath;
  }

  /**
   * Remove uma imagem do Supabase Storage
   * @param imagePath path da imagem armazenada
   */
  private async deleteImageFromStorage(
    imagePath: string
  ): Promise<void> {

    const { error } = await supabase.storage
      .from('animals')
      .remove([imagePath]);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }


  /**
   * Atualiza a tabela "animals" com a imagem armazenada no Supabase Storage
   * @param animalId id do animal a ser atualizado
   * @param imagePath path da imagem
   */
  private async updateAnimalTableImage(
    animalId: string,
    imagePath: string
  ): Promise<void> {

    const { error } = await supabase
      .from('animals')
      .update({
        image_path: imagePath
      })
      .eq('id', animalId);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * Remove a referência da imagem da tabela animals
   * @param animalId id do animal
   */
  private async deleteAnimalTableImage(
    animalId: string
  ): Promise<void> {

    const { error } = await supabase
      .from('animals')
      .update({
        image_path: null
      })
      .eq('id', animalId);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * Faz o upload de uma nova imagem para um animal,
   * realizando o upload no supabase storage e atualizando
   * a table animals
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
   * Obtem a URL da imagem de um animal.
   * Retorna null caso o animal não possua imagem
   * @param imagePath imagePath: path para a imagem
   */
  getAnimalImage(imagePath: string): string | null {
    if (!imagePath) {
      return null;
    }

    const { data } = supabase.storage
      .from('animals')
      .getPublicUrl(imagePath)

    return data.publicUrl;
  }


  /**
   * Realiza a substituição de uma imagem
   * @param animalId id do animal
   * @param oldImagePath path da imagem anterior
   * @param file nova imagem para substituição
   */
  async replaceImage(
    animalId: string,
    oldImagePath: string,
    file: File
  ): Promise<void> {

    let newImagePath: string;

    try {
      await this.deleteImageFromStorage(oldImagePath);

      newImagePath = await this.updateImageToStorage(
        animalId,
        file
      );

      await this.updateAnimalTableImage(
        animalId,
        newImagePath
      );
    } catch (err) {
      throw new DBError(ERROR_CODES.IMAGE_UPLOAD_FAILED);
    }
  }

  /**
   * Remove a imagem de um animal
   * @param animalId id do animal
   * @param imagePath path da imagem armazenada
   */
  async deleteImage(
    animalId: string,
    imagePath: string
  ): Promise<void> {

    try {
      await this.deleteImageFromStorage(imagePath);
      await this.deleteAnimalTableImage(animalId);
    } catch (err) {
      throw new DBError(ERROR_CODES.IMAGE_DELETE_FAILED);
    }
  }
}
