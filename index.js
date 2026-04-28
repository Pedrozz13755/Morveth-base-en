//========= CRÉDITOS =============\\
/*
CRÉDITOS: PEDROZZ MODS

Base criada por Pedrozz Mods.
Se divulgar, repostar ou compartilhar, mantenha os créditos.
Base gratuita. Se alguém vender, tá errado.
*/

//=========== MÓDULOS ===========\\
const {
default: makeWASocket,
useMultiFileAuthState,
makeCacheableSignalKeyStore,
fetchLatestBaileysVersion,
DisconnectReason,
downloadContentFromMessage
} = require("baileys");

const baileys = require("baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const chalk = require("chalk");
const NodeCache = require("node-cache");
const readline = require("readline");

//=========== CONFIG ===========\\
const { prefix, botName, ownerName, ownerJid, ownerLid, ownerLink } = require("./owner/config.json");
const { cor, logBox, getDataHora, formatTime, limparNumero, fetchJson, getBuffer, getFileBuffer, getMetaCached, getBody, getTipoMensagem, msg } = require("./files/utils/func");

const fotomenu = "./files/images/menu.png";
const files = "./files/";
const pastaAuth = "./owner/Morveth-QR";
const pastaComandos = path.join(__dirname, "commands");
const pastaVerif = path.join(__dirname, "files", "utils", "checks");
const comandos = new Map();

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));
//=========== PROTEÇÃO ANTI-CRASH ===========\\
process.on("uncaughtException", (err) => {
console.log(cor.erro("[UNHANDLED ERROR]"), err);
});

process.on("unhandledRejection", (err) => {
console.log(cor.erro("[PROMISE REJECTED]"), err);
});

//=========== VERIFICATIONS ===========\\
let verificacoes = {};

function loadVerificacoes() {
verificacoes = {};

if (!fs.existsSync(pastaVerif)) {
fs.mkdirSync(pastaVerif, { recursive: true });
return;
}

for (const file of fs.readdirSync(pastaVerif)) {
if (!file.endsWith(".js")) continue;

const fullPath = path.join(pastaVerif, file);

try {
delete require.cache[require.resolve(fullPath)];
const nome = file.replace(".js", "");
verificacoes[nome] = require(fullPath);
console.log(cor.roxoClaro(`[VERIFICATION] ${file} loaded.`));
} catch (err) {
console.log(cor.erro(`[ERROR] Failed to load ${file}:`), err);
}
}
}

function watchVerificacoes() {
if (!fs.existsSync(pastaVerif)) return;

for (const file of fs.readdirSync(pastaVerif)) {
if (!file.endsWith(".js")) continue;

const fullPath = path.join(pastaVerif, file);

fs.watchFile(fullPath, { interval: 1000 }, () => {
console.log(cor.aviso(`[RELOAD] Updated verification: ${file}`));
loadVerificacoes();
});
}
}

//=========== PLUGINS / COMANDOS ===========\\
function loadComandos() {
comandos.clear();

if (!fs.existsSync(pastaComandos)) {
fs.mkdirSync(pastaComandos, { recursive: true });
console.log(cor.aviso("[COMMANDS] Folder created: commands"));
return;
}

function percorrer(dir) {
for (const file of fs.readdirSync(dir)) {
const fullPath = path.join(dir, file);
const stat = fs.lstatSync(fullPath);

if (stat.isDirectory()) {
percorrer(fullPath);
continue;
}

if (!file.endsWith(".js")) continue;

try {
delete require.cache[require.resolve(fullPath)];

const comando = require(fullPath);

if (!comando || !Array.isArray(comando.comandos) || typeof comando.handle !== "function") {
console.log(cor.aviso(`[IGNORED] ${file} It does not follow the plugin standard.`));
continue;
}

const relative = path.relative(pastaComandos, fullPath);
const parts = relative.split(path.sep);

let permissao = "geral";

if (parts.length > 1) {
const pasta = parts[0].toLowerCase();

if (pasta === "owner") permissao = "owner";
else if (pasta === "adm") permissao = "adm";
else if (pasta === "vip") permissao = "vip";
}

comando.permissao = comando.permissao || permissao;

for (const cmd of comando.comandos) {
comandos.set(String(cmd).toLowerCase(), comando);
}
} catch (err) {
console.log(cor.erro(`[ERROR] Failed to load command. ${file}:`), err);
}
}
}

percorrer(pastaComandos);
}

function watchComandos() {
if (!fs.existsSync(pastaComandos)) return;

function percorrer(dir) {
for (const file of fs.readdirSync(dir)) {
const fullPath = path.join(dir, file);
const stat = fs.lstatSync(fullPath);

if (stat.isDirectory()) {
percorrer(fullPath);
continue;
}

if (!file.endsWith(".js")) continue;

fs.watchFile(fullPath, { interval: 1000 }, () => {
console.log(cor.aviso(`[RELOAD] Plugin updated: ${file}`));
loadComandos();
});
}
}

percorrer(pastaComandos);
}

//=========== BOT START ===========\\
async function ligarbot() {
const { state, saveCreds } = await useMultiFileAuthState(pastaAuth);
const { version } = await fetchLatestBaileysVersion();

const msgRetryCounterCache = new NodeCache();

const morveth = makeWASocket({
version,
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(
state.keys,
pino({ level: "silent" })
)
},
logger: pino({ level: "silent" }),
printQRInTerminal: false,
browser: ["Ubuntu", "Chrome", "120.0.0.0"],
mobile: false,
generateHighQualityLinkPreview: true,
msgRetryCounterCache,
connectTimeoutMs: 60_000,
defaultQueryTimeoutMs: 0,
keepAliveIntervalMs: 20_000,

patchMessageBeforeSending: (message) => {
const requiresPatch = !!(
message.buttonsMessage ||
message.templateMessage ||
message.listMessage
);

if (requiresPatch) {
message = {
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadataVersion: 2,
deviceListMetadata: {}
},
...message
}
}
};
}

return message;
}
});

//=========== CODE CONNECTION ===========\\
if (!morveth.authState.creds.registered) {
logBox("CODE CONNECTION", "Please provide the bot's number including the country code. Ex.: +5511999999999");

const phoneNumber = await question(cor.roxoClaro("Number: "));

if (!phoneNumber) {
console.log(cor.erro("Error: Please enter a valid number with country code."));
process.exit(1);
}

const numeroLimpo = limparNumero(phoneNumber);
let code = await morveth.requestPairingCode(numeroLimpo);

code = code?.match(/.{1,4}/g)?.join("-") || code;

logBox("PAIRING CODE", `Code: ${code}`);
}

//=========== ALIASES ===========\\
const client = morveth;
const sock = morveth;
const owner = [...ownerJid, ...ownerLid];
//=========== EVENTS ===========\\
morveth.ev.on("creds.update", saveCreds);

morveth.ev.on("chats.set", () => {
console.log(cor.roxo("[CHATS] Heavy conversations."));
});

morveth.ev.on("contacts.set", () => {
console.log(cor.roxo("[CONTACTS] Contacts loaded."));
});

/*morveth.ev.process((events) => {
  console.log(JSON.stringify(events, null, 2))
});*/
//=========== MESSAGES ===========\\
morveth.ev.on("messages.upsert", async ({ messages }) => {
try {
const info = messages?.[0];
console.log(JSON.stringify(info, null, 2))
if (!info || !info.message) return;
if (info.key?.remoteJid === "status@broadcast") return;

const from = info.key.remoteJid;
if (!from) return;

const type = baileys.getContentType(info.message);
const body = getBody(info);

const isGroup = from.endsWith("@g.us");
const isCmd = body.startsWith(prefix);

const semPrefixo = isCmd ? body.slice(prefix.length).trim() : "";
const partes = semPrefixo.split(/ +/).filter(Boolean);
const comanownerme = partes.shift()?.toLowerCase() || "";
const args = partes;
const q = partes.join(" ");
const text = q;

const content = JSON.stringify(info.message);

const sendere2 = info.key.participant?.includes("@lid")
? info.key.participant
: info.key.participantAlt;

const sendere = info.key.participantAlt?.includes("@s.whatsapp.net")
? info.key.participantAlt
: info.key.participant;

const sender2 = sendere2 || from;
const sender = sendere || from;

const pushname = info.pushName || "Sem nome";
const isdono = owner.includes(sender) || owner.includes(sender2);
let metadata = null;
let groupMembers = [];
let participante = null;
let nomeChat = "[Privado]";

if (isGroup) {
try {
metadata = await getMetaCached(morveth, from);
groupMembers = metadata.participants || [];
participante = groupMembers.find((p) => p.id === sender);
nomeChat = `[Group: ${metadata.subject}]`;
} catch {
nomeChat = "[Group: Unknown]";
}
}

const numeroBot = morveth.user?.id?.split(":")[0] + "@s.whatsapp.net";
const isAdm = participante?.admin !== undefined || isdono;

const Dispositivo = info.key.id?.length > 21 ? "Android" : info.key.id?.substring(0, 2) === "3A" ? "iPhone" : "WhatsApp Web";

const isQuotedImage = type === "extendedTextMessage" && content.includes("imageMessage");

const menc = q.replace("@", "") + "@s.whatsapp.net";

const { data, hora } = getDataHora();

const tipoMensagem = getTipoMensagem(type);

//=========== LOGS ===========\\
if (isCmd) {
console.log(
cor.roxoEscuro("\n--------------------------------------------") +
"\n" +
cor.roxoClaro(`User: ${pushname}`) +
"\n" +
cor.titulo(`Command: ${prefix}${comanownerme}`) +
"\n" +
cor.cinza(`Chat: ${nomeChat}`) +
"\n" +
cor.roxoEscuro("--------------------------------------------\n")
);
} else {
console.log(
cor.roxo(`${pushname}`) +
cor.cinza(` it sent ${tipoMensagem} in ${nomeChat} `) +
cor.roxoClaro(`"${body?.slice(0, 60) || "..."}"`)
);
}

//=========== STAMPS ===========\\
const selo = { key: { fromMe: false, participant: "0@s.whatsapp.net"}, message: { extendedTextMessage: { text: `👑🖤 𝑴𝒐𝒓𝒗𝒆𝒕𝒉 — Sovereign of Silence
> “You entered… Now deal with the consequences.”`, title: null, thumbnailUrl: null } } };

//=========== ENVIAR ===========\\
const esperar = async (tempo) =>
new Promise((resolve) => setTimeout(resolve, tempo));

const safeSend = async (jid, msg, options = {}) => {
try {
return await morveth.sendMessage(jid, msg, options);
} catch (err) {
console.log(cor.erro("[ERROR SENDING]"), err);
}
};

async function escrever(texto) {
await morveth.sendPresenceUpdate("composing", from);
await esperar(1000);
return safeSend(from, { text: texto }, { quoted: info });
}

//TEXT
const enviar = async (texto) => safeSend(from, { text: texto }, { quoted: info });
const reply = async (texto) => safeSend(from, { text: texto }, { quoted: info });

//IMAGE
const enviarImg = async (link) => safeSend(from, { image: { url: link } }, { quoted: info });
const enviarImg2 = async (link, texto) => safeSend(from, { image: { url: link }, caption: texto }, { quoted: info });

//GIF
const enviarGif = async (link) => safeSend(from, { video: { url: link }, gifPlayback: true }, { quoted: info });
const enviarGif2 = async (link, texto) => safeSend(from, { video: { url: link }, caption: texto, gifPlayback: true }, { quoted: info });

//VIDEO
const enviarVd = async (link) => safeSend(from, { video: { url: link }, mimetype: "video/mp4", fileName: "video.mp4" }, { quoted: info });
const enviarVd2 = async (link, texto) => safeSend(from, { video: { url: link }, caption: texto, mimetype: "video/mp4", fileName: "video.mp4" }, { quoted: info });

//ADIO
const enviarAd = async (link) => safeSend( from,{audio: { url: link },mimetype: "audio/mpeg"},{ quoted: info });
const enviarAd2 = async (link) => safeSend( from, { audio: { url: link }, mimetype: "audio/mpeg", ptt: true }, { quoted: selo } );

//REACTION
const reagir = async (reassao) => safeSend(from, { react: { text: reassao, key: info.key }});

//=========== COMMANDS ===========\\
if (!isCmd) return;

if (!comandos.has(comanownerme)) {
return safeSend(from, { text: `- *You tried... and failed. Pathetic.*\n> I don't reveal my secrets to just anyone.\n> Prove your worth by using *${prefix}menu*.`},{ quoted: selo });
}

const comando = comandos.get(comanownerme);

if (comando.permissao === "owner" && !isdono) {
return await enviar(msg.owner)
}

if (comando.permissao === "adm" && !isAdm) {
return enviar(msg.adm);
}

if (comando.permissao === "vip" && !isPremium) {
return enviar(msg.vip);
}

 await comando.handle({ files, msg, fotomenu, morveth, client, baileys, fetchJson, getBuffer, getFileBuffer, enviar, escrever, reagir, reply, enviarImg, enviarImg2, enviarGif, enviarGif2, enviarVd, enviarVd2, enviarAd, enviarAd2, data, hora, esperar, selo, info, args, q, text, body, type, sender, sender2, from, groupMembers, metadata, numeroBot, owner, menc, pushname, isdono, isAdm, isGroup, Dispositivo, isQuotedImage, uptimeBot: formatTime(process.uptime()) });
 
} catch (err) {
console.log(cor.erro("[ERROR IN MESSAGES.UPSERT]"), err);
}
});

//=========== CONNECTION ===========\\
morveth.ev.on("connection.update", (update) => {
const { connection, lastDisconnect } = update;

if (connection === "connecting") {
logBox("Connecting", "Starting connection...");
return;
}

if (connection === "open") {
logBox("Connected", "Active session.");
logBox("Status", "Morveth online.");

console.log(cor.roxoEscuro("--------------------------------------------"));
console.log(cor.titulo(" Message logs"));
console.log(cor.roxoEscuro("--------------------------------------------\n"));
return;
}

if (connection === "close") {
const reason = lastDisconnect?.error?.output?.statusCode;

console.log(cor.aviso(`[Closed connection] Code: ${reason || "unknown"}`));

if (reason !== DisconnectReason.loggedOut) {
console.log(cor.aviso("[Reconnecting] Attempting to restore connection..."));

setTimeout(() => {
ligarbot().catch((err) => {
console.log(cor.erro("[Error reconnecting]"), err);
});
}, 3000);

return;
}

console.log(
cor.erro(
"[Disconnected] Session ended. Delete the auth folder and connect again."
)
);
}
});
}

//=========== START ===========\\
loadVerificacoes();
watchVerificacoes();

loadComandos();
watchComandos();

ligarbot().catch((err) => {
console.log(cor.erro("[Error connecting bot]"), err);
});

//=========== AUTO RESTART DO INDEX ===========\\
fs.watchFile(__filename, { interval: 1000 }, (curr, prev) => {
if (curr.mtime.getTime() !== prev.mtime.getTime()) {
console.log(cor.aviso("[LOG] Main file changed. Restarting..."));
process.exit();
}
});

//=========== END ===========\\