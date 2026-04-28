# Morveth Bot Base

![Morveth Banner](https://uploads.speedhostingg.cloud/uploads/lvcZXjY1P5.jpg)

> A modular WhatsApp bot base designed for learning, tutorials, and command development in a simple, clean, and scalable way.

---

## 📌 About the Project

**Morveth Bot Base** was built with a focus on organization, learning, and maintainability.

The main idea is to separate commands into files and categories, avoiding large messy code with multiple `case` statements inside `index.js`.

---

## 📁 Project Structure

```bash
├── commands
│   ├── adm
│   ├── owner
│   ├── vip
│   ├── menu.js
│   ├── pergunta.js
│   └── template.js
│
├── files
│   ├── audio
│   ├── database
│   ├── images
│   ├── utils
│   └── video
│
├── index.js
├── owner
│   └── config.json
├── package.json
└── start.sh
```

---

## ⚙️ Creating a Command

```js
const {
  prefix,
  botName,
  ownerName,
  ownerJid,
  ownerLid,
  ownerLink
} = require("../owner/config.json");

module.exports = {
  nome: "NAME",
  descricao: "DESCRIPTION",
  comandos: ["command", "command2"],
  uso: \`${prefix}command\`,

  handle: async ({ reply }) => {
    reply("Working!");
  },
};
```

---

## 🧠 Available Functions

```
files, msg, fotomenu, morveth, client, baileys,
fetchJson, getBuffer, getFileBuffer,
enviar, escrever, reagir, reply,
enviarImg, enviarImg2,
enviarGif, enviarGif2,
enviarVd, enviarVd2,
enviarAd, enviarAd2,
data, hora, esperar,
selo, info, args, q, text, body, type,
sender, sender2, from,
groupMembers, metadata,
numeroBot, owner, menc, pushname,
isdono, isAdm, isGroup,
Dispositivo, isQuotedImage,
uptimeBot
```

---

## 🔐 Configuration

```json
{
  "prefix": "!",
  "botName": "Morveth",
  "ownerName": "Pedrozz Mods",
  "ownerJid": ["559999999999@s.whatsapp.net"],
  "ownerLid": ["559999999999@lid"],
  "ownerLink": "https://wa.me/559999999999"
}
```

---

## 📦 Installation

```bash
npm install
```

---

## ▶️ Run the Bot

```bash
node index.js
```

or

```bash
bash start.sh
```

---

## 👑 Author

Pedrozz Mods
