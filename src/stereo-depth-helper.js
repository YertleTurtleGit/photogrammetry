/* exported StereoDepthHelper */
/* global GLSL */

class StereoDepthHelper {
   /**
    * @public
    * @param {HTMLImageElement} imageA
    * @param {HTMLImageElement} imageB
    * @param {number} needleChunkSize
    * @returns {Promise<HTMLImageElement>}
    */
   static async getDepthMapping(imageA, imageB, needleChunkSize = 3) {
      /** @type {number[][]} */
      const needleChunks = this.getImageChunks(imageA, needleChunkSize);

      return this.getNeedleChunkFitMap(
         needleChunks[0],
         needleChunkSize,
         imageB
      );

      /*needleChunks.forEach((needleChunk) => {
         this.getNeedleChunkFitMap(needleChunk, needleChunkSize, imageB);
      });*/
   }

   /**
    * @param {number[]} needleChunk
    * @param {number} needleChunkSize
    * @param {HTMLImageElement} haystackImage
    * @returns {Promise<HTMLImageElement>}
    */
   static async getNeedleChunkFitMap(
      needleChunk,
      needleChunkSize,
      haystackImage
   ) {
      const shader = new GLSL.Shader({
         width: haystackImage.width,
         height: haystackImage.height,
      });
      shader.bind();

      console.log(needleChunk);
      const needleChunkMiddle = (needleChunkSize - 1) / 2;

      const haystack = new GLSL.Image(haystackImage);
      let difference = new GLSL.Float(0);

      for (let x = 0; x < needleChunkSize; x++) {
         for (let y = 0; y < needleChunkSize; y++) {
            const index = (x + y * needleChunkSize) * 3;

            const haystackPixelColor = haystack.getNeighborPixel(
               x - needleChunkMiddle,
               y - needleChunkMiddle
            );

            console.log([x, y]);

            const redDifference = haystackPixelColor
               .channel(0)
               .subtractFloat(new GLSL.Float(needleChunk[index + 0] / 255));

            const greenDifference = haystackPixelColor
               .channel(1)
               .subtractFloat(new GLSL.Float(needleChunk[index + 1] / 255));

            const blueDifference = haystackPixelColor
               .channel(2)
               .subtractFloat(new GLSL.Float(needleChunk[index + 2] / 255));

            difference = difference.addFloat(
               redDifference,
               greenDifference,
               blueDifference
            );
         }
      }

      difference = difference.divideFloat(
         new GLSL.Float(Math.pow(needleChunkSize, 2) * 3)
      );

      const rendering = GLSL.render(
         new GLSL.Vector4([
            difference,
            difference,
            difference,
            new GLSL.Float(1),
         ])
      );

      return rendering.getJsImage();
   }

   /**
    * @private
    * @param {HTMLImageElement} image
    * @param {number} chunkSize
    * @returns {number[][]}
    */
   static getImageChunks(image, chunkSize) {
      const shader = new GLSL.Shader({
         width: image.width,
         height: image.height,
      });
      shader.bind();
      const pixelArray = GLSL.render(GLSL.Image.load(image)).getPixelArray();
      shader.purge();

      /** @type {number[][]} */
      const chunks = [];
      let chunkIndex = 0;

      for (let xOffset = 0; xOffset < image.width; xOffset += chunkSize) {
         for (let yOffset = 0; yOffset < image.height; yOffset += chunkSize) {
            chunks.push([]);

            for (let x = 0; x < chunkSize; x++) {
               for (let y = 0; y < chunkSize; y++) {
                  const index = (x + xOffset + (y + yOffset) * image.width) * 4;
                  const red = pixelArray[index];
                  const green = pixelArray[index + 1];
                  const blue = pixelArray[index + 2];
                  chunks[chunkIndex].push(red, green, blue);
               }
            }
            chunkIndex++;
         }
      }
      return chunks;
   }
}
