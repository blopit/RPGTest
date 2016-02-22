/**
 * Created by shrenilpatel on 2016-02-17.
 */
function basicMit(def) {
    var c = 1000;
    return c / (def + c);
}

function averageCol(def, type) {
    var val = 0;

    val += def[0] * type[0];
    val += def[1] * type[1];
    val += def[2] * type[2];
    val /= type[0] + type[1] + type[2];

    return val;
}

function inv_mitigation(def, type) {
    return 1 - mitigation(def, type);
}

function mitigation(def, type) {
    normal = true;

    return basicMit(averageCol(def, type));
}

function heal(source, target, value) {
    value = Math.max(value, 1);
    normal = true;

    if (value < 0) {
        damage(source, target, DTYPE.ethereal);
        return;
    }
    target.hp += value;
    new BattleText(target.cx, target.cy - 64, ~~value,
        40, "#fff", "#00ff00");
}

function damage(source, target, damage, type) {
    type = type || DTYPE.basic;
    damage = Math.max(damage, 1);
    var mitdmg = 0;
    normal = true;

    var e = dblexeWithLocs(LOC.att_before_mit, LOC.def_before_mit, source, target, {dmg: damage, type: type});
    damage = e.dmg;
    type = e.type;

    if (normal) {
        mitdmg = damage * mitigation(target.def, type);
    }

    e = dblexeWithLocsAlt(LOC.att_after_mit, LOC.def_after_mit,
        LOC.att_alter, LOC.def_alter,
        source, target, {dmg: damage, mit: mitdmg, type: type});
    damage = e.dmg;
    mitdmg = e.mit;
    type = e.type;

    if (mitdmg == 0) {
        new BattleText(target.cx, target.cy - 64, "Invulnerable",
            40, "PaleGoldenRod", "GoldenRod");
        return;
    } else if (mitdmg < 0) {
        heal(source, target, -mitdmg);
        return;
    }
    if (normal) {
        target.hp -= mitdmg;
        new BattleText(target.cx, target.cy - 64, ~~mitdmg,
            40, type.color, "#000");
        target.hpbar.li = 1.0;
    }
}