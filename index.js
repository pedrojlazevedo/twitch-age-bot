const express = require('express')
const request = require('request')
const app = express()
const fs = require('fs');
const { promisify } = require('util')
const readFile = promisify(fs.readFile)

const GPT_MODE = process.env.GPT_MODE

let file_context = "You are a helpful Twitch Chatbot."

const messages = [
  {role: "assistant", content: "Personifica o streamer."}
];

console.log("GPT_MODE is " + GPT_MODE)
console.log("History length is " + process.env.HISTORY_LENGTH)
console.log("OpenAI API Key:" + process.env.OPENAI_API_KEY)

app.use(express.json({extended: true, limit: '1mb'}))

const mjerticla_id = 6600634

const civ_mapping = {
    'holy_roman_empire': 'HRE',
    'rus': 'RUS',
    'mongols': 'Mongol',
    'chinese': 'China',
    'delhi_sultanate': 'Delhi',
    'english': 'ENG',
    'ottomans': 'Otto',
    'abbasid_dynasty': 'Abba',
    'french': 'FR',
    'malians': 'Malian'
}

const open_file = async (filepath) => {
    const file = await readFile(filepath, 'utf-8');
    return file;
}

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
})

app.all('/rank', (req, res) => {
    console.log("Test")
    res.send("Perfect <3")
})

app.all('/top/br', (req, res) => {
  let page = 1;
  const n_pages = 3;
  let all_players = [];
  console.log("Hello");
  for (let i = 0; i < n_pages; i++) {
    console.log("Before request: " + str(i))
    request.get({
          url: "https://aoe4world.com/api/v0/leaderboards/rm_solo?page=" + page,
          json: true
      }, (error, response) => {
        if (error) {
            return res.send("Something went wrong! HEEEEELP");
        }
      let body = response.body;
      console.log(body.players);
      all_players = all_players.concat(body.players);
      page = page + 1;
    })
  }
  
  let message = ""
  for (let i = 0; i < all_players.lenght; i++) {
      if (all_players[i].country == "br") {
          message = message + str(i+1) + ". " + all_players[i].name + " - " + all_players[i].rating
      }
  }
  console.log(message);
  res.send(message);
})

app.get('/rank/:name', (req, res) => {
    const player_name = req.params.name

    request.get({
        url: "https://aoe4world.com/api/v0/players/search?query=" + player_name ,
        json: true
    }, (error, response) => {
        let body = response.body
        if (error) {
            return res.send("Something went wrong! HEEEEELP");
        }

        let answer = 'Player: ' + body.players[0].name + " <-> "

        if (body.players.length === 0) {
            res.send('No player with the name - ' + player_name + ' - was found.')
        }
        if (body.players[0].leaderboards.rm_solo) {
            answer = answer + '\n' + '[Solo] - ' +
                body.players[0].leaderboards.rm_solo.rank_level + ' - ' +
                body.players[0].leaderboards.rm_solo.rating + ' <-> '
        } else {
            answer = answer + '\n' + '[Solo] - Unranked <-> '
        }
        if (body.players[0].leaderboards.rm_team) {
            answer = answer + '\n' + '[Team] - ' +
                body.players[0].leaderboards.rm_team.rank_level + ' - ' +
                body.players[0].leaderboards.rm_team.rating
        } else {
            answer = answer + '\n' + '[Team] - Unranked'
        }
        res.send(answer)
    })
})

app.all('/match', (req, res) => {
    request.get({
        url: "https://aoe4world.com/api/v0/players/" + String(mjerticla_id) + "/games",
        json: true
    }, (error, response) => {
        let body = response.body
        if (error) {
            return res.send("Something went wrong! HEEEEELP");
        }
        let last_game = body.games[0]  // get last game
        if (last_game.ongoing) {
            let answer = "["
            answer = answer + last_game.server + "]"
            answer = answer + " <-> " + last_game.map
            const teams = last_game.teams
            for (let i = 0; i < teams.length; i++) {
                if (i == 0) {
                    answer = answer + " <-> ["
                } else {
                    answer = answer + " VS ["
                }
                for (let j = 0; j < teams[i].length; j++) {
                    const player = teams[i][j].player
                    const player_civ_name = "(" + civ_mapping[player.civilization] + ")" + player.name 
                    if (j == 0) {
                        answer = answer + player_civ_name
                    } else {
                        answer = answer + " + " + player_civ_name
                    }
                    if (player.rating) {
                        answer = answer + "(" + player.rating + ")"
                    }
                }
                answer = answer + "]"
            }
            res.send(answer)
        } else {
            res.send("O teu streamer favorito não está a jogar nenhum jogo :(")
        }
    })
})

app.get('/match/:name', (req, res) => {
    const player_name = req.params.name
    console.log(player_name)
    let player_id = 0

    // get user id
    request.get({
        url: "https://aoe4world.com/api/v0/players/search?query=" + player_name,
        json: true
    }, (error, response) => {
        console.log(response)
        let body = response.body
        if (error) {
            return res.send("Não encontrei o nome desse jogador");
        }
        console.log("--body--")
        console.log(body.players[0])
        player_id = body.players[0].profile_id

            console.log(player_id === 0)
        console.log(player_id)
        if (player_id === 0) {
            res.send("Não encontrei o nome desse jogador.")
        }
        request.get({
            url: "https://aoe4world.com/api/v0/players/" + String(player_id) + "/games",
            json: true
        }, (error, response) => {
            let body = response.body
            if (error) {
                return res.send("Something went wrong! HEEEEELP");
            }
            let last_game = body.games[0]  // get last game
            if (last_game.ongoing) {
                let answer = "["
                answer = answer + last_game.server + "]"
                answer = answer + " <-> " + last_game.map
                const teams = last_game.teams
                for (let i = 0; i < teams.length; i++) {
                    if (i === 0) {
                        answer = answer + " <-> ["
                    } else {
                        answer = answer + " VS ["
                    }
                    for (let j = 0; j < teams[i].length; j++) {
                        const player = teams[i][j].player
                        const player_civ_name = "(" + civ_mapping[player.civilization] + ")" + player.name
                        if (j === 0) {
                            answer = answer + player_civ_name
                        } else {
                            answer = answer + " + " + player_civ_name
                        }
                        if (player.rating) {
                            answer = answer + "(" + player.rating + ")"
                        }
                    }
                    answer = answer + "]"
                }
                res.send(answer)
            } else {
                res.send("Esse jogador não está a jogar nenhum jogo... :(")
            }
        })
    })
})

if (process.env.GPT_MODE === "CHAT"){

  fs.readFile("./diogo.txt", 'utf8', function(err, data) {
    if (err) throw err;
    console.log("Reading context file and adding it as system level message for the agent.")
    messages[0].content = data;
  });

} else {

  fs.readFile("./diogo.txt", 'utf8', function(err, data) {
    if (err) throw err;
    console.log("Reading context file and adding it in front of user prompts:")
    file_context = data;
    console.log(file_context);
  });
}

app.get('/gpt/:text', async (req, res) => {

    // The agent should recieve Username:Message in the text to identify conversations 
    // with different users in his history. 

    const text = req.params.text
    const { Configuration, OpenAIApi } = require("openai");

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);      

    if (GPT_MODE === "CHAT"){
      //CHAT MODE EXECUTION

      //Add user message to  messages
      messages.push({role: "user", content: text})
      //Check if message history is exceeded
      console.log("Conversations in History: " + ((messages.length / 2) -1) + "/" + process.env.HISTORY_LENGTH)
      if(messages.length > ((process.env.HISTORY_LENGTH * 2) + 1)) {
          console.log('Message amount in history exceeded. Removing oldest user and agent messages.')
          messages.splice(1,2)
     }

      console.log("Messages: ")
      console.dir(messages)
      console.log("User Input: " + text)

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 1,
        max_tokens: 124,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      if (response.data.choices) {
        console.log ("Agent answer: " + response.data.choices[0].message.content)
        messages.push({role: "assistant", content: response.data.choices[0].message.content})
        res.send(response.data.choices[0].message.content.slice(0, 399))
      } else {
        res.send("Something went wrong. Try again later!")
      }

    } else {
      //PROMPT MODE EXECUTION
      const prompt = file_context + "\n\nQ:" + text + "\nA:";
      console.log("User Input: " + text)

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.5,
        max_tokens: 128,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      if (response.data.choices) {
          console.log ("Agent answer: " + response.data.choices[0].text)
          res.send(response.data.choices[0].text.slice(0, 399))
      } else {
          res.send("Something went wrong. Try again later!")
      }
    }

})

app.listen(process.env.PORT || 3000)
