// Doble de prueba de PeerJS: conecta pestañas del mismo navegador con BroadcastChannel (sin internet).
(() => {
  const bc = new BroadcastChannel("peer-shim");
  const peers = new Map();
  class Emitter { constructor() { this.l = {}; } on(e, f) { (this.l[e] ||= []).push(f); return this; } emit(e, ...a) { (this.l[e] || []).forEach((f) => f(...a)); } }
  class Conn extends Emitter {
    constructor(peer, remote) { super(); this.peer = peer; this.remote = remote; this.open = false; }
    send(m) { bc.postMessage({ to: this.remote, from: this.peer.id, k: "data", m: JSON.parse(JSON.stringify(m)) }); }
    close() { bc.postMessage({ to: this.remote, from: this.peer.id, k: "bye" }); this.open = false; this.emit("close"); }
    _open() { this.open = true; this.emit("open"); }
  }
  class Peer extends Emitter {
    constructor(id) { super(); this.id = id || "p" + Math.random().toString(36).slice(2, 8); this.conns = new Map(); peers.set(this.id, this); setTimeout(() => this.emit("open", this.id), 20); }
    connect(id) {
      const c = new Conn(this, id); this.conns.set(id, c);
      bc.postMessage({ to: id, from: this.id, k: "syn" });
      setTimeout(() => { if (!c.open) this.emit("error", { type: "peer-unavailable" }); }, 800);
      return c;
    }
    destroy() { this.conns.forEach((c) => c.close()); peers.delete(this.id); }
  }
  bc.onmessage = ({ data: d }) => {
    const p = peers.get(d.to); if (!p) return;
    if (d.k === "syn") { const c = new Conn(p, d.from); p.conns.set(d.from, c); p.emit("connection", c); c._open(); bc.postMessage({ to: d.from, from: p.id, k: "ack" }); }
    else if (d.k === "ack") { const c = p.conns.get(d.from); c && c._open(); }
    else if (d.k === "data") { const c = p.conns.get(d.from); c && c.emit("data", d.m); }
    else if (d.k === "bye") { const c = p.conns.get(d.from); if (c) { c.open = false; c.emit("close"); } }
  };
  window.Peer = Peer;
})();
