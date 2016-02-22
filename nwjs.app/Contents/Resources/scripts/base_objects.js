// BASE OBJECTS DOCUMENT
////////////////////////////////////////////////////////////////////////////////
// displayable PARENT (objects that do not collide with anything, eg foreground)
////////////////////////////////////////////////////////////////////////////////

function Display(x, y, width, height) {
    objects.push(this);

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
};
Display.prototype.draw = function () {
    c.fillStyle = "white";
    c.fillRect(this.x, this.y, this.width, this.height);
};
Display.prototype.update = function (b, keys) {
};

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


function Segment(name, anchor, x, y, length, rotation, azm) {
    Display.call(this, x, y, 1, 1);
    this.anchor = anchor;
    this.name = name;

    this.ax = x;
    this.ay = y;
    this.az = 0;

    this.rot = rotation / 180 * Math.PI || 0;
    this.azm = azm / 180 * Math.PI || 0;

    this.Drot = this.rot;
    this.Dazm = this.azm;
    this.Dspd = 1;

    this.len = length;
    this.parts = [this];

    this.root = this;
    this.level = 0;
    if (this.anchor != null) {
        this.root = this.anchor.root;
        this.root.parts.push(this);
        this.level = this.anchor.level + 1;
    }

    this.bx = 0;
    this.by = 0;
    this.bz = 0;

    this.getRot = function () {
        if (this.anchor == null) {
            return this.rot;
        }
        return this.rot + this.anchor.getRot();
    };

    this.getAzm = function () {
        if (this.anchor == null) {
            return this.azm;
        }
        return this.azm;// + this.anchor.getAzm();
    };

    this.update = function () {
        if (anchor != null) {
            this.ax = anchor.bx;
            this.ay = anchor.by;
            this.az = anchor.bz;
        } else {
            //this.azm += 1 / 180 * Math.PI;
            this.rot = rotate(this.rot, anglePoints(this.x, this.y, mouse.x, mouse.y), 5);
        }

        if (name == 'LUarm') {
            //this.rot = rotate(this.rot, anglePoints(this.x, this.y, mouse.x, mouse.y) - this.anchor.getRot(), 5);
        }

        //this.azm += 1 / 180 * Math.PI;

        this.bx = this.ax + Math.cos(this.getRot()) * this.len * Math.cos(this.getAzm());
        this.by = this.ay + Math.sin(this.getRot()) * this.len * Math.cos(this.getAzm());
        this.bz = this.az + this.len * Math.sin(this.getAzm())
    };

    this.trueDraw = function () {
        var o = this;
        var col = "white";

        switch (this.level) {
            case 0:
                col = "lime";
                break;
            case 1:
                col = "yellow";
                break;
            case 2:
                col = "orange";
                break;
            case 3:
                col = "red";
                break;
        }
        c.strokeStyle = col;
        c.fillStyle = col;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(o.ax, o.ay + o.az);
        c.lineTo(o.bx, o.by + o.bz);
        c.stroke();
        c.beginPath();
        c.arc(o.bx, o.by + o.bz, 4, 0, 2 * Math.PI)
        c.fill();
    }

    this.draw = function () {
        if (this.root != this) {
            return;
        }
        this.parts.sort(segCompare);

        for (var i = 0; i < this.parts.length; i++) {
            this.parts[i].trueDraw();
        }
    };
}

function segCompare(a, b) {
    var ret = parseInt(b.az) - parseInt(a.az);
    if (ret == 0) {
        return parseInt(b.ay) - parseInt(a.ay);
    } else {
        return ret;
    }
};

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
        var padding = 2;

        c.strokeStyle = "black";
        c.lineWidth = padding;

        //c.fillStyle = defToColor(this.src.def);
        var w = padding + 4 * averageCol(this.src.def, DTYPE.basic) / 2500;
        /*roundRect(c, this.x + this.xoff - w * 1.5 - padding / 2, this.y + this.yoff - w + 1,
         this.width + w * 3 + padding, this.height + w * 2 - 2, corner + w / 2, true, false);*/

        c.fillStyle = defToColor(this.src.def);
        roundRect(c, this.x + this.xoff - padding / 2 - w * 1.5, this.y + this.yoff - w,
            this.width + padding + w * 3, this.height + w * 2, corner * 1.5, true, false);

        c.fillStyle = "black";
        roundRect(c, this.x + this.xoff - 2, this.y + this.yoff,
            this.width + 4, this.height, corner * 1.5, true, false);

        //c.fillStyle = "#444444";
        c.fillRect(this.x + this.xoff, this.y + this.yoff + 2,
            this.width, this.height - 4);

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

        var j = 250;
        while (~~(this.src.maxhp / j) > 2) {
            j *= 2;

            var lg = log(j, 4);
            c.lineWidth = 1;//lg - 1;
            var q = log(250, 2) / log(this.src.maxhp, 2);
            if (log(j, 2) / log(this.src.maxhp, 2) < 0.25) {
                continue;
            }

            c.globalAlpha = q;

            for (var i = 0; i < ~~(this.src.hp / j); i++) {
                var l = (this.width * j / this.src.maxhp) * (i + 1);
                c.beginPath();
                c.moveTo(this.x + l, this.y + this.yoff);
                c.lineTo(this.x + l, this.y + this.yoff + this.height);
                c.stroke();
            }

        }

        c.globalAlpha = 1.0;
        c.fillStyle = "white";
        //c.fillText(this.src.movespeed, this.x, this.y - 56);
        c.fillText(~~this.src.hp + " / " + ~~this.src.maxhp + " (" + this.src.def + ")", this.x, this.y - 56);
    }
}

////////////////////////////////////////////////////////////////////////////////
// object PARENT / all objects that are not entities (powerups, projectiles, blocks)
////////////////////////////////////////////////////////////////////////////////
var RES = {
    mana: 0
};

function Unit(x, y, faction) {
    Display.call(this, x, y, 12, 12);
    this.obj = 'unit';

    this.maxhp = 1000 + 5000 * Math.random();
    this.hp = this.maxhp;
    this.att = [1.0, 0, 0];
    this.def = [getRandomRangeInt(500, 1500), getRandomRangeInt(500, 1500), getRandomRangeInt(500, 1500)];
    this.resource = RES.mana;

    this.hpbar = new HealthBar(0, -40, 32, 8, this);
    this.passives = [];
    this.slows = [];

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
    this.angle = 0;

    this.max_movespeed = 1500;
    this.movespeed = this.max_movespeed; //>-64
    this.attspeed = 1.0;

    if (faction != 0) {
        //applyPassive(this, this, new p_UnmitigatedDamage());
        applyPassive(this, this, new c_Slow(0.1, 10.0));
    } else {
        //applyPassive(this, this, new p_Invincible());
    }

    this.dhp = 0;
    this.faction = faction;
}

Unit.prototype.draw = function () {
    this.cx = this.x + this.width / 2;
    this.cy = this.y + this.height / 2;
    this.hpbar.x = this.cx - this.hpbar.width / 2;
    this.hpbar.y = this.cy;
    this.hpbar.update();
    this.hpbar.draw();

    if (this.hp < 0) {
        this.hp = 0;
    } else if (this.hp > this.maxhp) {
        this.hp = this.maxhp;
    }

    c.fillStyle = "red";
    if (this.faction != 0)
        c.fillStyle = "blue";

    c.fillRect(this.x, this.y, this.width, this.height);

    c.beginPath();
    c.moveTo(this.cx, this.cy);
    c.lineTo(this.cx + Math.cos(this.angle) * 16, this.cy + Math.sin(this.angle) * 16);
    c.stroke();
};

Unit.prototype.update = function () {
    var e = tickWithLoc(LOC.crowd_control, this, this, {slow: [0], move: true, attack: true, cast: true});
    this.can_move = e.move;
    this.can_attack = e.attack;
    this.can_cast = e.cast;
    console.log(e.slow, Math.max.apply(null, e.slow));
    this.movespeed = (1 - Math.max.apply(null, e.slow)) * this.max_movespeed;

    tickWithLoc(LOC.constant, this, this, {});

    if (key_press[KEY.vk_1] == true) {
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
    } else if (key_press[KEY.vk_2] == true) {
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


ControlledUnit.prototype = Object.create(Unit.prototype);
function ControlledUnit(x, y, faction) {
    Unit.call(this, x, y, faction);

    this.moveXvec = 0;
    this.moveYvec = 0;
}
ControlledUnit.prototype.draw = function () {
    Unit.prototype.draw.call(this);
};

ControlledUnit.prototype.update = function () {
    Unit.prototype.update.call(this);
    //Unit.prototype.update();

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
        this.angle = anglePoints(0, 0, this.hsp, this.vsp);
    }

    var a = anglePoints(0, 0, this.hsp, this.vsp);
    var d = distPoints(0, 0, this.hsp, this.vsp);

    if (d > this.movespeed / 600) {
        d = this.movespeed / 600;
    } else if (this.moveXvec == 0 && this.moveYvec == 0) {
        d = fric(d, this.ground_fric);
    }
    this.hsp = Math.cos(this.angle) * d;
    this.vsp = Math.sin(this.angle) * d;

    this.x += this.hsp;
    this.y += this.vsp;


};

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