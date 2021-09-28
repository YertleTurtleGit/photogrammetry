/* exported StereoDepthHelper */
/* global GLSL */

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
      needleChunkSize = 15,
      chunkSamplingStep = 1
   ) {
      return new Promise((resolve) => {
         setTimeout(async () => {
            imageA = await StereoDepthHelper.preprocessImage(imageA);
            imageB = await StereoDepthHelper.preprocessImage(imageB);

            const dimensions = { width: imageA.width, height: imageA.height };

            const shaderA = new GLSL.Shader(dimensions);
            shaderA.bind();
            const pixelArrayA = GLSL.render(
               GLSL.Image.load(imageA)
            ).getPixelArray();
            shaderA.purge();

            const shaderB = new GLSL.Shader(dimensions);
            shaderB.bind();
            const pixelArrayB = GLSL.render(
               GLSL.Image.load(imageB)
            ).getPixelArray();
            shaderB.purge();

            const chunksA = StereoDepthHelper.getImageChunks(
               pixelArrayA,
               dimensions,
               needleChunkSize
            );

            const depthMapCanvas = document.createElement("canvas");
            depthMapCanvas.width = dimensions.width;
            depthMapCanvas.height = dimensions.height;
            const depthMapCanvasContext = depthMapCanvas.getContext("2d");

            const uiCanvas = document.createElement("canvas");
            uiCanvas.width = dimensions.width;
            uiCanvas.height = dimensions.height * 2;
            const uiCanvasContext = uiCanvas.getContext("2d");

            document.body.appendChild(depthMapCanvas);
            document.body.appendChild(uiCanvas);

            uiCanvasContext.drawImage(
               imageA,
               0,
               0,
               dimensions.width,
               dimensions.height
            );
            uiCanvasContext.drawImage(
               imageB,
               0,
               dimensions.height,
               dimensions.width,
               dimensions.height
            );

            for (let i = 0; i < chunksA.length; i++) {
               const chunk = chunksA[i];

               const sourcePoint = {
                  x: chunk.offset.x + (needleChunkSize - 1) / 2,
                  y: chunk.offset.y + (needleChunkSize - 1) / 2,
               };
               StereoDepthHelper.getBestNeedleChunkFit(
                  chunk,
                  pixelArrayB,
                  dimensions,
                  chunkSamplingStep
               ).then((projectionPoint) => {
                  if (projectionPoint) {
                     const distanceVector = {
                        x: sourcePoint.x - projectionPoint.x,
                        y: sourcePoint.y - projectionPoint.y,
                     };

                     let distance = Math.sqrt(
                        Math.pow(distanceVector.x, 2) +
                           Math.pow(distanceVector.y, 2)
                     );

                     distance *= 3;

                     console.log(distance);

                     const depthString = String(
                        255 - Math.round(Math.min(255, distance))
                     );

                     uiCanvasContext.beginPath();
                     uiCanvasContext.moveTo(sourcePoint.x, sourcePoint.y);
                     uiCanvasContext.strokeStyle = "red";
                     uiCanvasContext.lineTo(
                        projectionPoint.x,
                        projectionPoint.y + dimensions.height
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
               });
            }

            resolve(null);
         });
      });
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
         glslImage.applyFilter([
            [-1, -1, -1],
            [-1, 8.5, -1],
            [-1, -1, -1],
         ])
      ).getJsImage();

      shader.purge();

      //return filteredImage;
      return image;
   }

   /**
    * @private
    * @param {{data:number[], offset:{x:number, y:number}}} needleChunk
    * @param {Uint8Array} haystackPixelArray
    * @param {{width:number, height:number}} dimensions
    * @param {number} chunkSamplingStep
    * @returns {Promise<{x:number, y:number}>}
    */
   static async getBestNeedleChunkFit(
      needleChunk,
      haystackPixelArray,
      dimensions,
      chunkSamplingStep
   ) {
      return new Promise((resolve) => {
         setTimeout(() => {
            const needleChunkSize = Math.sqrt(needleChunk.data.length / 4);
            const chunkOffset = (needleChunkSize - 1) / 2;

            let lowestAberrance = Number.MAX_VALUE;
            let bestFitCoordinate;
            let twinCount = 0;

            for (let x = 0; x < dimensions.width; x++) {
               for (let y = 0; y < dimensions.height; y++) {
                  let aberrance = 0;

                  for (
                     let xc = 0;
                     xc < needleChunkSize;
                     xc += chunkSamplingStep
                  ) {
                     for (
                        let yc = 0;
                        yc < needleChunkSize;
                        yc += chunkSamplingStep
                     ) {
                        const xCoordinate = x + xc + chunkOffset;
                        const yCoordinate = y + yc + chunkOffset;

                        const haystackIndex =
                           (xCoordinate + yCoordinate * dimensions.width) * 4;

                        const haystackRed =
                           haystackPixelArray[haystackIndex + 0];
                        const haystackGreen =
                           haystackPixelArray[haystackIndex + 1];
                        const haystackBlue =
                           haystackPixelArray[haystackIndex + 2];

                        const needleIndex = (yc + xc * needleChunkSize) * 4;

                        const needleRed = needleChunk.data[needleIndex + 0];
                        const needleGreen = needleChunk.data[needleIndex + 1];
                        const needleBlue = needleChunk.data[needleIndex + 2];

                        const redAberrance = Math.abs(haystackRed - needleRed);
                        const greenAberrance = Math.abs(
                           haystackGreen - needleGreen
                        );
                        const blueAberrance = Math.abs(
                           haystackBlue - needleBlue
                        );

                        aberrance +=
                           redAberrance + greenAberrance + blueAberrance;
                     }
                  }

                  if (aberrance < lowestAberrance) {
                     lowestAberrance = aberrance;
                     bestFitCoordinate = {
                        x: x + needleChunkSize,
                        y: y + needleChunkSize,
                     };
                  } else if (aberrance === lowestAberrance) {
                     twinCount++;
                  }

                  if (lowestAberrance === 0) {
                     console.log({
                        bestFitCoordinate,
                        lowestAberrance,
                        twinCount,
                     });
                     resolve(bestFitCoordinate);
                     return;
                  }
               }
            }

            console.log({ bestFitCoordinate, lowestAberrance, twinCount });
            resolve(bestFitCoordinate);
         });
      });
   }

   /**
    * @private
    * @param {Uint8Array} imageArray
    * @param {{width:number, height:number}} imageDimensions
    * @param {number} chunkSize
    * @returns {{data:number[], offset:{x:number, y:number}}[]}
    */
   static getImageChunks(imageArray, imageDimensions, chunkSize) {
      /** @type {{data:number[], offset:{x:number, y:number}}[]} */
      const chunks = [];
      let chunkIndex = 0;

      for (
         let xOffset = (chunkSize - 1) / 2;
         xOffset < imageDimensions.width - (chunkSize - 1) / 2;
         xOffset += chunkSize
      ) {
         for (
            let yOffset = (chunkSize - 1) / 2;
            yOffset < imageDimensions.height - (chunkSize - 1) / 2;
            yOffset += chunkSize
         ) {
            chunks.push({ data: [], offset: { x: xOffset, y: yOffset } });

            for (let x = 0; x < chunkSize; x++) {
               for (let y = 0; y < chunkSize; y++) {
                  const xIndex = x + xOffset;
                  const yIndex = y + yOffset;
                  const index = (xIndex + yIndex * imageDimensions.width) * 4;

                  const red = imageArray[index + 0];
                  const green = imageArray[index + 1];
                  const blue = imageArray[index + 2];
                  const alpha = imageArray[index + 3];

                  chunks[chunkIndex].data.push(red, green, blue, alpha);
               }
            }
            chunkIndex++;
         }
      }
      return chunks;
   }

   /**
    * @deprecated
    * @private
    * @param {number[]} needleChunk
    * @param {HTMLImageElement} haystackImage
    * @param {number} chunkSamplingStep
    * @returns {Promise<HTMLImageElement>}
    */
   static async getNeedleChunkFitMapGPU(
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
               redDifference,
               greenDifference,
               blueDifference
            );

            count++;
         }
      }

      difference = new GLSL.Float(1).subtractFloat(
         difference.divideFloat(new GLSL.Float(count * 3))
      );

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
}
