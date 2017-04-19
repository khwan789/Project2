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

// key object to help check keyboard input
var Key = {
    _pressed: {},
    // looked up all these keycodes...
    ENTER: 13,
    LEFT_SHIFT: 16,
    SPACE: 32,
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    W: 87,
    S: 83,
    A: 65,
    D: 68,
    Q: 81,
    E: 69,
    
    // checks in the array if the key is being pressed
    isDown: function(key){
     return this._pressed[key];   
    },
    // pushes key to the array
    onKeyDown: function(event){
        this._pressed[event.keyCode] = true;
    },
    // takes key out of array
    onKeyUp: function(event){
        delete this._pressed[event.keyCode];
    }
};
window.addEventListener('keydown', function(event){ Key.onKeyDown(event); },false);
window.addEventListener('keyup', function(event){ Key.onKeyUp(event); },false);

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
    dirX: 0,
    dirY: 0,
    //bullet start position
    startX: Game.WIDTH/2,
    startY: Game.HEIGHT/2,
    //bullet fire direction
    mouseX: 0,
    mouseY: 0,
    
    // level properties
    level: 1,
    previousLevel: undefined,
    showLevel: false,
    SHOWLEVEL_CD: 3,
    showLevelCD: 0,
    
    // shooting properties
    fire: false,
    SHOOTING_CD: 0.3,
    shootingCD: 0,
    
    animationID: 0,
    showBoundingCircle: false,
    
    // Holding all the enemies
    Enemies: [],
    // Holding all the positions where blood slpatter are at
    BloodSpatterPos: [],
    // Holding all bullets in the scene
    Bullets: [],
    
    // starting number of enemies
    NumEnemies: 4,
    // players starter health
    PlayerHealth: 3,
    
    // spawner cool cd
    SPAWNER_CD: 0.7,
    countDown: 0,
    
    //images
    bunker: undefined,
    blood: undefined,
    bg: undefined,
    zombie: undefined,
    
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
        
        //images
        this.bunker = new Image;
        this.bunker.src = 'image/player.png';
        this.blood = new Image;
        this.blood.src = 'image/blood.png';
        this.bg = new Image;
        this.bg.src = 'image/background.jpg';
        this.zombie = new Image;
        this.zombie.src = 'image/zombie.png';
        
        for(var i = 0; i<this.NumEnemies; i++ ){
        this.SpawnEenemy(this.ctx, this.zombie);
        }
        
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
        // checking to display new stage level
        this.UpdateStage();
        if(this.level != this.previousLevel && !this.begins){
            this.showLevel = true;
            this.showLevelCD = this.SHOWLEVEL_CD;
            this.previousLevel = this.level;
        }
        // 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
        
        // if player is dead, press enter to reset game
        if(this.Player.dead){
            if(Key.isDown(Key.ENTER)){
                this.ResetGame();
            }
        }
        else if(!this.begins){
            this.Player.Update(dt); 
        }
        
        
        // running cool down for spawning enemies
        this.countDown -= dt;
        if(this.countDown <= 0 && !this.begins){
            this.SpawnEenemy(this.ctx, this.zombie);
            this.countDown = this.SPAWNER_CD;
        }
        // running cool down for shooting
        if(this.shootingCD > 0){
            this.shootingCD -= dt;
            if(this.shootingCD <= 0){
                this.fire = false;
            }
        }
        // running cool down for showing stage level
        if(this.showLevelCD > 0){
            this.showLevelCD -= dt;
            if(this.showLevelCD <= 0){
                this.showLevel = false;
            }
        }
	 	 
	 	// 4) UPDATE
	 	// spawn enemies
		
        //check attack hit on monsters
        
		// 5) DRAW	
		// i) draw background
        this.ctx.drawImage(this.bg,0,0,Game.WIDTH,Game.HEIGHT/2);
        this.ctx.drawImage(this.bg,0,Game.HEIGHT/2,Game.WIDTH,Game.HEIGHT/2);

		// ii) draw bunker and bullet
        
        // draw blood splatter
        this.DrawBloodSplatter();
        // draw player
        this.Player.buildTower(this.ctx, this.dirX, this.dirY, this.showBoundingCircle);
        // checking if player died
        this.Player.CheckDead();
        
        //fire method
        for(var i = 0; i<this.Bullets.length; i++){
        //moving and drawing bullet
        this.Bullets[i].Draw();
                
        // checking for collision between enemies and bullets in the scene
            for(var j = 0; j<this.Enemies.length; j++){
            var hit = circlesCenterIntersect(this.Bullets[i],this.Enemies[j]);
            if(hit){
                // create blood splatter at enemy position
                this.CreateBloodSplatter(this.Enemies[j].x,this.Enemies[j].y);
                // delete enemy and bullet
                this.Bullets.splice(i,1);
                this.Enemies.splice(j,1);
                // player gains a kill
                this.Player.kills++;
                break;
                }
            }
            // this check is need in case one bullet was shot and hit something, need to leave loop
            if(this.Bullets.length <= 0){
               break; 
            }
            // checking is bullet still exist
            if(this.Bullets[i] != undefined){
                // checking if bullet hit the canvas bounds
               if(this.Bullets[i].x < 0 && this.Bullets[i].x >= Game.WIDTH && this.Bullets[i].y < 0 && this.Bullets[i].y >= Game.HEIGHT)
                {
                    // delete bullet
                    this.Bullets.splice(i,1);
                } 
            }
        }
        // if the game has begun
        if(!this.begins){
                for(var i = 0; i<this.Enemies.length; i++ ){
                    // enemies seeking the player
                    this.Enemies[i].SeekPlayer(this.Player.cx, this.Player.cy,dt);
                    // drawing enemy
                    this.Enemies[i].Draw(this.showBoundingCircle);
                    // checking for collsion between enemy and player
                    if(circlesCenterIntersect(this.Player,this.Enemies[i])){
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
        // storing positions of the blood splatter
        var bloodSplatter = {
            x: newX,
            y: newY,
        };
        // storing blood splatter position
        this.BloodSpatterPos.push(bloodSplatter);
    },
    DrawBloodSplatter: function(){
        // drawing all existing blood splatter
        for(var i = 0; i<this.BloodSpatterPos.length; i++ ){
            this.ctx.drawImage(this.blood,this.BloodSpatterPos[i].x, this.BloodSpatterPos[i].y, 100,100);
        }
    },
        SpawnEenemy: function(newCtx, zom){
            var enemy = {
                // picking a random position on the screen
                x: (Math.random() * Game.WIDTH),
                y: (Math.random() * Game.HEIGHT),             
                radius: 20,
                // size of the enemy
                size: 30,
                // getting the center point of the enemy
                cx: this.x+ this.size/2,
                cy: this.y+ this.size/2,
                speed: 0.5,
                ctx: newCtx,
                // storing texture
                zombie: zom,
                velocity: {
                    velX: 0,
                    velY: 0,
                },
                SeekPlayer: function(pX, pY, dt){
                    // calculating vector between enemy and center
                    this.velocity.velX = (pX - this.x);
                    this.velocity.velY = (pY - this.y);
                    // normalizing vector
                    var norm = Math.sqrt(this.velocity.velX * this.velocity.velX+this.velocity.velY * this.velocity.velY);
                    // apply speed to vector
                    this.velocity.velX = (this.velocity.velX * this.speed)/ (norm*0.02);
                    this.velocity.velY = (this.velocity.velY * this.speed)/ (norm*0.02);
                    // moving enemy
                    this.x += this.velocity.velX * dt;
                    this.y += this.velocity.velY * dt;
                    // updating center
                    this.cx = this.x+ this.size/2;
                    this.cy = this.y+ this.size/2;
                },
                Draw: function(show){
                    this.ctx.drawImage(this.zombie,this.x, this.y, this.size, this.size);
                    if(show){
                        this.ctx.save();
                        this.ctx.beginPath();
                        this.ctx.arc(this.cx, this.cy, this.radius,0,Math.PI * 2, false);
                        this.ctx.stroke();
                        this.ctx.closePath();
                        this.ctx.restore();
                    }
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
        radius: 25,
        size: 40,
        cx: this.x+ this.size/2,
        cy: this.y+ this.size/2,
        speed: 200,
        aimRadius: 10,
        kills: 0,
        dead: false,
        Init(bunkerImg, Phealth){
            this.bunker = bunkerImg;
            this.health = Phealth;
            this.dead = false;
            this.kills = 0;
        },
        Update: function(dt){
            if(Key.isDown(Key.UP) || Key.isDown(Key.W)){
                this.MoveUp(dt);
            }
            if(Key.isDown(Key.DOWN) || Key.isDown(Key.S)){
                this.MoveDown(dt);
            }
            if(Key.isDown(Key.LEFT) || Key.isDown(Key.A)){
                this.MoveLeft(dt);
            }
            if(Key.isDown(Key.RIGHT) || Key.isDown(Key.D)){
                this.MoveRight(dt);
            }
            this.cx = this.x + this.size/2;
            this.cy = this.y + this.size/2;
        },
        MoveUp: function(dt){
            //console.log("Up");
            //checking bounds
            if(this.cy > 0)
                {
                    this.y -= this.speed * dt;
                }
        },
        MoveDown: function(dt){
            //console.log("Down");
            //checking bounds
            if(this.cy <= Game.HEIGHT)
                {
                    this.y += this.speed * dt;
                }
        },
        MoveLeft: function(dt){
            //console.log("Left");
            //checking bounds
            if(this.cx > 0)
                {
                    this.x -= this.speed * dt;
                }
        },
        MoveRight: function(dt){
            //console.log("Right");
            //checking bounds
            if(this.cx <= Game.WIDTH)
                {
                    this.x += this.speed * dt;
                }
        },
        buildTower: function(ctx, dirX, dirY, show){        
            // gun
            //ctx.save();
            //ctx.strokeStyle = "skyblue";
            //ctx.lineWidth = 5;
            //ctx.beginPath();
            //ctx.moveTo(Game.WIDTH/2, Game.HEIGHT/2);
            //ctx.lineTo(Game.WIDTH/2 + this.dirX, Game.HEIGHT/2 + this.dirY);
            //ctx.stroke();
            //ctx.restore();
            ctx.drawImage(this.bunker,this.x, this.y, this.size,this.size);
            
            // drawing hit box radius
            if(show){
                ctx.save();
                ctx.strokeStyle = "blue";
                ctx.beginPath();
                ctx.arc(this.cx, this.cy, this.radius,0,Math.PI * 2, false);
                ctx.closePath();
                ctx.stroke();
            }
            
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
   
   Shoot: function(vx, vy, newctx){
       var bullet = {
        x: this.Player.x,
        y: this.Player.y,
        radius: 5,
        speed: 3,
        cx: this.x + this.radius/2,
        cy: this.y + this.radius/2,
        ctx: newctx,
        velocity: {
                velX: vx,
                velY: vy,
        },
        Move: function(){
            this.x += this.velocity.velX * this.speed; //* dt;
            this.y += this.velocity.velY * this.speed; //* dt;
            this.cx = this.x + this.radius;
            this.cy = this.y + this.radius;
        },
        Draw: function(){
            this.Move();
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI *2, false);
            this.ctx.closePath();
            this.ctx.fillStyle = "black";
            this.ctx.fill();
            this.ctx.restore();
        },
            
    };
           this.Bullets.push(bullet);
   }, 
    ResetGame: function(){
        // clearing all arrays
        this.Bullets = [];
        this.Enemies = [];
        this.BloodSpatterPos = [];
        
        this.dirX = 0;
        this.dirY = 0;
        
        this.startX = Game.WIDTH/2;
        this.startY = Game.HEIGHT/2;
    
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.level = 1;
        this.SPAWNER_CD = 0.7;
    
        this.fire = false;
        
        this.countDown = this.SPAWNER_CD;
        
        for(var i = 0; i<this.NumEnemies; i++ ){
        this.SpawnEenemy(this.ctx, this.zombie);
        }
        
		// start the game loop
        this.Player.Init(this.bunker, this.PlayerHealth);
    },
    UpdateStage: function(){
        // if the player gets a certain ammount of kills update level
      if(this.Player.kills >= 5 * (this.level+(this.level * 0.5))){
            this.level++;
            this.SPAWNER_CD -= 0.03;
      }  
    },
   
    
    doMousemove: function(e){
        var mouse = getMouse(e);
        
        //console.log("clicked");
        
        this.dirX = mouse.x;
        this.dirY = mouse.y;
    },
    
    doMousedown: function(e){
//http://stackoverflow.com/questions/23117776/find-tangent-between-point-and-circle-canvas
        if(!this.fire && !this.Player.dead){
            this.begins = false;
            this.fire = true;
            this.shootingCD = this.SHOOTING_CD;
            this.sound.fireEffect();
            var mouse = getMouse(e);
            
            var distance = {
                x: this.Player.x - mouse.x,
                y: this.Player.y  - mouse.y, 
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
            this.Shoot(this.mouseX, this.mouseY, this.ctx);
        }

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
            this.fillText(ctx, "**Survive rounds as long as you can", Game.WIDTH/2, Game.HEIGHT/2, "30pt bold courier", "lightgray"); 
            this.fillText(ctx, "*Move: W,A,S,D || Shoot: Left Mouse Click", Game.WIDTH/2, Game.HEIGHT/2 + 40, "15pt bold courer", "lightgray");
            this.fillText(ctx, "Click to continue", Game.WIDTH/2, Game.HEIGHT/2 + 80, "25pt bold courer", "white");
        }
        else if(this.Player.health <= 0){            
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "black";
            ctx.rect(0,0,Game.WIDTH,Game.HEIGHT);
            ctx.fill();
            ctx.restore();
            
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this.fillText(ctx, "Health: " + this.Player.health, 70, Game.HEIGHT - 20, "20pt bold courier", "black");
            this.fillText(ctx, "Kills: " + this.Player.kills, Game.WIDTH - 70, Game.HEIGHT - 20, "20pt bold courier", "black");
            this.fillText(ctx, "You are dead", Game.WIDTH/2, Game.HEIGHT/2 - 45, "30pt bold courier", "lightgray");
            if(this.level == 1){
                this.fillText(ctx, "You survivied " + this.level + " round", Game.WIDTH/2, Game.HEIGHT/2, "30pt bold courier", "lightgray");
            }
            else{
                this.fillText(ctx, "You survivied " + this.level + " rounds", Game.WIDTH/2, Game.HEIGHT/2, "30pt bold courier", "lightgray");
            }
            this.fillText(ctx, "**Press ENTER to play again", Game.WIDTH/2, Game.HEIGHT/2+45, "30pt bold courier", "lightgray");  
            //this.fillText(ctx, "Click to continue", Game.WIDTH/2, Game.HEIGHT/2 + 40, "25pt bold courer", "lightgray");
        }
        else{
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this.fillText(ctx, "Health: " + this.Player.health, 70, Game.HEIGHT - 20, "20pt bold courier", "black");
            this.fillText(ctx, "Kills: " + this.Player.kills, Game.WIDTH - 70, Game.HEIGHT - 20, "20pt bold courier", "black");
            if(this.showLevel){
                this.fillText(ctx, "LEVEL " + this.level, Game.WIDTH/2, Game.HEIGHT/2, "30pt bold courier", "red");  
            }
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

