async function loadImage(e){const a=new Image;return new Promise((t=>{a.addEventListener("load",(()=>{t(a)})),a.addEventListener("error",(()=>{t(void 0)})),a.src=e}))}async function main(){const e=await loadImage("./test-dataset/a_3.jpg"),a=await loadImage("./test-dataset/b_3.jpg"),t=await StereoDepthHelper.getDepthMapping(e,a);document.body.appendChild(t)}main();
