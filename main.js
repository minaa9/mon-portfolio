var cur = document.getElementById('cur');
document.addEventListener('mousemove', function(e) {
  cur.style.left = e.clientX + 'px';
  cur.style.top = e.clientY + 'px';
});
document.querySelectorAll('a,button').forEach(function(el) {
  el.addEventListener('mouseenter', function() { cur.classList.add('big'); });
  el.addEventListener('mouseleave', function() { cur.classList.remove('big'); });
});

// Construire l'echiquier
var boardEl = document.getElementById('board');
var sqEls = [];
for (var r = 0; r < 8; r++) {
  sqEls[r] = [];
  for (var c = 0; c < 8; c++) {
    var d = document.createElement('div');
    d.className = 'sq ' + ((r + c) % 2 === 0 ? 'L' : 'D');
    (function(rr, cc) {
      d.addEventListener('click', function() { onCell(rr, cc); });
    })(r, c);
    boardEl.appendChild(d);
    sqEls[r][c] = d;
  }
}

var pmap = {};
var sel = null;
var hilited = [];
var solved = false;
var curPg = 0;

var GLYPHS = {
  white: { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙' },
  black: { K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟' }
};

function K(r, c) { return r + ',' + c; }

function clearPieces() {
  document.querySelectorAll('.piece').forEach(function(e) { e.remove(); });
  pmap = {};
}

function put(type, color, r, c) {
  var sp = document.createElement('span');
  sp.className = 'piece';
  sp.textContent = GLYPHS[color][type];
  sp.addEventListener('mouseenter', function() { cur.classList.add('big'); });
  sp.addEventListener('mouseleave', function() { cur.classList.remove('big'); });
  (function(rr, cc) {
    sp.addEventListener('click', function(e) {
      e.stopPropagation();
      onPiece(rr, cc);
    });
  })(r, c);
  sqEls[r][c].appendChild(sp);
  pmap[K(r, c)] = { el: sp, type: type, color: color, r: r, c: c };
}

function clearHL() {
  hilited.forEach(function(h) {
    sqEls[h.r][h.c].classList.remove('hint', 'cap');
  });
  hilited = [];
}

function setMsg(t) { document.getElementById('msgBox').textContent = t; }

function getMoves(r, c) {
  var p = pmap[K(r, c)];
  if (!p) return [];
  var moves = [];
  function push(tr, tc) {
    if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false;
    var t = pmap[K(tr, tc)];
    if (t) { if (t.color !== p.color) moves.push({ r: tr, c: tc, cap: true }); return false; }
    moves.push({ r: tr, c: tc, cap: false });
    return true;
  }
  function slide(dr, dc) {
    var tr = r + dr, tc = c + dc;
    while (push(tr, tc)) { tr += dr; tc += dc; }
  }
  if (p.type === 'Q') { [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(d){slide(d[0],d[1]);}); }
  if (p.type === 'R') { [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){slide(d[0],d[1]);}); }
  if (p.type === 'B') { [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(d){slide(d[0],d[1]);}); }
  if (p.type === 'K') { for(var dr=-1;dr<=1;dr++) for(var dc=-1;dc<=1;dc++) { if(dr||dc) push(r+dr,c+dc); } }
  return moves;
}

function onPiece(r, c) {
  if (solved) return;
  var p = pmap[K(r, c)];
  if (!p) return;
  if (p.color === 'black' && sel) {
    var moves = getMoves(sel.r, sel.c);
    for (var i = 0; i < moves.length; i++) {
      if (moves[i].r === r && moves[i].c === c && moves[i].cap) {
        doMove(sel.r, sel.c, r, c); return;
      }
    }
    setMsg('Cette piece ne peut pas aller la'); return;
  }
  if (p.color === 'black') { setMsg('Joue les blancs !'); return; }
  if (sel && sel.r === r && sel.c === c) {
    p.el.classList.remove('sel'); clearHL(); sel = null;
    setMsg('Clique sur une piece blanche pour commencer'); return;
  }
  if (sel) { var old = pmap[K(sel.r, sel.c)]; if(old) old.el.classList.remove('sel'); clearHL(); }
  sel = { r: r, c: c };
  p.el.classList.add('sel');
  var mv = getMoves(r, c);
  for (var j = 0; j < mv.length; j++) {
    sqEls[mv[j].r][mv[j].c].classList.add(mv[j].cap ? 'cap' : 'hint');
    hilited.push({ r: mv[j].r, c: mv[j].c });
  }
  setMsg('Clique sur une case doree pour jouer');
}

function onCell(r, c) {
  if (!sel || solved) return;
  var moves = getMoves(sel.r, sel.c);
  for (var i = 0; i < moves.length; i++) {
    if (moves[i].r === r && moves[i].c === c) { doMove(sel.r, sel.c, r, c); return; }
  }
}

function doMove(fr, fc, tr, tc) {
  var moving = pmap[K(fr, fc)];
  // Le seul bon coup : Dame blanche (Q) de r3,c3 vers r0,c3
  // Puzzle ultra simple : Tour blanche de h2 va en h8 — mat !
  var isWin = (moving.type === 'R' && moving.color === 'white' && fr === 6 && fc === 7 && tr === 0 && tc === 7);
  var cap = pmap[K(tr, tc)];
  if (cap) { cap.el.remove(); delete pmap[K(tr, tc)]; }
  moving.el.classList.remove('sel');
  moving.el.remove();
  delete pmap[K(fr, fc)];
  clearHL();
  sel = null;
  put(moving.type, moving.color, tr, tc);
  if (isWin) {
    solved = true;
    setMsg('QD8# — ECHEC ET MAT ! Le portfolio s\'ouvre...');
    setTimeout(function() {
      document.getElementById('flash').classList.add('go');
      setTimeout(function() { document.getElementById('flash').classList.remove('go'); }, 600);
      setTimeout(function() { openPage(1); }, 400);
    }, 600);
  } else {
    setMsg('Pas le bon coup... La Dame doit aller en d8 !');
    setTimeout(reset, 1600);
  }
}

function openPage(n) {
  document.getElementById('hud-top').style.opacity = '0';
  document.getElementById('hud-top').style.pointerEvents = 'none';
  document.getElementById('hud-bot').style.opacity = '0';
  document.getElementById('hud-bot').style.pointerEvents = 'none';
  document.getElementById('p' + n).classList.add('on');
  curPg = n;
  document.getElementById('prog').style.display = 'flex';
  updateDots();
}

function go(n) {
  if (curPg > 0) document.getElementById('p' + curPg).classList.remove('on');
  document.getElementById('p' + n).classList.add('on');
  curPg = n;
  updateDots();
}

function backGame() {
  document.getElementById('p' + curPg).classList.remove('on');
  document.getElementById('hud-top').style.opacity = '1';
  document.getElementById('hud-top').style.pointerEvents = 'all';
  document.getElementById('hud-bot').style.opacity = '1';
  document.getElementById('hud-bot').style.pointerEvents = 'all';
  curPg = 0;
  document.getElementById('prog').style.display = 'none';
  reset();
}

function updateDots() {
  for (var i = 0; i < 4; i++) {
    var d = document.getElementById('d' + i);
    d.className = 'dot';
    if (i < curPg - 1) d.classList.add('done');
    else if (i === curPg - 1) d.classList.add('now');
  }
}

function sendForm(e) {
  e.preventDefault();
  var btn = document.getElementById('sbtn');
  btn.textContent = 'Envoye !';
  btn.style.background = '#4a9a6a';
  setTimeout(function() { btn.textContent = 'Envoyer →'; btn.style.background = ''; e.target.reset(); }, 3000);
}

function reset() {
  clearHL(); sel = null; solved = false; clearPieces();
  // Blanc : Roi e1, Tour h2
  // Noir  : Roi h8 (coince dans le coin)
  // Solution : Tour de h2 → h8 (mat !)
  put('K','white',7,4);
  put('R','white',6,7);
  put('K','black',0,7);
  setMsg('Clique sur une piece blanche pour commencer');
}

reset();
