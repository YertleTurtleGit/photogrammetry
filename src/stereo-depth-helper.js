class StereoDepthHelper{static async getDepthMapping(e,t,n=10){const a=this.getImageChunks(e,n);return console.log(a[0]),this.getNeedleChunkFitMap(a[0],n,e)}static async getNeedleChunkFitMap(e,t,n){new GLSL.Shader({width:n.width,height:n.height}).bind();const a=new GLSL.Image(n),h=new GLSL.Float(0);for(let n=0;n<t;n++)for(let l=0;l<t;l++){const o=3*(n+l*t),r=new GLSL.Vector4([new GLSL.Float(e[o]/255),new GLSL.Float(e[o+1]/255),new GLSL.Float(e[o+2]/255),new GLSL.Float(1)]),s=a.getNeighborPixel(n-t/2,l-t/2);h.addFloat(r.channel(0).subtractFloat(s.channel(0)).abs(),r.channel(1).subtractFloat(s.channel(1)).abs(),r.channel(2).subtractFloat(s.channel(2)).abs())}return GLSL.render(new GLSL.Vector4([h,h,h,new GLSL.Float(1)])).getJsImage()}static getImageChunks(e,t){const n=new GLSL.Shader({width:e.width,height:e.height});n.bind();const a=GLSL.render(GLSL.Image.load(e)).getPixelArray();n.purge();const h=[];let l=0;for(let n=0;n<e.width;n+=t)for(let o=0;o<e.height;o+=t){h.push([]);for(let r=0;r<t;r++)for(let s=0;s<t;s++){const t=4*(r+n+(s+o)*e.width),L=a[t],c=a[t+1],i=a[t+2];h[l].push(L,c,i)}l++}return h}}
