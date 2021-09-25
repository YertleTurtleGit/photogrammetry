/* global StereoDepthHelper */

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

/** */
async function main() {
   const imageA = await loadImage("./test-dataset/a_4.jpg");
   const imageB = await loadImage("./test-dataset/a_4.jpg");

   const result = await StereoDepthHelper.getDepthMapping(imageA, imageB);

   /*const shader = new GLSL.Shader({
      width: imageA.width,
      height: imageA.height,
   });
   shader.bind();

   const result = GLSL.render(
      new GLSL.Image(imageA).applyFilter([
         [0.5, 0, 0],
         [0, 0, 0],
         [0, 0, -0.5],
      ])
   ).getJsImage();

   shader.purge();*/

   document.body.appendChild(result);
}

main();
