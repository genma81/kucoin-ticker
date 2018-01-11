require('dotenv').config()

const fetch = require('node-fetch')
const slackwebhook = process.env.SLACK_WEBHOOK

const symbols = [
  {
    name: 'DBC',
    color: '#41c2d2',

  }, {
    name: 'VEN',
    color: '#8E86D5'
  }, {
    name: 'PRL',
    color: '#315cab'
  }
]

let exchange = ['BTC', 'ETH']
let ticks = []
let attachments = []

const slackmsg = {
  username: 'kucoin bot',
  icon_emoji: ':robot:',
  attachments: attachments
}

let symbolpromises = symbols.map((symbol, symbolindex) => {
  attachments.push({
    author_name: symbol.name,
    author_icon: 'https://assets.kucoin.com/www/1.2.6/assets/coins/' + symbol.name + '.png',
    color: symbol.color,
    fields: [
      {
        title: 'BTC',
        value: '',
        short: true
      }, {
        title: 'ETH',
        value: '',
        short: true
      },
    ]
  })

  let exchangepromises = exchange.map((exchange, exchangeindex) => {
    return fetch('https://api.kucoin.com/v1/open/tick?symbol=' + symbol.name + '-' + exchange)
      .then(res => res.json())
      .then(res => {
        attachments[symbolindex].fields[exchangeindex].value = 'last price: ' + res.data.lastDealPrice + '\n change rate: ' + Number(res.data.changeRate * 100).toFixed(2) + '%'
      })
  })

  return Promise.all(exchangepromises)
})

Promise.all(symbolpromises)
  .then(() => {
    fetch(slackwebhook, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackmsg)
    })
  })
