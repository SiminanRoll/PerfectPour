import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../../web/bar-liquid.js',import.meta.url),'utf8');
const seam='window.BarLiquid = Object.freeze({draw, reset, needsFrame: () => !!scene?.animating});';
assert(source.includes(seam),'Production drawing interface must be present');
const instrumented=source.replace(seam,
  "window.__iceState = () => scene.ingredients.filter(p => p.type === 'ice').map(p => ({x:p.x,y:p.y,r:p.r,angle:p.angle,spin:p.spin,entered:p.entered,delay:p.delay}));\n" + seam
);
const createRenderer = new Function('window',instrumented+'\nreturn window.BarLiquid;');

function makeCanvas() {
  return new Proxy({},{
    get(target,key) {
      if(key in target)return target[key];
      if(key==='createRadialGradient'||key==='createLinearGradient')return()=>({addColorStop(){}});
      if(key==='measureText')return()=>({width:20});
      return()=>{};
    },
    set(target,key,value) {target[key]=value;return true;}
  });
}
let maxSpeed=0,maxTilt=0,movingCases=0;
for(const width of ['tall','wide'])for(const scoops of [1,3,5]){
  const win={};const render=createRenderer(win),ctx=makeCanvas();
  const g={top:66,bottom:400,
    width: width==='wide'?u=>185-62*(1-u):u=>88+60*u,
    level:f=>400-320*f
  };
  let previousY=[],travel=0,ice=[];
  for(let frame=0;frame<850;frame++){
    const pouring=frame<320,fill=Math.min(.76,frame/320*.76);
    render.draw(ctx,{
      g,customerKey:width+':'+scoops,ice:scoops,cherries:2,lime:1,
      pressure:2,pouring,fill,foam:pouring?.05:.015,spillMl:0,
      dt:1/60,time:frame/60,reducedMotion:false,
      soda:{color:'#f49132',light:'#ffd483'},
      drink:{color:'#f49132',light:'#ffd483'}
    });
    ice=win.__iceState();
    assert.equal(ice.length,scoops<=2?scoops*3:6+(scoops-2)*2,'Scoop has expected cubes');
    ice.forEach((cube,i)=>{
      assert(Number.isFinite(cube.angle)&&Number.isFinite(cube.spin)&&Number.isFinite(cube.x)&&Number.isFinite(cube.y));
      maxSpeed=Math.max(maxSpeed,Math.abs(cube.spin));
      maxTilt=Math.max(maxTilt,Math.abs(cube.angle));
      assert(Math.abs(cube.spin)<=.621,'Ice spins too quickly');
      assert(Math.abs(cube.angle)<=.361,'Ice should rock, never rotate around');
      if(cube.entered&&cube.delay<=0){
        const u=Math.max(0,Math.min(1,(g.bottom-cube.y)/(g.bottom-g.top)));
        const half=Math.max(cube.r+2,g.width(u)/2-cube.r-5);
        assert(cube.x>=260-half-.01&&cube.x<=260+half+.01,'Ice escapes the glass');
      }
      if(frame>60&&previousY[i]!==undefined)travel+=Math.abs(cube.y-previousY[i]);
    });
    previousY=ice.map(p=>p.y);
  }
  assert(travel>50,'Ice must still move and bob naturally');
  movingCases++;
}
console.log(JSON.stringify({result:'PASS',checked: movingCases,maxAngularSpeed:Math.round(maxSpeed*1000)/1000,maxTilt:Math.round(maxTilt*1000)/1000,detail:'Full five-scoop float and wall-contact simulation passes with no rapid rotation.'},null,2));
