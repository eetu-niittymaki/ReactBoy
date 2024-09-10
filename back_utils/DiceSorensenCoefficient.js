const compare = (fst, snd) => {
    let i, j, k, map, match, ref, ref1, sub;

    if (fst.length < 2 || snd.length < 2) {
      return 0;
    }

    map = new Map();
    for (i = j = 0, ref = fst.length - 2; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
      sub = fst.substr(i, 2);
      if (map.has(sub)) {
        map.set(sub, map.get(sub) + 1);
      } else {
        map.set(sub, 1);
      }
    }
    match = 0;

    for (i = k = 0, ref1 = snd.length - 2; (0 <= ref1 ? k <= ref1 : k >= ref1); i = 0 <= ref1 ? ++k : --k) {
      sub = snd.substr(i, 2);
      if (map.get(sub) > 0) {
        match++;
        map.set(sub, map.get(sub) - 1);
      }
    }
    return 2.0 * match / (fst.length + snd.length - 2);
}

module.exports = { compare }