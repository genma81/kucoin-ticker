require('dotenv').config()

const fetch = require('node-fetch')
const slackwebhook = process.env.SLACK_WEBHOOK

const symbols = [
  {
    name: 'DBC',
    color: '#41c2d2',
    price: ''
  }, {
    name: 'VEN',
    color: '#8E86D5',
    price: ''
  }, {
    name: 'PRL',
    color: '#315cab',
    price: ''
  }
]

let exchanges = [
  {
    name: 'BTC',
    price: ''
  }, {
    name: 'ETH',
    price: ''
  }
]

let ticks = []
let attachments = []

const slackmsg = {
  username: 'kucoin bot',
  icon_emoji: ':robot:',
  text: '',
  attachments: attachments
}

fetch('https://api.kucoin.com/v1/open/currencies?coins=BTC,ETH')
  .then(res => res.json())
  .then(res => {
    return exchanges.map((exchange, index) => {
      switch (exchange.name) {
        case 'BTC':
          return exchanges[index].price = res.data.rates.BTC.USD
        case 'ETH':
          return exchanges[index].price = res.data.rates.ETH.USD
      }
    })
  })
  .then(() => {
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

      let exchangepromises = exchanges.map((exchange, exchangeindex) => {
        return fetch('https://api.kucoin.com/v1/open/tick?symbol=' + symbol.name + '-' + exchange.name)
          .then(res => res.json())
          .then(res => {
            attachments[symbolindex].fields[exchangeindex].value = 'last: ' + res.data.lastDealPrice + '\n rate: ' + Number(res.data.changeRate * 100).toFixed(2) + '%' + '\n price: $' + (Number(res.data.lastDealPrice) * exchange.price).toFixed(3)

            if (exchange.name === 'BTC') {
              symbols[symbols.findIndex(item => item.name === symbol.name)].price = '$' + (Number(res.data.lastDealPrice) * exchange.price).toFixed(3)
            }
          })
      })

      return Promise.all(exchangepromises)
    })

    Promise.all(symbolpromises)
      .then(() => {
        symbols.map(symbol => {
          if (!slackmsg.text) {
            slackmsg.text = symbol.name + ': $' + symbol.price
          } else {
            slackmsg.text = slackmsg.text + ' | ' + symbol.name + ': $' + symbol.price
          }
        })
      })
      .then(() => {
        fetch(slackwebhook, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(slackmsg)
        })
      })
  })

