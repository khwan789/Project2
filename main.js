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

    //mouse position
    dirX:0,
    dirY:0,
    //bullet start position
    startX: Game.WIDTH/2,
    startY: Game.HEIGHT/2,
    //bullet fire direction
    mouseX: 0,
    mouseY: 0,
    
    fire: false,
    
    animationID: 0,
    
    // methods
	init : function(){
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = Game.WIDTH;
		this.canvas.height = Game.HEIGHT;
		this.ctx = this.canvas.getContext('2d');        
        
        this.dirX = 0;
        this.dirY = 0;
        
        this.startX = Game.WIDTH/2;
        this.startY = Game.HEIGHT/2;
    
        this.mouseX = 0;
        this.mouseY = 0;
    
        this.fire = false;
        
        this.canvas.onmousemove= this.doMousemove.bind(this);
        this.canvas.onmousedown = this.doMousedown.bind(this);
            
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
	
		// ii) draw bunker and bullet
        //fire method
        if(this.fire){
            this.bullet(this.startX, this.startY);
        }
        if(this.fire && this.startX > 0 && this.startX <= Game.WIDTH && this.startY > 0 && this.startY <= Game.HEIGHT){
            this.startX += this.mouseX; //* dt;
            this.startY += this.mouseY; //* dt;
        }
        else{
            this.fire = false;
            this.startX = Game.WIDTH/2;
            this.startY = Game.HEIGHT/2;
        }
        
        //draw bunker
        this.buildTower(this.ctx);

		// iii) draw HUD

		// iv) draw debug info

        // 6) CHEATS
        //if on start screen or round over screen

	},
	
    buildTower: function(ctx){        
        // gun
        //ctx.save();
        //ctx.strokeStyle = "skyblue";
        //ctx.lineWidth = 5;
        //ctx.beginPath();
        //ctx.moveTo(Game.WIDTH/2, Game.HEIGHT/2);
        //ctx.lineTo(Game.WIDTH/2 + this.dirX, Game.HEIGHT/2 + this.dirY);
        //ctx.stroke();
        //ctx.restore();
        
        // bunker
        ctx.save();
        ctx.fillStyle = "skyblue";
        ctx.beginPath();
        ctx.arc(Game.WIDTH/2, Game.HEIGHT/2, 20, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        //target
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.arc(this.dirX, this.dirY, 10,0,Math.PI * 2, false);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.dirX + 10, this.dirY);
        ctx.lineTo(this.dirX - 10, this.dirY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.dirX, this.dirY + 10);
        ctx.lineTo(this.dirX, this.dirY - 10);
        ctx.stroke();
        ctx.restore();
        
        
    },
    
    bullet: function(x, y){
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI *2, false);
        this.ctx.closePath();
        this.ctx.fillStyle = "black";
        this.ctx.fill();
        this.ctx.restore();
    },
    
    doMousemove: function(e){
        var mouse = getMouse(e);
        
        //console.log("clicked");
        
        this.dirX = mouse.x;
        this.dirY = mouse.y;
    },
    
    doMousedown: function(e){
            this.fire = true;
            
            var mouse = getMouse(e);
            
            var distance = {
                x: (Game.WIDTH/2) - mouse.x,
                y: (Game.HEIGHT/2) - mouse.y, 
                length: function(){
                    return Math.sqrt(this.x * this.x + this.y * this.y);
                }
            }
        
            var a = Math.acos(2/distance.length());
            var b = Math.atan2(distance.y, distance.x);
            var t = b-a;
            
            var Tan = {
                x: 5 * Math.sin(t),
                y: 5 * -Math.cos(t)
            }
            
            this.mouseX = Tan.x;
            this.mouseY = Tan.y;
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
