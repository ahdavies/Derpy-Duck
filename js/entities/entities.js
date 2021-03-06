var BirdEntity = me.ObjectEntity.extend({
    init: function(x, y) {
        var settings = {};
        var rand = Math.floor((Math.random() * 6) + 1);
        if(rand == 1){
            settings.image = me.loader.getImage('alimesbah');
        }
        else if(rand == 2){
            settings.image = me.loader.getImage('clumsy2');
        }
        else if(rand == 3){
            settings.image = me.loader.getImage('clumsy3');
        }
        else if (rand == 4){
            settings.image = me.loader.getImage('clumsy4');
        }
        else if(rand == 5){
            settings.image = me.loader.getImage('clumsy');
        }
        else if(rand == 6){
            settings.image = me.loader.getImage('clumsy5');
        }
        settings.width = 85;
        settings.height = 60;
        settings.spritewidth = 85;
        settings.spriteheight= 60;

        this.parent(x, y, settings);
        this.alwaysUpdate = true;
        this.gravity = 0.2;
        this.gravityForce = 0.01;
        this.maxAngleRotation = Number.prototype.degToRad(30);
        this.maxAngleRotationDown = Number.prototype.degToRad(90);
        this.renderable.addAnimation("flying", [0, 1, 2]);
        this.renderable.addAnimation("idle", [0]);
        this.renderable.setCurrentAnimation("flying");
        this.renderable.anchorPoint = new me.Vector2d(0.2, 0.5);
        this.animationController = 0;
        // manually add a rectangular collision shape
        this.addShape(new me.Rect(new me.Vector2d(5, 5), 70, 50));

        // a tween object for the flying physic effect
        this.flyTween = new me.Tween(this.pos);
        this.flyTween.easing(me.Tween.Easing.Exponential.InOut);

        this.endTween = new me.Tween(this.pos);
        this.flyTween.easing(me.Tween.Easing.Exponential.InOut);
    },

    update: function(dt) {
        // mechanics
        if (!game.data.start) {
            return this.parent(dt);
        }
        if (me.input.isKeyPressed('pause')) {
            game.data.paused = !game.data.paused;
        }
        if (game.data.paused){
            return this.parent(dt);
        }
        if (me.input.isKeyPressed('fly')) {
            me.audio.play('wing');
            this.gravityForce = 0.02;

            var currentPos = this.pos.y;
            // stop the previous one
            this.flyTween.stop();
            this.flyTween.to({y: currentPos - 72}, 100);
            this.flyTween.start();

            this.renderable.angle = -this.maxAngleRotation;
        } else {
            this.gravityForce += 0.2;
            this.pos.y += me.timer.tick * this.gravityForce;
            this.renderable.angle += Number.prototype.degToRad(3) * me.timer.tick;
            if (this.renderable.angle > this.maxAngleRotationDown)
                this.renderable.angle = this.maxAngleRotationDown;
        }

        var res = me.game.world.collide(this);
        var collided = false;

        if (res) {
            if (res.obj.type === 'pipe' || res.obj.type === 'ground') {
                me.device.vibrate(500);
                collided = true;
            }
            // remove the hit box
            if (res.obj.type === 'hit') {
                me.game.world.removeChildNow(res.obj);
                // the give dt parameter to the update function
                // give the time in ms since last frame
                // use it instead ?
                game.data.steps++;
                me.audio.play('hit');
            }

        }
        // var hitGround = me.game.viewport.height - (96 + 60);
        var hitSky = -80; // bird height + 20px
        if (this.pos.y <= hitSky || collided) {
            game.data.start = false;
            me.audio.play("lose");
            this.endAnimation();
            return false;
        }
        return this.parent(dt);
    },

    endAnimation: function() {
        me.game.viewport.fadeOut("#fff", 100);
        var that = this;
        var currentPos = this.pos.y;
        this.flyTween.stop();
        this.renderable.angle = this.maxAngleRotationDown;
        this.endTween
            .to({y: currentPos - 72}, 1500)
            .to({y: me.video.getHeight() - 96 - that.renderable.width}, 500)
            .onComplete(function() {
                me.state.change(me.state.GAME_OVER);
            });
        this.endTween.start();
        return false;
    }

});


var PipeEntity = me.ObjectEntity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('pipe');
        settings.width = 148;
        settings.height= 1664;
        settings.spritewidth = 148;
        settings.spriteheight= 1664;


        this.parent(x, y, settings);
        this.alwaysUpdate = true;
        this.gravity = 5;
        this.updateTime = false;
        this.type = 'pipe';
        this.tempY;
        this.downDirectionFlag;
        if(this.pos.y < 0){
            this.tempY = this.pos.y + 1840; 
        } else{
            this.tempY = this.pos.y;
        }
        console.log(this.tempY);
        if(this.tempY < 325){
            this.downDirectionFlag = true;
        }
        else{
            this.downDirectionFlag = false;
        }
    },

    update: function(dt) {
        // mechanics
    
        if (!game.data.start) {
            return this.parent(dt);
        }
        if (game.data.paused){
            return this.parent(dt);
        }
        if(this.downDirectionFlag){
             this.pos.add(new me.Vector2d(-this.gravity * me.timer.tick, 0.5)); 
        } else{
            this.pos.add(new me.Vector2d(-this.gravity * me.timer.tick, -0.5)); 
        }
        
        
        if (this.pos.x < -148) {
            me.game.world.removeChild(this);
        }
        return this.parent(dt);
    },

});

var PipeGenerator = me.Renderable.extend({
    init: function() {
        this.parent(new me.Vector2d(), me.game.viewport.width, me.game.viewport.height);
        this.alwaysUpdate = true;
        this.generate = 0;
        this.pipeFrequency = 92;
        this.pipeHoleSize = 1240;
        this.posX = me.game.viewport.width;
        this.posY;
    },

    update: function(dt) {
        if (game.data.paused){
            return this.parent(dt);
        }
        if (this.generate++ % this.pipeFrequency == 0) {
            var posY = Number.prototype.random(
                    me.video.getHeight() - 100,
                    200
            );
            var posY2 = posY - me.video.getHeight() - this.pipeHoleSize;
            this.posY = posY2;
            var pipe1 = new me.pool.pull("pipe", this.posX, posY);
            var pipe2 = new me.pool.pull("pipe", this.posX, posY2);
            if(posY < 325){
                var hitPos = posY - 100;
            } else {
                var hitPos = posY - 150;
            }
            var hit = new me.pool.pull("hit", this.posX, hitPos);
            pipe1.renderable.flipY();
            me.game.world.addChild(pipe1, 10);
            me.game.world.addChild(pipe2, 10);
            me.game.world.addChild(hit, 11);
        }
        return true;
    },

});

var HitEntity = me.ObjectEntity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('hit');
        settings.width = 148;
        settings.height= 60;
        settings.spritewidth = 148;
        settings.spriteheight= 60;

        this.parent(x, y, settings);
        this.alwaysUpdate = true;
        this.gravity = 5;
        this.updateTime = false;
        this.type = 'hit';
        this.renderable.alpha = 0;
        this.ac = new me.Vector2d(-this.gravity, 0);
    },

    update: function() {
        if (game.data.paused){
            return;
        }
        // mechanics
        this.pos.add(this.ac);
        if (this.pos.x < -148) {
            me.game.world.removeChild(this);
        }
        return true;
    },

});

var Ground = me.ObjectEntity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('ground');
        settings.width = 900;
        settings.height= 96;

        this.parent(x, y, settings);
        this.alwaysUpdate = true;
        this.gravity = 0;
        this.updateTime = false;
        this.accel = new me.Vector2d(-4, 0);
        this.type = 'ground';
    },

    update: function(dt) {
        // mechanics
        if (!game.data.start) {
            return this.parent(dt);
        }
        if (game.data.paused){
            return this.parent(dt);
        }
        this.pos.add(this.accel);
        if (this.pos.x < -this.renderable.width) {
            this.pos.x = me.video.getWidth() - 10;
        }
        return this.parent(dt);
    },

});