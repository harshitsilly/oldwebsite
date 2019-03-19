import * as tf from '@tensorflow/tfjs';
import yolo, { downloadModel } from 'tfjs-yolo-tiny';
//  <img id="testImg" src="670.jpg" alt="test">

import { Webcam } from './webcam';
// import { url } from 'inspector';

let model;
let lpRead_model;
const webcam = new Webcam(document.getElementById('webcam'));
const imageSize = [700,700];

const alphabet87 = "abcdefghijklmnopqrstuvwxyz" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "0123456789" + ' +-*.,:!?%&$~/()[]<>"\'@#_';
function decode(chars){
    let blank_char = '_';
    let snew = '';
    let last = blank_char;
    for (let index = 0; index < chars.length; index++) {
      const c = chars[index];
      if ((last == blank_char || last != c) && c != blank_char){
        snew += c
      last = c
    }

    }
    
    
   
    return snew;

}
(async function main() {
  try {
    ga(); 
    const MODEL_PATH = window.location.origin + '/api/yololite/tensorflowjs_model.pb';
    const WEIGHTS_PATH = window.location.origin  + '/api/yololite/weights_manifest.json';
    const lpRead_MODEL_PATH = window.location.origin  + '/api/crnn/model.json';
    model = await downloadModel(MODEL_PATH,WEIGHTS_PATH);
    // model = await downloadModel();
    lpRead_model = await tf.loadModel(lpRead_MODEL_PATH)
    alert("Just a heads up! We'll ask to access your webcam so that we can " +
      "detect objects in semi-real-time. \n\nDon't worry, we aren't sending " +
      "any of your images to a remote server, all the ML is being done " +
      "locally on device, and you can check out our source code on Github.");

    await webcam.setup();

    doneLoading();
    run();
    // testCodeCrnn()
  } catch(e) {
    console.error(e);
    showError(); 
  }
})();

async function testCodeCrnn() {
  let testImage = document.getElementById('testImg');
testImage = tf.fromPixels(testImage,1);
let smalImg = tf.image.resizeBilinear(testImage, [32,256]);

var x = document.createElement("CANVAS");
document.getElementById("content").appendChild(x);
tf.toPixels(smalImg,x).then((data)=>{
 

  // window.appendChild(x);
});
smalImg = smalImg.transpose();
let final_image = smalImg.expandDims(3);
  let lpValue = await lpRead_model.predict(final_image);
    let output = await lpValue.array();
    let chars = "";
    output[0].forEach((i) => {
      chars = chars + alphabet87[i.indexOf(Math.max(...i))];
    });
    let reschars = decode(chars);
    console.log(reschars,chars);
}

async function run() {
  while (true) {
    
    
    const [inputImage,inputImageShape] = webcam.capture();

    const t0 = performance.now();
    
    const boxes = await yolo(inputImage, model);
    
    const t1 = performance.now();
    console.log("YOLO inference took " + (t1 - t0) + " milliseconds.");
    // webcamElem.appendChild(rect);
    clearRects();
    console.log(JSON.stringify(boxes)); 
    boxes.forEach(async box => {
      const {
        top, left, bottom, right, classProb, className,
      } = box;
      // webcam.cropDetected(box);
      // let lpValue =  tf.tidy(async () => {
      //   return await lpRead_model.predict(webcam.cropDetected(inputImage,box));
      // });
      let lpValue = await lpRead_model.predict(webcam.cropDetected(box));

      let output = await lpValue.array();
      let chars = "";
      output[0].forEach((i) => {
        chars = chars + alphabet87[i.indexOf(Math.max(...i))];
      });
      // let reschars =""
      let reschars = decode(chars);
    
     

      console.log(output);
      console.log(chars);
  
  
      console.log(JSON.stringify(box)); 
      
      drawRect(left, top, right-left, bottom-top,
        `${className} Confidence: ${Math.round(classProb * 100)}% ${reschars}`,inputImageShape)
    });
    setTimeout(() => {
     
    }, 10);
    await tf.nextFrame();
  }
}

const webcamElem = document.getElementById('webcam-wrapper');

function drawRect(x, y, w, h, text = '',imgShape, color = 'red') {
  let [webcamElemWidth,webcamElemHeight] = imageSize;
  let [frameWidth,frameHeight] = imgShape;
  let imageContainerWidthOffset = 0;
  let imageContainerHeightOffset = 0;
//   if(webcamElemWidth !== frameWidth){
//     imageContainerWidthOffset =  frameWidth - webcamElemWidth;
// }
// if(webcamElemHeight !== frameHeight){
//     imageContainerHeightOffset =  frameHeight - webcamElemHeight;
// }
console.log(imageContainerWidthOffset,imageContainerHeightOffset);
  x =  x * (webcamElemWidth + (imageContainerWidthOffset/2))/224;
  y= y *  (webcamElemHeight+ (imageContainerHeightOffset/2))/224 ;
  w=  w *  (webcamElemWidth + (imageContainerWidthOffset/2))/224;
  h=   h *  (webcamElemHeight+ (imageContainerHeightOffset/2))/224 ;
  const rect = document.createElement('div');
  rect.classList.add('rect');
  rect.style.cssText = `top: ${y}px; left: ${x}px; width: ${w}px; height: ${h}px; border-color: ${color}`;

  const label = document.createElement('div');
  label.classList.add('label');
  label.innerText = text;
  rect.appendChild(label);

  webcamElem.appendChild(rect);
}

function clearRects() {
  const rects = document.getElementsByClassName('rect');
  while(rects[0]) {
    rects[0].parentNode.removeChild(rects[0]);
  }
}

function doneLoading() {

  const webcamElem = document.getElementById('webcam-wrapper');
  webcamElem.style.display = 'flex';
}

function showError() {
  doneLoading();
}

function ga() {
  if (process.env.UA) {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', process.env.UA);
  }
}
