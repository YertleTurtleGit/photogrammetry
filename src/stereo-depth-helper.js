class StereoDepthHelper{static async getDepthMapping(e,t,a=51,n=7){e=await StereoDepthHelper.preprocessImage(e),t=await StereoDepthHelper.preprocessImage(t);const h=StereoDepthHelper.getImageChunks(e,a),o=document.createElement("canvas");o.width=e.width,o.height=t.height;const r=o.getContext("2d"),i=document.createElement("canvas");i.width=e.width,i.height=2*t.height;const l=i.getContext("2d");document.body.appendChild(o),document.body.appendChild(i),l.drawImage(e,0,0,e.width,e.height),l.drawImage(t,0,e.height,e.width,e.height);for(let o=0;o<h.length;o++){const i=h[o],s={x:i.offset.x+a,y:i.offset.y+a},d=await StereoDepthHelper.getFeaturePoint(i.data,t,n);if(d){const t={x:s.x-d.x,y:s.y-d.y},n=Math.sqrt(Math.pow(t.x,2)+Math.pow(t.y,2)),h=String(255-Math.round(Math.min(255,n)));l.beginPath(),l.moveTo(s.x,s.y),l.strokeStyle="red",l.lineTo(d.x,d.y+e.height),l.stroke(),r.fillStyle="rgb("+h+", "+h+", "+h+")",r.fillRect(i.offset.x,i.offset.y,a,a)}}return null}static async preprocessImage(e){const t=new GLSL.Shader({width:e.width,height:e.height});t.bind();const a=new GLSL.Image(e),n=GLSL.render(a.applyFilter([[-1,-1,-1],[-1,8.5,-1],[-1,-1,-1]])).getJsImage();return t.purge(),n}static async getFeaturePoint(e,t,a){const n=await StereoDepthHelper.getNeedleChunkFitMap(e,t,a);return StereoDepthHelper.getBrightestPixel(n)}static async getNeedleChunkFitMap(e,t,a){const n=new GLSL.Shader({width:t.width,height:t.height});n.bind();const h=Math.sqrt(e.length/3),o=(h-1)/2,r=new GLSL.Image(t);let i=new GLSL.Float(0),l=0;for(let e=0;e<h;e+=a)for(let e=0;e<h;e+=a)l++;for(let t=0;t<h;t+=a)for(let n=0;n<h;n+=a){const a=3*(t+n*h),s=r.getNeighborPixel(t-o,n-o),d=s.channel(0).subtractFloat(new GLSL.Float(e[a+0]/255)).abs(),g=s.channel(1).subtractFloat(new GLSL.Float(e[a+1]/255)).abs(),c=s.channel(2).subtractFloat(new GLSL.Float(e[a+2]/255)).abs();i=i.addFloat(d.divideFloat(new GLSL.Float(3*l)),g.divideFloat(new GLSL.Float(3*l)),c.divideFloat(new GLSL.Float(3*l)))}i=new GLSL.Float(1).subtractFloat(i);const s=GLSL.render(new GLSL.Vector4([i,i,i,new GLSL.Float(1)])).getJsImage();return n.purge(),s}static getImageChunks(e,t){const a={width:e.width,height:e.height},n=new GLSL.Shader(a);n.bind();const h=GLSL.render(GLSL.Image.load(e)).getPixelArray();n.unbind();const o=[];let r=0;for(let e=0;e+t<a.width;e+=t)for(let n=0;n+t<a.height;n+=t){o.push({data:[],offset:{x:e,y:n}});for(let i=0;i<t;i++)for(let l=0;l<t;l++){const t=4*(i+e+(l+n)*a.width),s=h[t+0],d=h[t+1],g=h[t+2];o[r].data.push(s,d,g)}r++}return o}static getBrightestPixel(e){let t,a=0;const n={width:e.width,height:e.height},h=new GLSL.Shader(n);h.bind();const o=GLSL.render(GLSL.Image.load(e)).getPixelArray();h.unbind();let r=0;for(let e=0;e<n.width;e++)for(let h=0;h<n.height;h++){const i=o[4*(e+h*n.width)];i>a&&(t={x:e,y:h},a=i),i===a&&r++}if(!(a<200||r>40))return t;console.log({brightestValue:a,twinCount:r})}}
