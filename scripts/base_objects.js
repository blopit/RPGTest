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

function BattleText(x, y, value, life, col, border) {
    Display.call(this, x + getRandomRangeInt(-8, 8), y + getRandomRangeInt(-8, 8), 1, 1);
    this.maxlife = this.life = life;
    this.val = String(value).split("").join(String.fromCharCode(8202));
    this.col = col;
    this.hsp = 0; //dir || getRandomRangeInt(-1, 1);
    this.vsp = getRandomRangeInt(-1, -1);
    this.bord = border;

    this.draw = function () {
        //c.globalAlpha = this.life/this.maxlife;
        var col = this.col;
        var text = this.val;
        c.font = "700 italic 12px Roboto Mono";
        c.lineWidth = 3;
        c.textAlign = "center";
        c.strokeStyle = this.bord;

        if (col === "#000") {
            c.strokeStyle = "white";
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

function HealthBar(x, y, width, height, source) {
    Display.call(this, 0, 0, width, height);
    this.xoff = x;
    this.yoff = y;
    this.src = source;
    this.li = 0.0;
    this.dhp = this.src.hp;

    this.update = function () {
        this.x = this.src.x;
        this.y = this.src.y;

        if (this.li > 0) {
            this.li -= 0.05;
        } else {
            this.dhp += (this.src.hp - this.dhp) * 0.03;
        }
        if (this.li < 0) {
            this.li = 0;
        }


    }

    this.draw = function () {
        var corner = 4;
        c.strokeStyle = "black";
        c.lineWidth = 3;

        c.fillStyle = defToColor(this.src.def);
        var w = 2 + 8 * averageCol(this.src.def, DTYPE.basic) / 2500;
        roundRect(c, this.x + this.xoff - w * 1.5 - 2, this.y + this.yoff - w + 1, this.width + w * 3 + 4,
            this.height + w * 2 - 2, corner + w / 2, true, false);

        c.fillStyle = "black";
        roundRect(c, this.x + this.xoff - 2, this.y + this.yoff, this.width + 4, this.height, corner * 1.5, true, true);

        c.fillStyle = "red";
        c.fillRect(this.x + this.xoff, this.y + this.yoff + 2,
            this.width * this.dhp / this.src.maxhp, this.height - 4);

        c.fillStyle = "#44D044";
        c.fillRect(this.x + this.xoff, this.y + this.yoff + 2,
            this.width * this.src.hp / this.src.maxhp, this.height - 4);

        c.globalAlpha = this.li * 0.5;
        c.fillStyle = "white";
        c.fillRect(this.x + this.xoff, this.y + this.yoff + 2,
            this.width * this.src.hp / this.src.maxhp, this.height - 4);
        c.globalAlpha = 1.0;

        c.fillStyle = "black";
        roundRect(c, this.x + this.xoff - 2, this.y + this.yoff,
            this.width + 4, this.height, corner * 1.5, false, true);

        //c.globalAlpha = 0.25;

        var j = 30;
        while (~~(this.src.maxhp / j) > 10) {
            j *= 10;

            var lg = log(j, 20);
            c.lineWidth = 1;//lg - 1;
            var q = lg / log(this.src.maxhp, 10);
            if (q < 0.25) {
                continue;
            }

            c.globalAlpha = q * 0.5;

            for (var i = 0; i < ~~(this.src.hp / j); i++) {
                var l = (this.width * j / this.src.maxhp) * (i + 1);
                c.beginPath();
                c.moveTo(this.x + l, this.y + this.yoff);
                c.lineTo(this.x + l, this.y + this.yoff + this.height);
                c.stroke();
            }

        }

        c.globalAlpha = 1.0;

        c.fillText(~~this.src.hp + " / " + ~~this.src.maxhp + " (" + this.src.def + ")", this.x, this.y - 64);
    }
}

////////////////////////////////////////////////////////////////////////////////
// object PARENT / all objects that are not entities (powerups, projectiles, blocks)
////////////////////////////////////////////////////////////////////////////////
var RES = {
    mana: 0
};

function Unit(x, y, faction) {
    Display.call(this, x, y, 32, 32);
    this.obj = 'unit';

    this.maxhp = 1000 + 5000 * Math.random();
    this.hp = this.maxhp;
    this.att = [1.0, 0, 0];
    this.def = [getRandomRangeInt(500, 1500), getRandomRangeInt(500, 1500), getRandomRangeInt(500, 1500)];
    this.resource = RES.mana;

    this.hpbar = new HealthBar(0, -32, 100, 16, this);
    objects.push(this.hpbar);
    this.passives = [];
    this.crowd_ctrl = [];

    this.can_move = true;
    this.can_attack = true;
    this.can_cast = true;
    this.in_air = false;
    this.air_dx = 0;
    this.air_dy = 0;

    this.z = 0;
    this.hsp = 0;
    this.vsp = 0;
    this.ground_fric = 0.8;
    
    this.movespeed = 325; //>-64
    this.attspeed = 1.0;

    if (faction != 0) {
        //applyPassive(this, this, new p_UnmitigatedDamage());
    } else {
        //applyPassive(this, this, new p_Invincible());
        // applyPassive(this, this, new p_ProtectionPct(0.5));
    }

    console.log([~~(100 * inv_mitigation(this.def, DTYPE.energy)),
            ~~(100 * inv_mitigation(this.def, DTYPE.ethereal)),
            ~~(100 * inv_mitigation(this.def, DTYPE.piercing)),
            ~~(100 * inv_mitigation(this.def, DTYPE.slashing)),
            ~~(100 * inv_mitigation(this.def, DTYPE.blunt)),
            ~~(100 * inv_mitigation(this.def, DTYPE.natural))
        ]
    );

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
    }

    this.update = function () {
        this.cx = this.x + this.width / 2;
        this.cy = this.y + this.height / 2;

        tickWithLoc(LOC.constant, this, this, []);

        if (key_press[KEY.vk_up] == true) {
            for (var i = 0; i < objects.length; i++) {
                var o = objects[i];
                if (o.obj === 'unit') {
                    if (o.faction != this.faction) {
                        damage(this, o, 200,
                            choose([DTYPE.piercing, DTYPE.energy, DTYPE.blunt,
                                DTYPE.ethereal, DTYPE.natural, DTYPE.slashing]));

                    }
                }
            }
        } else if (key_press[KEY.vk_down] == true) {
            for (var i = 0; i < objects.length; i++) {
                var o = objects[i];
                if (o.obj === 'unit') {
                    if (o.faction != this.faction) {
                        heal(this, o, 200);
                    }
                }
            }
        }

    };
}

function ControlledUnit(x, y, faction) {
    Unit.call(this, x, y, faction);

    this.moveXvec = 0;
    this.moveYvec = 0;

    this.update = function () {
        this.cx = this.x + this.width / 2;
        this.cy = this.y + this.height / 2;

        this.moveXvec = 0;
        this.moveYvec = 0;
        if (key[KEY.vk_up]) {
            this.moveYvec -= 1;
        }
        if (key[KEY.vk_down]) {
            this.moveYvec += 1;
        }
        if (key[KEY.vk_left]) {
            this.moveXvec -= 1;
        }
        if (key[KEY.vk_right]) {
            this.moveXvec += 1;
        }

        if (this.moveXvec != 0 || this.moveYvec != 0) {
            var ang = anglePoints(0, 0, this.moveXvec, this.moveYvec);
            this.hsp += Math.cos(ang) * this.ground_fric;
            this.vsp += Math.sin(ang) * this.ground_fric;
        }

        var a = anglePoints(0, 0, this.hsp, this.vsp);
        var d = distPoints(0, 0, this.hsp, this.vsp);

        if (d > this.movespeed / 60) {
            d = this.movespeed / 60;
        } else if (this.moveXvec == 0 && this.moveYvec == 0) {
            d = fric(d, this.ground_fric);
        }
        console.log(a * 180 / Math.PI);
        this.hsp = Math.cos(a) * d;
        this.vsp = Math.sin(a) * d;

        this.x += this.hsp;
        this.y += this.vsp;


    }
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