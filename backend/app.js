const express = require('express')
const supertokens = require("supertokens-node")
const Session = require("supertokens-node/recipe/session")
const app = express()
const port = 8000

supertokens.init({
  framework: "express",
  supertokens: {
      // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
      connectionURI: process.env.SUPERTOKEN_CONNECT_URI,
      apiKey: process.env.SUPETOKEN_CONNECT_KEY
      // apiKey: "IF YOU HAVE AN API KEY FOR THE CORE, ADD IT HERE",
  },
  appInfo: {
      // learn more about this on https://supertokens.com/docs/session/appinfo
      appName: "One click DAO builder",
      apiDomain: "http://localhost:8000",
      websiteDomain: "http://localhost:3000",
      apiBasePath: "/auth",
      websiteBasePath: "/auth"
  },
  recipeList: [
      Session.init()
  ]
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})