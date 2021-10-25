const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const configs = require("../config.json");
const google = require("googleapis");

const youtube = new google.youtube_v3.Youtube({
  version: "v3",
  auth: configs.GOOGLE_KEY,
});

const client = new Discord.Client();

const prefix = configs.PREFIX;

const servidor = {
  server: {
    connection: null,
    dispatcher: null,
    fila: [],
    estouTocando: false
  },
};

client.on("ready", () => {
  console.log("estou online");
});

client.on("message", async (msg) => {
  // filter
  if (!msg.guild) return;

  if (!msg.content.startsWith(prefix)) return;

  if (!msg.member.voice.channel) {
    msg.channel.send("Você precisa me mamar em canal de voz arrombado!");
    return;
  }

  // comands
  if (msg.content === prefix + "join") {
    try {
      servidor.server.connection = await msg.member.voice.channel.join();
    } catch (err) {
      console.log("Error ao entrar no voice!");
      console.log(err);
    }
  }
  if (msg.content === prefix + "leave") {
    msg.member.voice.channel.leave();
    servidor.server.connection = null;
    servidor.server.dispatcher = null;
  }

  if (msg.content.startsWith(prefix + "play")) {
    let tocaRaul = msg.content.slice(6);

    if (tocaRaul.length === 0) {
      msg.channel.send("Preciso de algo para tocar seu NOIA!");
      return;
    }

    if (servidor.server.connection === null) {
      try {
        servidor.server.connection = await msg.member.voice.channel.join();
      } catch (err) {
        console.log("Erro ao entrar num canal de voz");
        console.log(err);
      }
    }

    if (ytdl.validateURL(tocaRaul)) {
      servidor.server.fila.push(tocaRaul)
      console.log('adicionado' + tocaRaul)

    } else {
      youtube.search.list(
        {
          q: tocaRaul,
          part: "snippet",
          fields: "items(id(videoId),snippet(title))",
          type: "video",
        },
        function (err, resultado) {
          if (err) {
            console.log(err);
          }
          if (resultado) {
            const id = resultado.data.items[0].id.videoId
            tocaRaul = 'https://www.youtube.com/watch?v=' + id
            servidor.server.fila.push(tocaRaul)
            console.log('adicionado' + tocaRaul)
          }
        }
      );
    }

    tocarMusica()

  }

  if (msg.content === prefix + "pause") {
    servidor.server.dispatcher.pause();
  }

  if (msg.content === prefix + "resume") {
    servidor.server.dispatcher.resume();
  }
});


const tocarMusica = () => {
    if (servidor.server.estouTocando = false) {
        const tocando = servidor.server.fila[0]
        servidor.server.estouTocando = true;
    
    
        servidor.server.dispatcher = servidor.server.connection.play(ytdl(tocando, configs.YTDL))
        servidor.server.dispatcher.on('finish', () => {
            servidor.server.fila.shift()
            servidor.server.estouTocando = false;
            if (servidor.server.fila.length > 0) {
                tocarMusica();
            }
            else {
                servidor.server.dispatcher = null
            }
        })
    }
}

client.login(configs.TOKEN_DISCORD);
