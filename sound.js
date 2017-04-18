// sound.js
"use strict";
// if app exists use the existing copy
// else create a new object literal
var app = app || {};

// define the .sound module and immediately invoke it in an IIFE

//bg - http://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100005&Search=Search ("Zombie Chase")
//fire - http://soundbible.com/1780-Bow-Fire-Arrow.html ("bow fire arrow sound")

app.sound = (function(){
	console.log("sound.js module loaded");
	var bgAudio = undefined;
	var fireAudio = undefined;
	var currentEffect = 0;
	var currentDirection = 1;

	

	function init(){
		bgAudio = document.querySelector("#bgAudio");
		bgAudio.volume=0.5;
		fireAudio = document.querySelector("#fireAudio");
		fireAudio.volume = 0.3;
	}
		
	function stopBGAudio(){
		bgAudio.pause();
		bgAudio.currentTime = 0;
	}
	
	function fireEffect(){
		fireAudio.play();
	}
		
    function playBGAudio(){
        bgAudio.play();
    }
    
	// export a public interface to this module
	
    return{
        init: init,
        stopBGAudio: stopBGAudio,
        fireEffect: fireEffect,
        playBGAudio: playBGAudio,
    };
    
}());