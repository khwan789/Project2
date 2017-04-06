// main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

'use strict';

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
var Game = Object.freeze({
	   //  constants
        WIDTH : 640,
        HEIGHT: 480
});

app.main = {
    //properties
    canvas: undefined,
    ctx: undefined,
    lastTime: 0, // used by calculateDeltaTime() 
    debug: true,

    dirX: 0,
    dirY: 0,
    
    // methods
	init : function(){
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = Game.WIDTH;
		this.canvas.height = Game.HEIGHT;
		this.ctx = this.canvas.getContext('2d');        
        
        this.dirX = 50;
        this.dirY = 0;
        
        this.canvas.onmousemove= this.doMousemove.bind(this);
        
        
		// start the game loop
		this.update();
	},
	
    //next stage
    reset: function(){

    },
    
	update: function(){
		// 1) LOOP
		// schedule a call to update()
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
	 	
	 	// 2) PAUSED?
	 	// if so, bail out of loop
		if(this.paused){
            this.drawPauseScreen(this.ctx);
            return;
        }
        

	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
	 	 
	 	// 4) UPDATE
	 	// spawn enemies
		
        //check attack hit on monsters
        
		// 5) DRAW	
		// i) draw background
		this.ctx.fillStyle = "grey"; 
		this.ctx.fillRect(0,0, Game.WIDTH,Game.HEIGHT); 
	
		// ii) draw tower and arrow
        this.buildTower(this.ctx);
        
		// iii) draw HUD

		// iv) draw debug info

        // 6) CHEATS
        //if on start screen or round over screen

	},
	
    buildTower: function(ctx){        
        // gun
        ctx.strokeStyle = "skyblue";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(Game.WIDTH/2, Game.HEIGHT/2);
        ctx.lineTo(Game.WIDTH/2 + this.dirX, Game.HEIGHT/2 + this.dirY);
        ctx.stroke();
        
        // bunker
        ctx.save();
        ctx.fillStyle = "skyblue";
        ctx.beginPath();
        ctx.arc(Game.WIDTH/2, Game.HEIGHT/2, 20, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },
    
    fire: function(ctx, mouse){
        
    },
    
    doMousemove: function(e){        
        var rect = this.canvas.getBoundingClientRect();
        
        //console.log("clicked");
        
        this.dirX = e.clientX - rect.left//this.canvas.offsetLeft;
        this.dirY = e.clientY - rect.top//this.canvas.offsetTop;
    },
    
	fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
	
	calculateDeltaTime: function(){
		var now,fps;
		now = performance.now(); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
	
	drawPauseScreen: function(ctx){
		ctx.save();
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,Game.WIDTH,Game.HEIGHT);
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		this.fillText(ctx, "... PAUSED ...", Game.WIDTH/2, Game.HEIGHT/2, "40pt courier", "white");
		ctx.restore();
	},
    
    pauseGame: function(){
        this.paused = true;
        
        //stop animation loop
        cancelAnimationFrame(this.animationID);
        
        //this.stopBGAudio();
        
        //call update() once so pause screen gets drawn
        this.update();
    },
    
    resumeGame: function(){
        //stop the animation, just in case
        cancelAnimationFrame(this.animationID);
        
        this.paused = false;
        
        //this.sound.playBGAudio();
        
        //restart loop
        this.update();
    },
    
    
}; // end app.main