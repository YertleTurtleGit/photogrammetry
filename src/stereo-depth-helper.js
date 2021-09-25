/* exported StereoDepthHelper */
/* global GLSL, jsfeat */

class StereoDepthHelper {
   /**
    * @public
    * @param {HTMLImageElement} imageA
    * @param {HTMLImageElement} imageB
    * @param {number} needleChunkSize
    * @param {number} chunkSamplingStep
    * @returns {Promise<HTMLImageElement>}
    */
   static async getDepthMapping(
      imageA,
      imageB,
      needleChunkSize = 51,
      chunkSamplingStep = 7
   ) {
      imageA = await StereoDepthHelper.preprocessImage(imageA);
      imageB = await StereoDepthHelper.preprocessImage(imageB);

      const chunks = StereoDepthHelper.getImageChunks(imageA, needleChunkSize);

      const depthMapCanvas = document.createElement("canvas");
      depthMapCanvas.width = imageA.width;
      depthMapCanvas.height = imageB.height;
      const depthMapCanvasContext = depthMapCanvas.getContext("2d");

      const uiCanvas = document.createElement("canvas");
      uiCanvas.width = imageA.width;
      uiCanvas.height = imageB.height * 2;
      const uiCanvasContext = uiCanvas.getContext("2d");

      document.body.appendChild(depthMapCanvas);
      document.body.appendChild(uiCanvas);

      uiCanvasContext.drawImage(imageA, 0, 0, imageA.width, imageA.height);
      uiCanvasContext.drawImage(
         imageB,
         0,
         imageA.height,
         imageA.width,
         imageA.height
      );

      for (let i = 0; i < chunks.length; i++) {
         const chunk = chunks[i];

         const sourcePoint = {
            x: chunk.offset.x + needleChunkSize,
            y: chunk.offset.y + needleChunkSize,
         };
         const projectionPoint = await StereoDepthHelper.getFeaturePoint(
            chunk.data,
            imageB,
            chunkSamplingStep
         );
         if (projectionPoint) {
            const distanceVector = {
               x: sourcePoint.x - projectionPoint.x,
               y: sourcePoint.y - projectionPoint.y,
            };

            const distance = Math.sqrt(
               Math.pow(distanceVector.x, 2) + Math.pow(distanceVector.y, 2)
            );

            const depthString = String(
               255 - Math.round(Math.min(255, distance))
            );

            uiCanvasContext.beginPath();
            uiCanvasContext.moveTo(sourcePoint.x, sourcePoint.y);
            uiCanvasContext.strokeStyle = "red";
            uiCanvasContext.lineTo(
               projectionPoint.x,
               projectionPoint.y + imageA.height
            );
            uiCanvasContext.stroke();

            depthMapCanvasContext.fillStyle =
               "rgb(" +
               depthString +
               ", " +
               depthString +
               ", " +
               depthString +
               ")";

            depthMapCanvasContext.fillRect(
               chunk.offset.x,
               chunk.offset.y,
               needleChunkSize,
               needleChunkSize
            );
         }
      }

      return null;
   }

   /**
    * @param {HTMLImageElement} image
    * @returns {Promise<HTMLImageElement>}
    */
   static async preprocessImage(image) {
      const shader = new GLSL.Shader({
         width: image.width,
         height: image.height,
      });
      shader.bind();

      const glslImage = new GLSL.Image(image);

      const filteredImage = GLSL.render(
         glslImage.applyFilter(
            [
               [-1, -1, -1],
               [-1, 8.5, -1],
               [-1, -1, -1],
            ],
            true
         )
      ).getJsImage();

      shader.purge();

      return filteredImage;
   }

   /**
    * @param {number[]} sourceImageChunkData
    * @param {HTMLImageElement} projectionImage
    * @param {number} chunkSamplingStep
    * @returns {Promise<{x:number, y:number}>}
    */
   static async getFeaturePoint(
      sourceImageChunkData,
      projectionImage,
      chunkSamplingStep
   ) {
      const chunkFitMap = await StereoDepthHelper.getNeedleChunkFitMap(
         sourceImageChunkData,
         projectionImage,
         chunkSamplingStep
      );

      const brightestPixel = StereoDepthHelper.getBrightestPixel(chunkFitMap);

      return brightestPixel;
   }

   /**
    * @private
    * @param {number[]} needleChunk
    * @param {HTMLImageElement} haystackImage
    * @param {number} chunkSamplingStep
    * @returns {Promise<HTMLImageElement>}
    */
   static async getNeedleChunkFitMap(
      needleChunk,
      haystackImage,
      chunkSamplingStep
   ) {
      const shader = new GLSL.Shader({
         width: haystackImage.width,
         height: haystackImage.height,
      });
      shader.bind();

      const needleChunkSize = Math.sqrt(needleChunk.length / 3);
      const needleChunkMiddle = (needleChunkSize - 1) / 2;

      const haystack = new GLSL.Image(haystackImage);
      let difference = new GLSL.Float(0);

      let count = 0;

      for (let x = 0; x < needleChunkSize; x += chunkSamplingStep) {
         for (let y = 0; y < needleChunkSize; y += chunkSamplingStep) {
            count++;
         }
      }

      for (let x = 0; x < needleChunkSize; x += chunkSamplingStep) {
         for (let y = 0; y < needleChunkSize; y += chunkSamplingStep) {
            const index = (x + y * needleChunkSize) * 3;

            const haystackPixelColor = haystack.getNeighborPixel(
               x - needleChunkMiddle,
               y - needleChunkMiddle
            );

            const redDifference = haystackPixelColor
               .channel(0)
               .subtractFloat(new GLSL.Float(needleChunk[index + 0] / 255))
               .abs();
            const greenDifference = haystackPixelColor
               .channel(1)
               .subtractFloat(new GLSL.Float(needleChunk[index + 1] / 255))
               .abs();
            const blueDifference = haystackPixelColor
               .channel(2)
               .subtractFloat(new GLSL.Float(needleChunk[index + 2] / 255))
               .abs();

            difference = difference.addFloat(
               redDifference.divideFloat(new GLSL.Float(count * 3)),
               greenDifference.divideFloat(new GLSL.Float(count * 3)),
               blueDifference.divideFloat(new GLSL.Float(count * 3))
            );
         }
      }

      difference = new GLSL.Float(1).subtractFloat(difference);

      const rendering = GLSL.render(
         new GLSL.Vector4([
            difference,
            difference,
            difference,
            new GLSL.Float(1),
         ])
      ).getJsImage();

      shader.purge();

      return rendering;
   }

   /**
    * @private
    * @param {HTMLImageElement} image
    * @param {number} chunkSize
    * @returns {{data:number[], offset:{x:number, y:number}}[]}
    */
   static getImageChunks(image, chunkSize) {
      const dimensions = { width: image.width, height: image.height };

      const shader = new GLSL.Shader(dimensions);
      shader.bind();
      const pixelArray = GLSL.render(GLSL.Image.load(image)).getPixelArray();
      shader.unbind();

      /** @type {{data:number[], offset:{x:number, y:number}}[]} */
      const chunks = [];
      let chunkIndex = 0;

      for (
         let xOffset = 0;
         xOffset + chunkSize < dimensions.width;
         xOffset += chunkSize
      ) {
         for (
            let yOffset = 0;
            yOffset + chunkSize < dimensions.height;
            yOffset += chunkSize
         ) {
            chunks.push({ data: [], offset: { x: xOffset, y: yOffset } });

            for (let x = 0; x < chunkSize; x++) {
               for (let y = 0; y < chunkSize; y++) {
                  const xIndex = x + xOffset;
                  const yIndex = y + yOffset;
                  const index = (xIndex + yIndex * dimensions.width) * 4;

                  const red = pixelArray[index + 0];
                  const green = pixelArray[index + 1];
                  const blue = pixelArray[index + 2];

                  chunks[chunkIndex].data.push(red, green, blue);
               }
            }
            chunkIndex++;
         }
      }
      return chunks;
   }

   /**
    * @param {HTMLImageElement} image
    * @returns {{x:number, y:number}}
    */
   static getBrightestPixel(image) {
      let brightestPixel;
      let brightestValue = 0;

      const dimensions = { width: image.width, height: image.height };

      const shader = new GLSL.Shader(dimensions);
      shader.bind();
      const pixelArray = GLSL.render(GLSL.Image.load(image)).getPixelArray();
      shader.unbind();

      let twinCount = 0;

      for (let x = 0; x < dimensions.width; x++) {
         for (let y = 0; y < dimensions.height; y++) {
            const index = (x + y * dimensions.width) * 4;
            const brightness = pixelArray[index];
            if (brightness > brightestValue) {
               brightestPixel = { x: x, y: y };
               brightestValue = brightness;
            }

            if (brightness === brightestValue) {
               twinCount++;
            }
         }
      }

      if (brightestValue < 200 || twinCount > 40) {
         console.log({ brightestValue, twinCount });
         return undefined;
      }
      return brightestPixel;
   }
}
