// BASE OBJECTS DOCUMENT
////////////////////////////////////////////////////////////////////////////////
// displayable PARENT (objects that do not collide with anything, eg foreground)
////////////////////////////////////////////////////////////////////////////////

function Display(x, y, width, height) {
    this.sprite = null; //related image
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.depth = 0; //TODO: implement
    this.on_screen = true;
    this.obj = 'display';
    this.draw = function () {
        c.fillStyle = "white";
        c.fillRect(this.x, this.y, this.width, this.height);
    };
    this.update = function (b, keys) {
    };
}

function checkOnScreen(o, s) {
    var rect1 = {
        x: s.x - screen_bound,
        y: s.y - screen_bound,
        width: s.width + screen_bound * 2,
        height: s.height + screen_bound * 2
    };
    o.on_screen = colRxR(o, rect1);
    return o.on_screen;
}

function dmgText(x, y, value, life, col) {
    Display.call(this, x+getRandomRangeInt(-8,8), y+getRandomRangeInt(-8,8), 1, 1);
    this.maxlife = this.life = life;
    this.val = Math.round(value);
    this.col = col;
    this.hsp = getRandomRangeInt(-1,1);
    this.vsp = getRandomRangeInt(-4,-3);

    this.draw = function () {
        c.font = "900 16px Impact";
        c.lineWidth = "1px";
        c.fillStyle = defToColor(this.col);
        c.strokeStyle = "black";
        c.fillText(this.val, this.x, this.y);
        c.strokeText(this.val, this.x, this.y);
    };

    this.update = function () {
        this.life--
        if (this.life <= 0) {
            remove(objects, this);
        }
        this.vsp += 0.15;
        this.x += this.hsp;
        this.y += this.vsp;
    };
}

////////////////////////////////////////////////////////////////////////////////
// object PARENT / all objects that are not entities (powerups, projectiles, blocks)
////////////////////////////////////////////////////////////////////////////////
var RES = {
    mana: 0
};

function defToColor(col) {
    var max = Math.max.apply(null, col);
    if (max === 0)
        return "#444";
    return rgbToHex(~~(255 * col[0] / max), ~~(255 * col[1] / max), ~~(255 * col[2] / max));
}

function Unit(x, y, faction) {
    Display.call(this, x, y, 64, 64);
    this.obj = 'unit';

    this.maxhp = 1000 + 5000 * Math.random();
    this.hp = this.maxhp;

    this.resource = 'mana';


    this.att = [1.0, 0, 0];
    this.def = [~~(1000 * Math.random()), ~~(200 * Math.random()), ~~(100 * Math.random())];

    this.passives = [];
    this.crowd_ctrl = [];

    this.can_move = true;
    this.can_attack = true;
    this.can_cast = true;
    this.in_air = false;
    this.air_dx = 0;
    this.air_dy = 0;
    this.air_z = 0;

    this.movespeed = 325;
    this.attspeed = 1.0;

    if (faction != 0)
        applyPassive(this, this, new p_UnmitigatedDamage());
    else {
        //applyPassive(this, this, new p_DoT(20, 1.0));
        //applyPassive(this, this, new p_DoT(50, 2.0));
    }


    this.dhp = 0;
    this.faction = faction;

    this.draw = function () {
        if (this.hp <= 0) {
            this.hp = 0;
        }

        c.fillStyle = "red";
        if (this.faction != 0)
            c.fillStyle = "blue";

        c.fillRect(this.x, this.y, this.width, this.height);

        var wid = 100;
        c.fillStyle = defToColor(this.def);
        var w = 1+(1-mitigation(this.def,DTYPE.basic))*12;
        c.fillRect(this.x - w, this.y - 32 - w, wid + w*2, 16 + w*2);
        c.fillStyle = "black";
        c.fillRect(this.x, this.y - 32, wid, 16);
        c.fillStyle = "red";
        c.fillRect(this.x, this.y - 32, wid * this.dhp / this.maxhp, 16);


        c.beginPath();
        c.strokeStyle = "black";
        c.lineWidth = "3";
        c.rect(this.x, this.y - 32, wid * this.hp / this.maxhp, 16);
        c.stroke();
        c.fillStyle = "lime";
        c.fill();

        c.lineWidth = "1";
        c.globalAlpha = 0.5;
        for (var i = 0; i < ~~(this.hp / 100); i++) {
            c.beginPath();
            c.moveTo(this.x + (wid * 100 / this.maxhp) * (i + 1), this.y - 31);
            c.lineTo(this.x + (wid * 100 / this.maxhp) * (i + 1), this.y - 17);
            c.stroke();
        }
        c.globalAlpha = 1.0;

        c.fillText(~~this.hp + " / " + ~~this.maxhp + " (" + this.def + ")", this.x, this.y - 48);
    };

    this.update = function () {

        this.dhp += (this.hp - this.dhp) * 0.03;

        tickWithLoc(LOC.constant, this, this, []);

        if (key_press[0] == true) {
            for (var i = 0; i < objects.length; i++) {
                var o = objects[i];
                if (o.obj === 'unit') {
                    if (o.faction != this.faction) {
                        damage(this, o, 100, [Math.random(), Math.random(), Math.random()]);
                        if (this.faction != 0) {
                            applyPassive(this, o, new p_DoT(50, 2.0));
                        }
                    }
                }
            }
        }
    };
}


function basicMit(def){
    var c = 500;
    return c/(def + c);
}

function mitigation(def,type) {
    normal = true;

    var val = 0;

    val += def[0] * type[0];
    val += def[1] * type[1];
    val += def[2] * type[2];
    val /= type[0] + type[1] + type[2];

    return basicMit(val);
}

function damage(source, target, damage, type) {
    var type = type || DTYPE.basic;
    normal = true;

    var e = dblexeWithLocs(LOC.att_before_mit, LOC.def_before_mit, source, target, [damage, type]);
    damage = e[0];
    type = e[1];

    if (normal) {
        var mitdmg = damage * mitigation(target.def,type);
    }

    e = dblexeWithLocs(LOC.att_after_mit, LOC.def_after_mit, source, target, [damage, mitdmg, type]);
    damage = e[0];
    mitdmg = e[1];
    type = e[2];

    objects.push(new dmgText(target.x, target.y, mitdmg, 60, type));
    if (normal) {
        target.hp -= mitdmg;
    }
}

///////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// object PARENT / all objects that are not entities (powerups, projectiles, blocks)
////////////////////////////////////////////////////////////////////////////////

function objt(x, y, width, height) {
    display.call(this, x, y, width, height);

    //horizonal SPEED
    this.hsp = 0;

    //vertical SPEED
    this.vsp = 0;

    //COLLISION BOUNDARY TYPE
    this.bound = "rect";

    //friction on top of surface TODO: implement
    this.surf_fric = 0.25;
}

objt.prototype.draw = function (c) {
    c.fillStyle = "blue";
    c.fillRect(this.x, this.y, this.width, this.height);
}

objt.prototype.update = function (b, keys) {
}

////////////////////////////////////////////////////////////////////////////////
// instance PARENT // objects that are entities (player, enemies)
////////////////////////////////////////////////////////////////////////////////

function instance(x, y, width, height) {
    objt.call(this, x, y, width, height);
    this.hp = 0; //HIT points
    this.faction = 0;

    //horizontal bounce factor TODO: explain this a bit more
    this.bnc = 0.25;
}

instance.prototype.draw = function (c) {
    c.fillStyle = "green";
    c.fillRect(this.x, this.y, this.width, this.height);
}


////////////////////////////////////////////////////////////////////////////////
// blocks
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// polygon BLOCK
////////////////////////////////////////////////////////////////////////////////

function polyBlock(xx, yy) {

    var _x = Math.min.apply(Math, xx);
    var _width = Math.max.apply(Math, xx) - _x;

    var _y = Math.min.apply(Math, yy);
    var _height = Math.max.apply(Math, yy) - _y;

    objt.call(this, _x, _y, _width, _height);

    this.bound = "poly";
    this.xx = xx; //x coordinates
    this.yy = yy; //y coordinates
}

polyBlock.prototype.draw = function (c) {

    c.fillStyle = "purple";
    c.beginPath();
    c.moveTo(this.xx[0], this.yy[0]);

    for (var i = 1; i < this.xx.length; i++) {
        c.lineTo(this.xx[i], this.yy[i]);
    }
    c.closePath();
    c.fill();

    //uncomment to draw bounding
    /*c.beginPath();
     c.strokeStyle = "pink";
     c.rect(this.x,this.y,this.width,this.height);
     c.stroke();*/

}

polyBlock.prototype.update = function (c) {
}

////////////////////////////////////////////////////////////////////////////////
// jumpthrough BLOCK
////////////////////////////////////////////////////////////////////////////////

function jtBlock(x, y, width, height) {
    objt.call(this, x, y, width, height);
    this.bound = "jt";
}

jtBlock.prototype.draw = function (c) {
    c.fillStyle = "pink";
    c.fillRect(this.x, this.y, this.width, this.height);
}

jtBlock.prototype.update = function (c) {
}

////////////////////////////////////////////////////////////////////////////////
// moveblock BLOCK
////////////////////////////////////////////////////////////////////////////////

function moveBlock(x, y, width, height) {
    objt.call(this, x, y, width, height);
    this.path = null;   //path object
    this.pos = 0;       //position in path
}

moveBlock.prototype.draw = function (c) {
    c.fillStyle = "lime";
    c.fillRect(this.x, this.y, this.width, this.height);
    c.fillStyle = "red";
    c.fillRect(this.x + this.width / 2 - 4, this.y + this.height / 2 - 4, 8, 8);
}

function dR(c, rect1, col) {
    c.fillStyle = col;
    c.fillRect(rect1.x, rect1.y, rect1.width, rect1.height);
}

moveBlock.prototype.update = function (c) {
    //TODO: FIX THIS SHIT
    //SOMEONE HELP PLS

    //update if path exists
    if (this.path != null) {

        //get xy coords based on position in path
        var loc = this.path.getPos(this.pos);
        var dx = loc[0] - this.width / 2;
        var dy = loc[1] - this.height / 2;
        this.hsp = dx - this.x;
        this.vsp = dy - this.y;

        //check rectangle to see if player is near
        var rectx = {x: dx + this.hsp, y: dy - this.vsp - 4, width: this.width, height: this.height};
        var rectx2 = {x: dx + this.hsp, y: dy - 4, width: this.width, height: this.height};
        var recty = {x: dx, y: dy - this.vsp, width: this.width, height: this.height + 4};
        var rectz = {x: dx, y: dy + 4, width: this.width, height: this.height + 4};
        //if moving downwards we want to move this first
        dR(canvas, rectx, "red");
        dR(canvas, rectx2, "blue");

        if (this.vsp > 0)
            this.y = dy;

        var mx = this.hsp;
        if (colRxR(rectz, hero)) {
            if (this.vsp > 0 && hero.vsp < 0) {
                hero.y += this.vsp;
                hero.vsp = 0;
            } else if (this.vsp < 0 && hero.vsp > 0) {
                hero.vsp = 0;
            }
        }
        if (colRxR(rectx, hero) || colRxR(rectx2, hero)) {
            //move player if player is near this
            if (colRxR(recty, hero)) {
                if (this.hsp > 0 && hero.hsp < 0) {
                    hero.x += this.hsp;
                    hero.hsp = 0;
                } else if (this.hsp < 0 && hero.hsp > 0) {
                    hero.x += this.hsp;
                    hero.hsp = 0;
                }
            }
            slopeMicroMove(hero, list, hero.climb, mx, this.vsp);
        }


        this.x = dx;

        //not moving downwards so move as usual
        if (this.vsp < 0)
            this.y = dy;

        this.pos += this.path.speed; // increase by path speed
    }
}


////////////////////////////////////////////////////////////////////////////////
// movePath
////////////////////////////////////////////////////////////////////////////////

function movePath(xx, yy, speed) {

    var _x = Math.min.apply(Math, xx);
    var _width = Math.max.apply(Math, xx) - _x;

    var _y = Math.min.apply(Math, yy);
    var _height = Math.max.apply(Math, yy) - _y;

    objt.call(this, _x, _y, _width, _height);

    this.bound = "none";
    this.xx = xx; //x coordinates
    this.yy = yy; //y coordinates
    this.speed = speed;

    this.pathlen = 0;       //total length of path
    this.pathpnts = [0];    //total path length at point index FYI: this.pathpnts[0] = 0

    var cx = this.xx[0];
    var cy = this.yy[0];
    this.xx.push(cx);
    this.yy.push(cy);

    //set values for pathlen and pathpnts
    for (var i = 1; i < this.xx.length; i++) {
        var d = distPoints(cx, cy, this.xx[i], this.yy[i]);
        this.pathlen += d;
        this.pathpnts.push(this.pathlen);
        cx = this.xx[i];
        cy = this.yy[i];
    }
}

movePath.prototype.draw = function (c) {

    c.strokeStyle = "ltlime";
    c.globalAlpha = 0.5;
    c.lineWidth = 2; // Lines 4px wide, dots of diameter 4

    c.beginPath();
    var cx = this.xx[0];
    var cy = this.yy[0];

    for (var i = 1; i < this.xx.length; i++) {
        c.dashedLine(cx, cy, this.xx[i], this.yy[i], [7, 10]);
        cx = this.xx[i];
        cy = this.yy[i];
    }
    c.stroke();
    c.globalAlpha = 1;

}

movePath.prototype.update = function (c) {
}

//get xy coords based on val (distance to travel from first point), loops at max length
movePath.prototype.getPos = function (val) {
    var cur = 0;

    //return if val = 0;
    if (val === 0) {
        return [this.xx[0], this.yy[0]];
    }

    //setup val to be non negative
    while (val < 0) {
        val += this.pathlen
    }

    //find the looped path value
    var moduloval = val % this.pathlen;

    //find the two points on path that the object would between
    while (moduloval > this.pathpnts[cur]) {
        cur++;
    }

    //calculate the exact xy coord the object would be at
    var dir = anglePoints(this.xx[cur], this.yy[cur], this.xx[cur - 1], this.yy[cur - 1]);
    var dist = this.pathpnts[cur] - moduloval;
    return [this.xx[cur] + Math.cos(dir) * dist, this.yy[cur] + Math.sin(dir) * dist];

}


////////////////////////////////////////////////////////////////////////////////
// camera boundary
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// hard boundary
////////////////////////////////////////////////////////////////////////////////
function camBoundary(x, y, width, height, intensity) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.intensity = intensity;
}

camBoundary.prototype.draw = function (c) {

    c.beginPath();
    c.strokeStyle = "red";
    c.lineWidth = 8;
    c.rect(this.x, this.y, this.width, this.height);
    c.stroke();

}