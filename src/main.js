async function loadImage(a){const e=new Image;return new Promise((t=>{e.addEventListener("load",(()=>{t(e)})),e.addEventListener("error",(()=>{t(void 0)})),e.src=a}))}async function main(){const a=await loadImage("./test-dataset/a_2.jpg"),e=await loadImage("./test-dataset/a_2.jpg"),t=await StereoDepthHelper.getDepthMapping(a,e);document.body.appendChild(t)}main();
