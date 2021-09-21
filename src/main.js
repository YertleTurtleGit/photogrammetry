/* global DOM_ELEMENTS, StereoDepthHelper */

/**
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
async function loadImage(url) {
   const image = new Image();
   return new Promise((resolve) => {
      image.addEventListener("load", () => {
         resolve(image);
      });
      image.addEventListener("error", () => {
         resolve(undefined);
      });
      image.src = url;
   });
}

async function main() {
   const imageA = await loadImage("./test-dataset/a.jpg");
   const imageB = await loadImage("./test-dataset/b.jpg");

   const result = await StereoDepthHelper.getDepthMapping(imageA, imageB);

   document.body.appendChild(result);
}

main();
