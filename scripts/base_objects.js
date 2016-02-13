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
    this.cx = x + width / 2;
    this.cy = y + height / 2;
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

function DmgText(x, y, value, life, col, dir) {
    Display.call(this, x + getRandomRangeInt(-8, 8), y + getRandomRangeInt(-8, 8), 1, 1);
    this.maxlife = this.life = life;
    this.val = Math.round(value);
    this.col = col;
    this.hsp = 0;//dir || getRandomRangeInt(-1, 1);
    this.vsp = getRandomRangeInt(-1, -1);

    this.draw = function () {
        //c.globalAlpha = this.life/this.maxlife;
        var col = defToColor(this.col);
        var text = String(this.val).split("").join(String.fromCharCode(8202))
        c.font = "700 italic 12px Roboto Mono";
        c.lineWidth = 3;
        c.textAlign = "center";
        c.strokeStyle = "black";

        if (col === "#000") {
            c.strokeStyle = "white";
        } else {
            c.strokeStyle = "black";
        }

        c.fillStyle = col;
        c.strokeText(text, this.x, this.y);
        c.fillText(text, this.x, this.y);
        //c.globalAlpha = 1.0;

    };

    this.update = function () {
        this.life--;
        if (this.life <= 0) {
            remove(objects, this);
        }
        //this.vsp += 0.15;
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

function Unit(x, y, faction) {
    Display.call(this, x, y, 64, 64);
    this.obj = 'unit';

    this.maxhp = 1000 + 5000 * Math.random();
    this.hp = this.maxhp;
    this.dhp = this.maxhp;

    this.resource = 'mana';

    this.att = [1.0, 0, 0];
    this.def = [getRandomRangeInt(50, 250), getRandomRangeInt(50, 250), getRandomRangeInt(50, 250)];
    //this.def = choose([[60,60,60],[400,400,400]]);

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

    if (faction != 0) {
        //applyPassive(this, this, new p_UnmitigatedDamage());
    } else {
        //applyPassive(this, this, new p_Invincible());
       // applyPassive(this, this, new p_ProtectionPct(0.5));
    }


    this.dhp = 0;
    this.faction = faction;

    this.draw = function () {
        if (this.hp <= 0) {
            this.hp = 0;
        }
        if (this.dhp <= 0) {
            this.dhp = 0;
        }

        c.fillStyle = "red";
        if (this.faction != 0)
            c.fillStyle = "blue";

        c.fillRect(this.x, this.y, this.width, this.height);

        var wid = 100;
        var corner = 4;
        c.strokeStyle = "black";
        c.lineWidth = 1;

        c.fillStyle = defToColor(this.def);
        var w = 2 + 8 * averageCol(this.def, DTYPE.basic) / 250;//(1 - mitigation(this.def, DTYPE.basic)) * 16;
        roundRect(c, this.x - w * 1.5 - 2, this.y - 32 - w + 2, wid + w * 3 + 4,
            16 + w * 2 - 4, corner + w / 2, true, false);

        c.fillStyle = "black";
        roundRect(c, this.x - 2, this.y - 32, wid + 4, 16, corner * 1.5, true, true);

        c.fillStyle = "red";
        roundRect(c, this.x, this.y - 32 + 2,
            wid * this.dhp / this.maxhp, 16 - 4, corner, true, false);

        c.fillStyle = "lime";
        roundRect(c, this.x, this.y - 32 + 2,
            wid * this.hp / this.maxhp, 16 - 4, corner, true, true);

        c.globalAlpha = 0.5;

        var j = 30;
        while (~~(this.maxhp / j) > 10) {
            j *= 10;

            var lg = log(j, 10);
            c.lineWidth = 1;//lg - 1;
            var q = lg / log(this.maxhp, 10);
            if (q < 0.25) {
                continue;
            }

            c.globalAlpha = q;

            for (var i = 0; i < ~~(this.hp / j); i++) {
                var l = (wid * j / this.maxhp) * (i + 1);
                c.beginPath();
                c.moveTo(this.x + l, this.y - 32 + lg + 1);
                c.lineTo(this.x + l, this.y - 16 - lg - 1);
                c.stroke();
            }

        }

        c.globalAlpha = 1.0;

        c.fillText(~~this.hp + " / " + ~~this.maxhp + " (" + this.def + ")", this.x, this.y - 48);
    };

    this.update = function () {
        this.cx = this.x + this.width / 2;
        this.cy = this.y + this.height / 2;

        this.dhp += (this.hp - this.dhp) * 0.03;

        tickWithLoc(LOC.constant, this, this, []);

        if (key_press[0] == true) {
            for (var i = 0; i < objects.length; i++) {
                var o = objects[i];
                if (o.obj === 'unit') {
                    if (o.faction != this.faction) {

                        if (this.faction == -1) {
                            //damage(this, o, 1000, [Math.random(), Math.random(), Math.random()]);
                            //applyPassive(this, o, new p_DoT(50, 2.0));
                        } else {
                            damage(this, o, 200,
                                choose([DTYPE.piercing, DTYPE.energy, DTYPE.blunt,
                                    DTYPE.ethereal, DTYPE.natural, DTYPE.slashing]));
                        }
                    }
                }
            }
        }
    };
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