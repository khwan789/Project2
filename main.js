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
    begins: true,
    
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
    
    // Holding all the enemies
    Enemies: [],
    // Holding all the positions where blood slpatter are at
    BloodSpatterPos: [],
    NumEnemies: 4,
    PlayerHealth: 3,
    // spawner cool cd
    SPAWNER_CD: 1,
    countDown: 0,
    
    //images
    bunker: undefined,
    blood: undefined,
    bg: undefined,
    
    //sound
    sound: undefined,
    
    // methods
	init : function(){
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = Game.WIDTH;
		this.canvas.height = Game.HEIGHT;
		this.ctx = this.canvas.getContext('2d');        
        
        this.begins = true;
        
        this.dirX = 0;
        this.dirY = 0;
        
        this.startX = Game.WIDTH/2;
        this.startY = Game.HEIGHT/2;
    
        this.mouseX = 0;
        this.mouseY = 0;
    
        this.fire = false;
        
        this.canvas.onmousemove= this.doMousemove.bind(this);
        this.canvas.onmousedown = this.doMousedown.bind(this);
        
        this.countDown = this.SPAWNER_CD;
        
        for(var i = 0; i<this.NumEnemies; i++ ){
        this.SpawnEenemy(this.ctx);
        }
        
        //images
        this.bunker = new Image;
        this.bunker.src = 'image/bunker.png';
        this.blood = new Image;
        this.blood.src = 'image/blood.png';
        this.bg = new Image;
        this.bg.src = 'image/background.jpg';
        
		// start the game loop
        this.Player.Init(this.bunker, this.PlayerHealth);
		this.update();
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
        this.countDown -= dt;
        if(this.countDown <= 0){
            this.SpawnEenemy(this.ctx);
            this.countDown = this.SPAWNER_CD;
        }
	 	 
	 	// 4) UPDATE
	 	// spawn enemies
		
        //check attack hit on monsters
        
		// 5) DRAW	
		// i) draw background
        this.ctx.drawImage(this.bg,0,0,Game.WIDTH,Game.HEIGHT/2);
        this.ctx.drawImage(this.bg,0,Game.HEIGHT/2,Game.WIDTH,Game.HEIGHT/2);

		// ii) draw bunker and bullet
        //fire method
        if(this.fire){
            this.bullet.Draw(this.startX, this.startY, this.ctx);
            
            // checking for collision between enemies and bullet
             for(var i = 0; i<this.Enemies.length; i++){
                var hit = circlesIntersect(this.bullet,this.Enemies[i]);
                if(hit){
                    // reset bullet
                    this.fire = false;
                    this.startX = Game.WIDTH/2;
                    this.startY = Game.HEIGHT/2;
                    // create blood splatter at enemy position
                    this.CreateBloodSplatter(this.Enemies[i].x,this.Enemies[i].y);
                    // delete enemy
                    this.Enemies.splice(i,1);
                }
            }
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
        this.Player.buildTower(this.ctx, this.dirX, this.dirY);
        this.Player.CheckDead();
        this.DrawBloodSplatter();
        
        // if the game has begun
        if(!this.begins){
            
                for(var i = 0; i<this.Enemies.length; i++ ){
                    // enemies seeking the center
                    this.Enemies[i].SeekCenter(dt);
                    // drawing enemy
                    this.Enemies[i].Draw();
                    // checking for collsion between enemy and player
                    if(circlesIntersect(this.Player,this.Enemies[i])){
                        this.Player.health--;
                        this.Enemies.splice(i,1);
                    }
        }
        }
        
        


        //play sound
        this.sound.playBGAudio();
        
        //draw HUD
        this.ctx.globalAlpha = 1.0;
        this.drawHUD(this.ctx);

	},
    CreateBloodSplatter: function(newX, newY){
        var bloodSplatter = {
            x: newX,
            y: newY,
        };
        // storing blood splatter position
        this.BloodSpatterPos.push(bloodSplatter);
    },
    DrawBloodSplatter: function(){
        for(var i = 0; i<this.BloodSpatterPos.length; i++ ){
            this.ctx.drawImage(this.blood,this.BloodSpatterPos[i].x, this.BloodSpatterPos[i].y, 50,50);
        }
    },
        SpawnEenemy: function(newCtx){
            var enemy = {
                // picking a random position on the screen
                x: (Math.random() * Game.WIDTH),
                y: (Math.random() * Game.HEIGHT),
                radius: 10,
                speed: 0.5,
                ctx: newCtx,
                velocity: {
                    velX: 0,
                    velY: 0,
                },
                SeekCenter: function(dt){
                    // calculating vector between enemy and center
                    this.velocity.velX = (Game.WIDTH/2 - this.x);
                    this.velocity.velY = (Game.HEIGHT/2 - this.y);
                    // normalizing vector
                    var norm = Math.sqrt(this.velocity.velX * this.velocity.velX+this.velocity.velY * this.velocity.velY);
                    // apply speed to vector
                    this.velocity.velX = (this.velocity.velX * this.speed)/ (norm*0.02);
                    this.velocity.velY = (this.velocity.velY * this.speed)/ (norm*0.02);
                    // moving enemy
                    this.x += this.velocity.velX * dt;
                    this.y += this.velocity.velY * dt;
                },
                Draw: function(){
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(this.x, this.y, this.radius,0,Math.PI * 2, false);
                    this.ctx.fill();
                    this.ctx.closePath();
                    this.ctx.restore();
                },
            };
            
            Object.seal(enemy);
            // storing enemy
            this.Enemies.push(enemy);
        },
	
    Player:{
        bunker: undefined,
        health:0,
        x: Game.WIDTH/2-25,
        y: Game.HEIGHT/2-25,
        radius: 30,
        aimRadius: 10,
        dead: false,
        Init(bunkerImg, Phealth){
            this.bunker = bunkerImg;
            this.health = Phealth;
        },
        buildTower: function(ctx, dirX, dirY){        
            // gun
            //ctx.save();
            //ctx.strokeStyle = "skyblue";
            //ctx.lineWidth = 5;
            //ctx.beginPath();
            //ctx.moveTo(Game.WIDTH/2, Game.HEIGHT/2);
            //ctx.lineTo(Game.WIDTH/2 + this.dirX, Game.HEIGHT/2 + this.dirY);
            //ctx.stroke();
            //ctx.restore();
            ctx.drawImage(this.bunker,this.x, this.y, 50,50);
            
            // drawing hit box radius
            ctx.save();
            ctx.strokeStyle = "blue";
            ctx.beginPath();
            ctx.arc(Game.WIDTH/2, Game.HEIGHT/2, this.radius,0,Math.PI * 2, false);
            ctx.closePath();
            ctx.stroke();
            
            //target
            ctx.save();
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.arc(dirX, dirY, this.aimRadius,0,Math.PI * 2, false);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(dirX + this.aimRadius, dirY);
            ctx.lineTo(dirX - this.aimRadius, dirY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(dirX, dirY + this.aimRadius);
            ctx.lineTo(dirX, dirY - this.aimRadius);
            ctx.stroke();
            ctx.restore();
        },
        CheckDead: function(){
            if(this.health <= 0){
                console.log("Deaderino");
                this.dead = true;
            }
        }
    },
   
    
    bullet: {
        x: 0,
        y: 0,
        radius: 5,
        Draw: function(x, y, ctx){
            this.x = x;
            this.y = y;
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI *2, false);
            ctx.closePath();
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.restore();
        },
    },
    
    doMousemove: function(e){
        var mouse = getMouse(e);
        
        //console.log("clicked");
        
        this.dirX = mouse.x;
        this.dirY = mouse.y;
    },
    
    doMousedown: function(e){
//http://stackoverflow.com/questions/23117776/find-tangent-between-point-and-circle-canvas
            this.begins = false;
            this.fire = true;
            this.sound.fireEffect();
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
	
    drawHUD: function(ctx){
        ctx.save();
        
        //game begins
        if(this.begins){
            
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "black";
            ctx.rect(0,0,Game.WIDTH,Game.HEIGHT);
            ctx.fill();
            ctx.restore();
            
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this.fillText(ctx, "Shoot the zombies", Game.WIDTH/2, Game.HEIGHT/2 - 45, "30pt bold courier", "lightgray");
            this.fillText(ctx, "**Only one bullet available at a time", Game.WIDTH/2, Game.HEIGHT/2, "30pt bold courier", "lightgray");  
            this.fillText(ctx, "Click to continue", Game.WIDTH/2, Game.HEIGHT/2 + 40, "25pt bold courer", "lightgray");
        }
        else{
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this.fillText(ctx, "Health: " + this.Player.health, 70, 20, "20pt bold courier", "lightgray");
            //this.fillText(ctx, this.Player.health, Game.WIDTH/2, Game.HEIGHT/2, "30pt bold courier", "lightgray");  
        }
        ctx.restore();
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
        
        this.sound.stopBGAudio();
        
        //call update() once so pause screen gets drawn
        this.update();
    },
    
    resumeGame: function(){
        //stop the animation, just in case
        cancelAnimationFrame(this.animationID);
        
        this.paused = false;
        
        this.sound.playBGAudio();
        
        //restart loop
        this.update();
    },
    
    
}; // end app.main
