/**
 * Created by shrenilpatel on 2016-02-11.
 */
///////////////////////////////////////////////////////////////////////////

var ID = 0;

function p_passive(name, loc, buff, cat, dur, tick) {
    this.id = ID++;
    this.loc = loc || [LOC.constant];
    this.prio = PRIO.NORMAL;
    this.tick = tick || ~~(targ_fps / 2);
    this.dur = ~~(dur * targ_fps) || -1;
    this.source = null;
    this.buff = buff || BTYPE.none;
    this.name = name || "NAME ERROR";
    this.cat = cat || ['error'];
    this.dmg = 0;
    this.timer = 0;

    this.init = function(source, target) {
        console.log(this.name + " null INITIALIZED");
    };
    this.purge = function() {
        this.expire();
    };
    this.process = function (source, target, list) {
        console.log(this.name + " null PROCESS");
        return null;
    };
    this.expire = function () {
        console.log(this.name + " null EXPIRED");
    };
    this.stack = function () {
        console.log(this.name + " null STACKING");
    }
};

function passiveCompare(a, b) {
    return parseInt(b.prio) - parseInt(a.prio);
};

function passiveCompareDbl(a, b) {
    return parseInt(b[0].prio) - parseInt(a[0].prio);
};

//gives user unmitigated damage
function p_UnmitigatedDamage() {
    p_passive.call(this,
        "Unmitigated Damage",
        [LOC.att_alter],
        BTYPE.buff,
        ['unique']
    );
    this.prio = PRIO.SPECIAL;

    //dmg, mit, type
    this.process = function (source, target, list) {
        if (list.buff.prio < this.prio) {
            return {oldlist: list.oldlist, newlist: list.newlist, buff: list.buff};
        }

        list.oldlist.type = DTYPE.raw;
        list.newlist.type = DTYPE.raw;
        list.oldlist.mit = list.oldlist.dmg;
        list.newlist.mit = list.newlist.dmg;

        if (list.oldlist.mit > list.newlist.mit) {
            return {oldlist: list.oldlist, newlist: list.oldlist, buff: list.buff};
        }
        return {oldlist: list.oldlist, newlist: list.newlist, buff: list.buff};
    }
}

//gives user invincible
function p_Invincible() {
    p_passive.call(this,
        "Invincible",
        [LOC.def_after_mit],
        BTYPE.buff,
        ['unique']
    );
    this.prio = PRIO.HIGH_ULT;

    //dmg, mit, type
    this.process = function (source, target, list) {
        return {dmg: 0, mit: 0, type: DTYPE.none};
    }
}

//reduces incoming damage by percent
function p_ProtectionPct(reduction) {
    p_passive.call(this,
        "Invincible",
        [LOC.def_after_mit],
        BTYPE.buff,
        ['unique']
    );
    this.val = 1 - reduction;

    //dmg, mit, type
    this.process = function (source, target, list) {
        return {dmg: list.dmg * (this.val), mit: list.mit * (this.val), type: list.type};
    }
}

//basic DoT
function p_DoT(dmg, dur, tick, type) {
    p_passive.call(this,
        "Test DoT",
        [LOC.constant],
        BTYPE.debuff,
        ['dot'],
        dur,
        tick
    );

    this.dmg = dmg;
    this.type = type || DTYPE.natural;

    //[none]
    this.process = function (source, target, list) {
        damage(this.source, target, this.dmg, this.type);
        return {};
    }
}

//basic slow
function c_Slow(am, dur) {
    p_passive.call(this,
        "Test Slow",
        [LOC.crowd_control],
        BTYPE.crowd_control,
        ['slow'],
        dur,
        1
    );

    this.amount = am;

    this.process = function (source, target, list) {
        list.slow.push(am);
        return {slow:list.slow, move:list.move, attack:list.attack, cast:list.cast};
    }
}