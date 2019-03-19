/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/**
 * This file is originally from:
 * https://github.com/tensorflow/tfjs-examples/blob/master/webcam-transfer-learning/webcam.js
 * The following modifications were made to the original file:
 * - `setup` has been changed to work for Safari, changes sourced from:
 *    https://github.com/google/emoji-scavenger-hunt/blob/master/src/js/camera.ts#L43-L56
 * - `capture` has been changed to just divide by 255 instead of
 *    divide by 127 and subtract 1.
 * Just run `diff` tbh, yuno MIT license.
 */

import * as tf from '@tensorflow/tfjs';
require("babel-core/register");
require("babel-polyfill");

const imageSize = [700,700];

/**
 * A class that wraps webcam video elements to capture Tensor4Ds.
 */
export class Webcam {
    /**
     * @param {HTMLVideoElement} webcamElement A HTMLVideoElement representing the webcam feed.
     */
    constructor(webcamElement) {
        this.webcamElement = webcamElement;
    }

    /**
     * Captures a frame from the webcam and normalizes it between -1 and 1.
     * Returns a batched image (1-element batch) of shape [1, w, h, c].
     */
    capture() {
        return tf.tidy(() => {
            // Reads the image as a Tensor from the webcam <video> element.
            const webcamImage = tf.fromPixels(this.webcamElement);
            
            // Crop the image so we're using the center square of the rectangular
            // webcam.
            const croppedImage = this.cropImage(webcamImage);

            // Expand the outer most dimension so we have a batch size of 1.
            const smalImg = tf.image.resizeBilinear(croppedImage, [224, 224]);

            const batchedImage = smalImg.expandDims(0);
           
            // Normalize the image between -1 and 1. The image comes in between 0-255,
            // so we divide by 127 and subtract 1
            console.log(this.webcamElement);
            return [batchedImage.toFloat().div(tf.scalar(255)),webcamImage.shape];
        });
    }

    /**
     * Crops an image tensor so we get a square image with no white space.
     * @param {Tensor4D} img An input image Tensor to crop.
     */
    cropImage(img) {
        const size = Math.min(img.shape[0], img.shape[1]);
        const centerHeight = img.shape[0] / 2;
        const beginHeight = centerHeight - (size / 2);
        const centerWidth = img.shape[1] / 2;
        const beginWidth = centerWidth - (size / 2);
        this.slicedImage = img.slice([0, 0, 0], [700, 700, 3]);
        return this.slicedImage;
        // let imageContainerHeightOffset = 0;
        // let imageContainerWidthOffset = 0;
        // if(imageSize[0] !== img.shape[0]){
        //      imageContainerWidthOffset = img.shape[0] - imageSize[0];
        // }
        // if(imageSize[1] !== img.shape[1]){
        //      imageContainerHeightOffset = img.shape[1] - imageSize[1];
        // }
        // console.log(imageSize,img.shape);
        // const beginHeight =  parseInt(imageContainerHeightOffset / 2);
        // const endHeight = parseInt(img.shape[1] - (imageContainerHeightOffset / 2));
        // const beginWidth =  parseInt(imageContainerWidthOffset / 2);
        // const endWidth = parseInt(img.shape[0] - (imageContainerWidthOffset / 2));
        // console.log(beginHeight,endHeight,beginWidth,endWidth);
        // let  smalImg= img.slice([beginWidth, beginHeight, 0], [endWidth, endHeight, 3]);
        // // var x = document.createElement("CANVAS");
        // // document.getElementById("content").appendChild(x);
        // // tf.toPixels(smalImg, x).then(function (data) {// window.appendChild(x);
             
        // // });
        // return smalImg;
    }
    cropDetected(box){
        let img = tf.fromPixels(this.webcamElement,1);
        let {
            top, left, bottom, right, classProb, className,
          } = box;
          top =  top * (700/224);
          left= left *  (700/224) ; 
          bottom=  bottom *  (700/224);
          right=   right * (700/224);
        let width = parseInt(right-left);
        let height = parseInt(bottom-top);
        img = img.slice([parseInt(top), parseInt(left), 0], [parseInt(height),parseInt(width), 1]);
        let smalImg = tf.image.resizeBilinear(img, [32,256]);
        // for testing purpose
        // var x = document.createElement("CANVAS");
        // document.getElementById("content").appendChild(x);
        // tf.toPixels(smalImg,x).then((data)=>{
         
        
        //   // window.appendChild(x);
        // });
        smalImg = smalImg.transpose();
        let final_image = smalImg.expandDims(3);
        return final_image;
        // const batchedImage = smalImg.expandDims(0);
       
        // Normalize the image between -1 and 1. The image comes in between 0-255,
        // so we divide by 127 and subtract 1
        // return smalImg.toFloat().div(tf.scalar(255));
    }
    /**
     * Adjusts the video size so we can make a centered square crop without
     * including whitespace.
     * @param {number} width The real width of the video element.
     * @param {number} height The real height of the video element.
     */
    adjustVideoSize(width, height) {
        const aspectRatio = width / height;
        if (width >= height) {
            this.webcamElement.width = aspectRatio * this.webcamElement.height;
        } else if (width < height) {
            this.webcamElement.height = this.webcamElement.width / aspectRatio;
        }
    }

    async setup() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
                'audio': false,
                'video': { facingMode: 'environment' }
            });
            window.stream = stream;
            this.webcamElement.srcObject = stream;
            return new Promise(resolve => {
                this.webcamElement.onloadedmetadata = () => {
                    this.adjustVideoSize(
                        this.webcamElement.videoWidth,
                        this.webcamElement.videoHeight);
                    resolve();
                };
            });
        } else {
            throw new Error('No webcam found!');
        }
    }
}